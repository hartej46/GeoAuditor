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

  // Support both direct and nested ai_overview (e.g. from deferred page_token fetch)
  const data = aiOverview.ai_overview || aiOverview;

  // Extract from text_blocks
  if (data.text_blocks && Array.isArray(data.text_blocks)) {
    for (const block of data.text_blocks) {
      if (block.snippet) textSnippets.push(block.snippet);
      if (block.text) textSnippets.push(block.text);
      if (block.title) textSnippets.push(block.title);
      if (block.heading) textSnippets.push(block.heading);

      // List items
      if (block.list && Array.isArray(block.list)) {
        for (const item of block.list) {
          if (typeof item === 'string') {
            textSnippets.push(item);
          } else if (item && typeof item === 'object') {
            if (item.title) textSnippets.push(item.title);
            if (item.snippet) textSnippets.push(item.snippet);
            if (item.text) textSnippets.push(item.text);
          }
        }
      }

      // Table support (rows, cells, tabular comparisons)
      if (block.table) {
        if (Array.isArray(block.table)) {
          for (const row of block.table) {
            if (Array.isArray(row)) textSnippets.push(row.join(' — '));
            else if (typeof row === 'object') textSnippets.push(Object.values(row).filter(v => typeof v === 'string').join(' — '));
          }
        }
      }
      if (block.rows && Array.isArray(block.rows)) {
        for (const row of block.rows) {
          if (Array.isArray(row)) textSnippets.push(row.join(' — '));
          else if (typeof row === 'object') textSnippets.push(Object.values(row).filter(v => typeof v === 'string').join(' — '));
        }
      }
    }
  }

  // Also grab markdown / reconstructed_markdown if available
  if (data.markdown) textSnippets.push(data.markdown);
  if (data.reconstructed_markdown) textSnippets.push(data.reconstructed_markdown);

  // Extract cited sources from either references or reference_links
  const refs = data.references || data.reference_links || [];
  for (const ref of refs) {
    sources.push({
      title: ref.title || '',
      link: ref.link || '',
      snippet: ref.snippet || '',
      source: ref.source || ''
    });
  }

  return { textSnippets, sources };
}

/**
 * Extract all text content from AI Mode response.
 * Handles text_blocks, reconstructed_markdown, and references.
 * @param {object} aiModeResponse - Full AI Mode API response
 * @returns {{ textSnippets: string[], sources: {title: string, link: string}[] }}
 */
function extractAIModeContent(aiModeResponse) {
  const textSnippets = [];
  const sources = [];

  if (!aiModeResponse) return { textSnippets, sources };

  const data = aiModeResponse.ai_mode || aiModeResponse;

  // Extract from text_blocks
  if (data.text_blocks && Array.isArray(data.text_blocks)) {
    for (const block of data.text_blocks) {
      if (block.snippet) textSnippets.push(block.snippet);
      if (block.text) textSnippets.push(block.text);
      if (block.title) textSnippets.push(block.title);
      if (block.heading) textSnippets.push(block.heading);

      if (block.list && Array.isArray(block.list)) {
        for (const item of block.list) {
          if (typeof item === 'string') {
            textSnippets.push(item);
          } else if (item && typeof item === 'object') {
            if (item.title) textSnippets.push(item.title);
            if (item.snippet) textSnippets.push(item.snippet);
            if (item.text) textSnippets.push(item.text);
          }
        }
      }

      // Table support
      if (block.table) {
        if (Array.isArray(block.table)) {
          for (const row of block.table) {
            if (Array.isArray(row)) textSnippets.push(row.join(' — '));
            else if (typeof row === 'object') textSnippets.push(Object.values(row).filter(v => typeof v === 'string').join(' — '));
          }
        }
      }
      if (block.rows && Array.isArray(block.rows)) {
        for (const row of block.rows) {
          if (Array.isArray(row)) textSnippets.push(row.join(' — '));
          else if (typeof row === 'object') textSnippets.push(Object.values(row).filter(v => typeof v === 'string').join(' — '));
        }
      }
    }
  }

  // reconstructed_markdown & markdown
  if (data.reconstructed_markdown) textSnippets.push(data.reconstructed_markdown);
  if (data.markdown) textSnippets.push(data.markdown);

  // Extract cited references
  const refs = data.references || data.reference_links || [];
  for (const ref of refs) {
    sources.push({
      title: ref.title || '',
      link: ref.link || '',
      snippet: ref.snippet || '',
      source: ref.source || ''
    });
  }

  return { textSnippets, sources };
}

/**
 * Clean UI artifacts, unescape markdown, and strip trailing bare URLs from snippet text.
 * Also removes international Google product viewer accessibility labels.
 * @param {string} text
 * @returns {string}
 */
function cleanRawText(text) {
  if (!text) return '';
  return text
    // 1. Strip Google UI chrome / accessibility strings (English and international)
    .replace(/Go to product viewer dialog for this item\.?/gi, '')
    .replace(/Go to product viewer\.?/gi, '')
    .replace(/View product details\.?/gi, '')
    .replace(/Product viewer dialog\.?/gi, '')
    .replace(/この商品をプロダクト\s*ビューアで確認します。?/gi, '')
    .replace(/この商品をプロダクト\s*ビューアで確認。?/gi, '')
    .replace(/プロダクト\s*ビューア[^\s。.]*[。.]?/gi, '')
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
 * Generates search variants for an entity name to catch realistic syntax/formatting variations.
 * E.g. "Sony WH-1000XM5" -> ["sony wh-1000xm5", "wh-1000xm5", "sony wh1000xm5", "wh1000xm5"]
 * E.g. "Apple AirPods Max" -> ["apple airpods max", "airpods max"]
 * E.g. "Bose QuietComfort Ultra" -> ["bose quietcomfort ultra", "quietcomfort ultra", "qc ultra"]
 * E.g. "Sennheiser Momentum 4" -> ["sennheiser momentum 4", "momentum 4"]
 * @param {string} entityName
 * @returns {string[]}
 */
function getEntityVariants(entityName) {
  if (!entityName || typeof entityName !== 'string') return [];
  const clean = entityName.trim();
  const lower = clean.toLowerCase();
  const variants = new Set([lower]);

  // Remove common brand prefix if multi-word: "Apple AirPods Max" -> "airpods max"
  const brandPrefixes = ['apple', 'sony', 'bose', 'sennheiser', 'google', 'samsung', 'anker', 'jbl', 'microsoft', 'beats'];
  const words = lower.split(/\s+/);
  if (words.length > 1 && brandPrefixes.includes(words[0])) {
    variants.add(words.slice(1).join(' '));
  }

  // Handle hyphens: "wh-1000xm5" <-> "wh 1000xm5" <-> "wh1000xm5"
  if (lower.includes('-')) {
    variants.add(lower.replace(/-/g, ' '));
    variants.add(lower.replace(/-/g, ''));
  }

  // Specific common abbreviations
  if (lower.includes('quietcomfort')) {
    variants.add(lower.replace('quietcomfort', 'qc'));
    variants.add('quietcomfort ultra');
    variants.add('qc ultra');
  }

  // Strip trailing generation suffix like (2nd gen), 2, etc. if provided in entity name
  const strippedGen = lower.replace(/\s*(?:\([^)]*\)|\b(?:2nd\s*gen|gen\s*\d+|\d+)\b)$/i, '').trim();
  if (strippedGen.length >= 3) {
    variants.add(strippedGen);
  }

  return Array.from(variants).filter(v => v.length >= 3);
}

/**
 * Find all occurrences of a brand name in a text, returning surrounding context.
 * Case-insensitive. Snaps to clean word boundaries and avoids broken URL fragments.
 * @param {string} brandName
 * @param {string} rawText
 * @returns {string[]} Array of snippet strings showing the match in context
 */
function findMentions(brandName, rawText) {
  const CONTEXT_CHARS = 90;
  const mentions = [];
  const text = cleanRawText(rawText);
  // Normalize possessive 's for matching
  const normalizedText = text.replace(/['’]s\b/gi, 's');
  const lowerText = normalizedText.toLowerCase();
  const variants = getEntityVariants(brandName);

  for (const variant of variants) {
    let startFrom = 0;
    while (true) {
      const idx = lowerText.indexOf(variant, startFrom);
      if (idx === -1) break;

      let snippetStart = Math.max(0, idx - CONTEXT_CHARS);
      // Snap to word boundary if not at start
      if (snippetStart > 0) {
        const spaceIdx = text.indexOf(' ', snippetStart);
        if (spaceIdx !== -1 && spaceIdx < idx) {
          snippetStart = spaceIdx + 1;
        }
      }

      let snippetEnd = Math.min(text.length, idx + variant.length + CONTEXT_CHARS);
      // Snap to word boundary if not at end
      if (snippetEnd < text.length) {
        const spaceIdx = text.lastIndexOf(' ', snippetEnd);
        if (spaceIdx !== -1 && spaceIdx > idx + variant.length) {
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

      if (snippet.length > variant.length + 5 && !mentions.includes(snippet)) {
        mentions.push(snippet);
      }
      startFrom = idx + variant.length;
    }
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
    aiOverview: { found: false, foundInSources: false, inSources: false, snippets: [], matchedSources: [] },
    aiMode: { found: false, foundInSources: false, inSources: false, snippets: [], matchedSources: [] },
  };

  const variants = getEntityVariants(brandName);

  // --- AI Overview Detection ---
  const overviewContent = extractAIOverviewContent(
    aiOverviewData ? aiOverviewData.ai_overview : null
  );

  // Search answer text (strictly synthesized Google AI answer content)
  for (const text of overviewContent.textSnippets) {
    const mentions = findMentions(brandName, text);
    if (mentions.length > 0) {
      result.aiOverview.found = true;
      result.aiOverview.snippets.push(...mentions);
    }
  }

  // Search cited sources (title, snippet, link)
  for (const source of overviewContent.sources) {
    const sTitle = (source.title || '').toLowerCase();
    const sLink = (source.link || '').toLowerCase();
    const sSnippet = (source.snippet || '').toLowerCase();

    const matchesSource = variants.some(v => 
      sTitle.includes(v) || sLink.includes(v) || sSnippet.includes(v)
    );

    if (matchesSource) {
      result.aiOverview.inSources = true;
      result.aiOverview.foundInSources = true;
      result.aiOverview.matchedSources.push(source.title || source.link);
    }
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
    const sTitle = (source.title || '').toLowerCase();
    const sLink = (source.link || '').toLowerCase();
    const sSnippet = (source.snippet || '').toLowerCase();

    const matchesSource = variants.some(v => 
      sTitle.includes(v) || sLink.includes(v) || sSnippet.includes(v)
    );

    if (matchesSource) {
      result.aiMode.inSources = true;
      result.aiMode.foundInSources = true;
      result.aiMode.matchedSources.push(source.title || source.link);
    }
  }

  // Deduplicate snippets and sources
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
  getEntityVariants,
  extractAIOverviewContent,
  extractAIModeContent,
};
