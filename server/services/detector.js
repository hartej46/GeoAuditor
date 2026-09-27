/**
 * Brand Mention Detector
 * 
 * Detects whether a brand name appears in AI-generated answer text
 * and/or its cited sources. Works for both AI Overview and AI Mode responses.
 * 
 * Spec ref: P0 #3 — "Detect whether the target brand appears anywhere in the
 *   AI-generated answer text or its cited sources (yes/no + the matching snippet if yes)."
 * Spec ref: P0 #4 — "Run the same detection for each competitor, side by side."
 */

/**
 * Extract all text content from AI Overview response.
 * Handles text_blocks (paragraphs, lists, headings) and markdown.
 * @param {object} aiOverview - The ai_overview object from SerpApi
 * @returns {{ textSnippets: string[], sources: {title: string, link: string}[] }}
 */
function extractAIOverviewContent(aiOverview) {
  const textSnippets = [];
  const sources = [];

  if (!aiOverview) return { textSnippets, sources };

  // Extract from text_blocks
  if (aiOverview.text_blocks) {
    for (const block of aiOverview.text_blocks) {
      if (block.snippet) {
        textSnippets.push(block.snippet);
      }
      // List items
      if (block.list) {
        for (const item of block.list) {
          if (item.title) textSnippets.push(item.title);
          if (item.snippet) textSnippets.push(item.snippet);
        }
      }
    }
  }

  // Also grab the full markdown if available (broader search surface)
  if (aiOverview.markdown) {
    textSnippets.push(aiOverview.markdown);
  }

  // Extract cited sources
  if (aiOverview.reference_links) {
    for (const ref of aiOverview.reference_links) {
      sources.push({
        title: ref.title || '',
        link: ref.link || '',
      });
    }
  }

  return { textSnippets, sources };
}

/**
 * Extract all text content from AI Mode response.
 * Handles text_blocks and reconstructed_markdown.
 * @param {object} aiModeResponse - Full AI Mode API response
 * @returns {{ textSnippets: string[], sources: {title: string, link: string}[] }}
 */
function extractAIModeContent(aiModeResponse) {
  const textSnippets = [];
  const sources = [];

  if (!aiModeResponse) return { textSnippets, sources };

  // Extract from text_blocks
  if (aiModeResponse.text_blocks) {
    for (const block of aiModeResponse.text_blocks) {
      if (block.snippet) {
        textSnippets.push(block.snippet);
      }
      if (block.list) {
        for (const item of block.list) {
          if (item.title) textSnippets.push(item.title);
          if (item.snippet) textSnippets.push(item.snippet);
        }
      }
    }
  }

  // reconstructed_markdown — broader search surface
  if (aiModeResponse.reconstructed_markdown) {
    textSnippets.push(aiModeResponse.reconstructed_markdown);
  }

  // Extract cited references
  if (aiModeResponse.references) {
    for (const ref of aiModeResponse.references) {
      sources.push({
        title: ref.title || '',
        link: ref.link || '',
      });
    }
  }

  return { textSnippets, sources };
}

/**
 * Clean UI artifacts, unescape markdown, and strip trailing bare URLs from snippet text.
 * @param {string} text
 * @returns {string}
 */
function cleanRawText(text) {
  if (!text) return '';
  return text
    // 1. Strip Google UI chrome / accessibility strings
    .replace(/Go to product viewer dialog for this item\.?/gi, '')
    .replace(/Go to product viewer\.?/gi, '')
    .replace(/View product details\.?/gi, '')
    .replace(/Product viewer dialog\.?/gi, '')
    // 2. Unescape escaped markdown punctuation \( "Immersive Audio" \)
    .replace(/\\([()[\]"'*_{}])/g, '$1')
    // 3. Remove raw citation bracket markers e.g. [5], [1, 2]
    .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
    // 4. Remove bare google search / redirect URLs or trailing markdown URLs
    .replace(/\(https?:\/\/[^\s)]+\)/g, '')
    .replace(/https?:\/\/[^\s)]+/g, '')
    // 5. Clean up multiple spaces, broken parens
    .replace(/\s{2,}/g, ' ')
    .replace(/\(\s*\)/g, '')
    .trim();
}

/**
 * Find all occurrences of a brand name in a text, returning surrounding context.
 * Case-insensitive. Returns up to CONTEXT_CHARS characters around each match.
 * Snaps to clean word boundaries and avoids broken URL fragments.
 * @param {string} brandName
 * @param {string} rawText
 * @returns {string[]} Array of snippet strings showing the match in context
 */
function findMentions(brandName, rawText) {
  const CONTEXT_CHARS = 90;
  const mentions = [];
  const text = cleanRawText(rawText);
  const lowerText = text.toLowerCase();
  const lowerBrand = brandName.toLowerCase();
  let startFrom = 0;

  while (true) {
    const idx = lowerText.indexOf(lowerBrand, startFrom);
    if (idx === -1) break;

    let snippetStart = Math.max(0, idx - CONTEXT_CHARS);
    // Snap to word boundary if not at start
    if (snippetStart > 0) {
      const spaceIdx = text.indexOf(' ', snippetStart);
      if (spaceIdx !== -1 && spaceIdx < idx) {
        snippetStart = spaceIdx + 1;
      }
    }

    let snippetEnd = Math.min(text.length, idx + brandName.length + CONTEXT_CHARS);
    // Snap to word boundary if not at end
    if (snippetEnd < text.length) {
      const spaceIdx = text.lastIndexOf(' ', snippetEnd);
      if (spaceIdx !== -1 && spaceIdx > idx + brandName.length) {
        snippetEnd = spaceIdx;
      }
    }

    let snippet = text.slice(snippetStart, snippetEnd).trim();

    // Strip unclosed parenthesis or trailing broken URL at end
    snippet = snippet.replace(/\(https?:\/\/[^)]*$/i, '').replace(/https?:\/\/[^\s]*$/i, '').trim();

    // Remove any trailing open punctuation
    snippet = snippet.replace(/[\s(,;:-]+$/, '');

    // Add ellipsis for truncated context
    if (snippetStart > 0 && !snippet.startsWith('…')) snippet = '…' + snippet;
    if (snippetEnd < text.length && !snippet.endsWith('…') && !snippet.endsWith('.')) snippet = snippet + '…';

    if (snippet.length > brandName.length + 5) {
      mentions.push(snippet);
    }
    startFrom = idx + brandName.length;
  }

  return mentions;
}

/**
 * Detect whether a brand appears in AI-generated content.
 * 
 * @param {string} brandName - The brand/product name to search for
 * @param {object} aiOverviewData - Full Google search response (contains ai_overview key)
 * @param {object} aiModeData - Full AI Mode API response
 * @returns {{
 *   aiOverview: { found: boolean, snippets: string[], inSources: boolean, matchedSources: string[] },
 *   aiMode: { found: boolean, snippets: string[], inSources: boolean, matchedSources: string[] }
 * }}
 */
function detect(brandName, aiOverviewData, aiModeData) {
  const result = {
    aiOverview: { found: false, snippets: [], inSources: false, matchedSources: [] },
    aiMode: { found: false, snippets: [], inSources: false, matchedSources: [] },
  };

  // --- AI Overview Detection ---
  const overviewContent = extractAIOverviewContent(
    aiOverviewData ? aiOverviewData.ai_overview : null
  );

  // Search answer text
  for (const text of overviewContent.textSnippets) {
    const mentions = findMentions(brandName, text);
    if (mentions.length > 0) {
      result.aiOverview.found = true;
      result.aiOverview.snippets.push(...mentions);
    }
  }

  // Search cited sources (title + URL)
  for (const source of overviewContent.sources) {
    const inTitle = source.title.toLowerCase().includes(brandName.toLowerCase());
    const inLink = source.link.toLowerCase().includes(brandName.toLowerCase());
    if (inTitle || inLink) {
      result.aiOverview.inSources = true;
      result.aiOverview.matchedSources.push(source.title || source.link);
    }
  }

  // If found in sources but not in text, still mark as found
  if (result.aiOverview.inSources && !result.aiOverview.found) {
    result.aiOverview.found = true;
  }

  // --- AI Mode Detection ---
  const aiModeContent = extractAIModeContent(aiModeData);

  // Search answer text
  for (const text of aiModeContent.textSnippets) {
    const mentions = findMentions(brandName, text);
    if (mentions.length > 0) {
      result.aiMode.found = true;
      result.aiMode.snippets.push(...mentions);
    }
  }

  // Search cited sources
  for (const source of aiModeContent.sources) {
    const inTitle = source.title.toLowerCase().includes(brandName.toLowerCase());
    const inLink = source.link.toLowerCase().includes(brandName.toLowerCase());
    if (inTitle || inLink) {
      result.aiMode.inSources = true;
      result.aiMode.matchedSources.push(source.title || source.link);
    }
  }

  if (result.aiMode.inSources && !result.aiMode.found) {
    result.aiMode.found = true;
  }

  // Deduplicate snippets
  result.aiOverview.snippets = [...new Set(result.aiOverview.snippets)];
  result.aiMode.snippets = [...new Set(result.aiMode.snippets)];
  result.aiOverview.matchedSources = [...new Set(result.aiOverview.matchedSources)];
  result.aiMode.matchedSources = [...new Set(result.aiMode.matchedSources)];

  return result;
}

module.exports = {
  detect,
  cleanRawText,
  findMentions,
  extractAIOverviewContent,
  extractAIModeContent,
};
