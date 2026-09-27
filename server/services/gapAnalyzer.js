/**
 * Gap Analyzer — P1 #7 + P1 #8
 *
 * Compares brand's organic search presence against AI Overview cited sources
 * to explain why the brand is missing and what to fix.
 *
 * Spec ref: P1 #7 — "Compare the brand's top organic pages against the sources
 * the AI Overview actually cited, and explain structurally why the brand wasn't
 * picked."
 * Spec ref: P1 #8 — "Actionable, prioritized recommendations list based on
 * the gap analysis above."
 */

/**
 * Known review/comparison publication domain patterns.
 */
const KNOWN_REVIEW_DOMAINS = [
  'rtings.com',
  'nytimes.com',
  'soundguys.com',
  'tomsguide.com',
  'techradar.com',
  'whathifi.com',
  'cnet.com',
  'theverge.com',
  'wirecutter.com',
  'pcmag.com',
  'trustedreviews.com',
  'digitaltrends.com'
];

/**
 * Keywords indicating comparison or listicle format content.
 */
const COMPARISON_KEYWORDS = [
  'best',
  'vs',
  'top',
  'comparison',
  'review',
  'reviews',
  'roundup',
  'ranked',
  'guide'
];

/**
 * Extract root domain from URL.
 * @param {string} urlString 
 * @returns {string} Domain name (e.g. "sony.com")
 */
function extractDomain(urlString) {
  if (!urlString) return '';
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch (err) {
    return urlString.toLowerCase();
  }
}

/**
 * Check if text contains any comparison keywords.
 * @param {string} text 
 * @returns {boolean}
 */
function isComparisonContent(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return COMPARISON_KEYWORDS.some(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(lower);
  });
}

/**
 * Clean, deduplicate and enrich cited sources from real SerpApi AI Overview references.
 * Resolves duplicate inline tags vs card references and matches with organic results.
 */
function cleanAndEnrichCitedSources(citedSources = [], organicResults = []) {
  const urlMap = new Map();

  function normalizeUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        return v ? `https://www.youtube.com/watch?v=${v}` : (u.origin + u.pathname).toLowerCase().replace(/\/$/, '');
      }
      return (u.origin + u.pathname).toLowerCase().replace(/\/$/, '');
    } catch (e) {
      return url.split('?')[0].toLowerCase().replace(/\/$/, '');
    }
  }

  for (const src of citedSources) {
    if (!src || !src.link) continue;
    // Skip empty Google search landing page redirects
    if (src.link === 'https://www.google.com/' || src.link === 'https://www.google.com') continue;

    const normKey = normalizeUrl(src.link);
    const domain = extractDomain(src.link);

    if (!urlMap.has(normKey)) {
      urlMap.set(normKey, {
        title: (src.title || '').trim(),
        link: src.link,
        source: src.source || domain,
        snippet: (src.snippet || '').trim(),
        thumbnail: src.thumbnail || '',
        domain
      });
    } else {
      const existing = urlMap.get(normKey);
      if (!existing.title && src.title) existing.title = src.title.trim();
      if (!existing.snippet && src.snippet) existing.snippet = src.snippet.trim();
      if (!existing.thumbnail && src.thumbnail) existing.thumbnail = src.thumbnail;
      if ((!existing.source || existing.source === domain) && src.source) existing.source = src.source;
    }
  }

  const enriched = Array.from(urlMap.values());

  // Second pass: if any source has an empty or short truncated title, enrich it
  for (const item of enriched) {
    // 1. Try matching with organic results from same SERP
    const matchingOrganic = (organicResults || []).find(r => r.link && normalizeUrl(r.link) === normalizeUrl(item.link));
    if (matchingOrganic) {
      if (!item.title || item.title.length < 15) {
        item.title = matchingOrganic.title || item.title;
      }
      if (!item.snippet) {
        item.snippet = matchingOrganic.snippet || '';
      }
    }

    // 2. If title is still missing or truncated (< 12 chars like "Best noise"), generate from URL slug
    if (!item.title || item.title.trim().length < 12) {
      try {
        const parsed = new URL(item.link);
        const pathSegments = parsed.pathname.split('/').filter(Boolean);
        const lastSlug = pathSegments[pathSegments.length - 1] || pathSegments[pathSegments.length - 2] || '';
        
        if (lastSlug && lastSlug.length > 3) {
          const readable = lastSlug
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .replace(/\b(And|For|The|In|Of|To|With)\b/gi, m => m.toLowerCase());
          
          const domainLabel = item.source && item.source !== item.domain ? item.source : item.domain;
          item.title = `${readable} — ${domainLabel}`;
        } else {
          item.title = `${item.source || item.domain} Article Reference`;
        }
      } catch (e) {
        item.title = `${item.source || item.domain} Reference Link`;
      }
    }
  }

  return enriched;
}

/**
 * Analyze gap between brand organic pages and AI Overview cited sources.
 *
 * @param {string} brandName - Brand/product name
 * @param {object[]} organicResults - Organic search results array from SerpApi
 * @param {object[]} citedSources - Array of { title, link } from AI Overview reference_links
 * @param {object} brandDetectionResult - Brand detection result from detector service
 * @returns {object} { gapAnalysis, recommendations }
 */
function analyzeGap(brandName, organicResults = [], citedSources = [], brandDetectionResult = {}, competitors = []) {
  const brandLower = brandName.toLowerCase();
  const brandWords = brandLower.split(/\s+/).filter(w => w.length > 2);

  // 1. Brand Organic Presence Analysis
  const brandOrganicPages = organicResults.filter(res => {
    const domain = extractDomain(res.link);
    const titleLower = (res.title || '').toLowerCase();
    const snippetLower = (res.snippet || '').toLowerCase();
    
    // Check if domain matches brand words or title/snippet mentions brand
    const domainMatch = brandWords.some(w => domain.includes(w));
    const titleMatch = brandWords.every(w => titleLower.includes(w));
    const snippetMatch = brandWords.length > 1 && brandWords.every(w => snippetLower.includes(w));
    return domainMatch || titleMatch || snippetMatch;
  });

  const bestRank = brandOrganicPages.length > 0 ? (brandOrganicPages[0].position || 1) : null;

  // 1b. Competitor Organic Presence Analysis (Real rankings from Google SERP)
  const competitorOrganicPresence = (competitors || []).map(compName => {
    const compLower = compName.toLowerCase();
    const compWords = compLower.split(/\s+/).filter(w => w.length > 2);
    const pages = organicResults.filter(res => {
      const domain = extractDomain(res.link);
      const titleLower = (res.title || '').toLowerCase();
      const snippetLower = (res.snippet || '').toLowerCase();
      const domainMatch = compWords.some(w => domain.includes(w));
      const titleMatch = compWords.every(w => titleLower.includes(w));
      const snippetMatch = compWords.length > 1 && compWords.every(w => snippetLower.includes(w));
      return domainMatch || titleMatch || snippetMatch;
    });
    const compRank = pages.length > 0 ? (pages[0].position || 1) : null;
    return {
      name: compName,
      found: pages.length > 0,
      bestRank: compRank,
      pages: pages.map(p => ({
        position: p.position,
        title: p.title,
        link: p.link,
      }))
    };
  });

  // 2. Cited Sources Analysis (Deduplicated, merged and enriched with titles & snippets)
  const citedAnalyzed = cleanAndEnrichCitedSources(citedSources, organicResults);

  // 3. Overlap Analysis
  const brandDomains = new Set(brandOrganicPages.map(p => extractDomain(p.link)));
  const brandPagesCited = citedAnalyzed.filter(src => brandDomains.has(src.domain));
  const brandPagesNotCited = brandOrganicPages.filter(p => !citedAnalyzed.some(c => c.domain === extractDomain(p.link)));
  const citedNotBrand = citedAnalyzed.filter(src => !brandDomains.has(src.domain));

  // 4. Detect Structural Gaps
  const structuralGaps = [];

  // Gap Rule 1: No Organic Presence
  if (brandOrganicPages.length === 0) {
    structuralGaps.push({
      gapType: 'no_organic_presence',
      severity: 'high',
      title: 'No Organic Search Footprint',
      explanation: `Your brand "${brandName}" does not rank in the top organic search results for this query. AI Overviews rely on top-ranking organic pages as primary sources.`
    });
  }

  // Gap Rule 2: Low Organic Ranking
  else if (bestRank !== null && bestRank > 5) {
    structuralGaps.push({
      gapType: 'low_organic_ranking',
      severity: 'medium',
      title: 'Low Organic Position',
      explanation: `Your top organic result ranks at position #${bestRank}. AI Overviews heavily favor sources ranking in the top 3-5 organic positions.`
    });
  }

  // Gap Rule 3: No Comparison Content
  const citedComparisonCount = citedAnalyzed.filter(src => isComparisonContent(src.title)).length;
  const brandComparisonCount = brandOrganicPages.filter(p => isComparisonContent(p.title) || isComparisonContent(p.snippet)).length;

  if (citedComparisonCount > 0 && brandComparisonCount === 0) {
    structuralGaps.push({
      gapType: 'no_comparison_content',
      severity: 'high',
      title: 'Missing Comparison / Listicle Content',
      explanation: `${citedComparisonCount} of ${citedAnalyzed.length} cited sources are comparison guides or listicles (e.g., "Best of" roundups). Your organic pages appear to be single-product pages rather than comparison content.`
    });
  }

  // Gap Rule 4: Thin Snippet Content
  if (brandOrganicPages.length > 0) {
    const avgCitedSnippetLen = organicResults
      .filter(r => citedAnalyzed.some(c => c.domain === extractDomain(r.link)))
      .reduce((acc, curr, _, arr) => acc + (curr.snippet ? curr.snippet.length : 0) / (arr.length || 1), 0);

    const avgBrandSnippetLen = brandOrganicPages
      .reduce((acc, curr, _, arr) => acc + (curr.snippet ? curr.snippet.length : 0) / (arr.length || 1), 0);

    if (avgCitedSnippetLen > 0 && avgBrandSnippetLen > 0 && avgBrandSnippetLen < avgCitedSnippetLen * 0.7) {
      structuralGaps.push({
        gapType: 'thin_snippet_content',
        severity: 'medium',
        title: 'Thin Content Snippet',
        explanation: `Your organic search snippets average ${Math.round(avgBrandSnippetLen)} characters versus ${Math.round(avgCitedSnippetLen)} characters for cited sources. AI models favor rich, informative content blocks.`
      });
    }
  }

  // Gap Rule 5: Missing Review Site Coverage
  const citedReviewSites = citedAnalyzed.filter(src => KNOWN_REVIEW_DOMAINS.some(d => src.domain.includes(d)));
  if (citedReviewSites.length > 0) {
    const brandCoveredInReviews = citedReviewSites.some(src => {
      const origResult = organicResults.find(r => r.link === src.link);
      if (!origResult) return false;
      return (origResult.snippet || '').toLowerCase().includes(brandWords[0] || '');
    });

    if (!brandCoveredInReviews) {
      structuralGaps.push({
        gapType: 'missing_review_coverage',
        severity: 'medium',
        title: 'Third-Party Review Gap',
        explanation: `AI Overviews cited major tech/review publications (${citedReviewSites.map(s => s.domain).slice(0, 3).join(', ')}). Your brand lacks prominent coverage in these cited roundups.`
      });
    }
  }

  // Gap Rule 6: Competitor Better Positioned
  const competitorOrganicPages = organicResults.filter(res => {
    const domain = extractDomain(res.link);
    return !brandDomains.has(domain) && res.position < (bestRank || 99);
  });

  if (competitorOrganicPages.length > 0) {
    structuralGaps.push({
      gapType: 'competitor_better_positioned',
      severity: 'medium',
      title: 'Competitor Organic Superiority',
      explanation: `${competitorOrganicPages.length} competitor/third-party pages rank above your best organic position (${bestRank ? '#' + bestRank : 'Unranked'}).`
    });
  }

  // 5. Build Recommendations
  const recommendations = [];

  structuralGaps.forEach((gap, index) => {
    switch (gap.gapType) {
      case 'no_organic_presence':
        recommendations.push({
          priority: 1,
          action: 'Establish Organic Search Visibility',
          detail: `Create a targeted landing page or buyer guide optimized for "${brandName}" and related category keywords to index in organic top 10.`,
          effort: 'medium',
          impact: 'high'
        });
        break;
      case 'no_comparison_content':
        recommendations.push({
          priority: 2,
          action: 'Publish Category Comparison & Roundup Content',
          detail: 'Create vs-style comparison articles (e.g., "Brand vs Competitor A") and "Best of" buyer guides on your blog or resource center.',
          effort: 'medium',
          impact: 'high'
        });
        break;
      case 'missing_review_coverage':
        recommendations.push({
          priority: 3,
          action: 'Pitch Major Review Outlets & Industry Publications',
          detail: `Reach out to editorial teams at cited outlets (${citedReviewSites.map(s => s.domain).slice(0, 3).join(', ') || 'key review sites'}) to submit your product for review inclusion.`,
          effort: 'high',
          impact: 'high'
        });
        break;
      case 'low_organic_ranking':
        recommendations.push({
          priority: 4,
          action: 'Optimize Page SEO to Reach Top 3 Positions',
          detail: 'Improve technical SEO, page load speed, schema markup, and internal linking to boost your top organic page from position #' + bestRank + ' into top 3.',
          effort: 'high',
          impact: 'high'
        });
        break;
      case 'thin_snippet_content':
        recommendations.push({
          priority: 5,
          action: 'Enhance Content Depth & FAQ Schema',
          detail: 'Expand target pages with structured tables, bullet points, spec sheets, and FAQ sections with schema markup to make content easily extractable by AI.',
          effort: 'low',
          impact: 'medium'
        });
        break;
      case 'competitor_better_positioned':
        recommendations.push({
          priority: 6,
          action: 'Conduct Competitive Content Gap Analysis',
          detail: 'Analyze top-ranking competitor pages for content structure, backlink profiles, and key topics covered that your pages lack.',
          effort: 'medium',
          impact: 'medium'
        });
        break;
      default:
        break;
    }
  });

  // Re-index priority numbers
  recommendations.forEach((rec, idx) => {
    rec.priority = idx + 1;
  });

  return {
    gapAnalysis: {
      brandOrganicPresence: {
        found: brandOrganicPages.length > 0,
        pages: brandOrganicPages.map(p => ({
          position: p.position,
          title: p.title,
          link: p.link,
          snippet: p.snippet
        })),
        bestRank
      },
      citedSourceAnalysis: {
        totalCited: citedAnalyzed.length,
        sources: citedAnalyzed
      },
      overlap: {
        brandPagesCited,
        brandPagesNotCited,
        citedNotBrand
      },
      competitorOrganicPresence,
      structuralGaps
    },
    recommendations
  };
}

module.exports = {
  analyzeGap,
  extractDomain,
  isComparisonContent
};
