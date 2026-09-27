/**
 * Multi-Query Scanner — P1 #9
 *
 * Runs brand/competitor detection across multiple queries
 * and produces an aggregate visibility score.
 *
 * Spec ref: P1 #9 — "run the same brand across 5–10 related queries at once
 * instead of a single query, producing a 'visibility score' instead of one yes/no."
 */

const { fetchAIOverview, fetchAIMode } = require('./serpapi');
const { detect } = require('./detector');

/**
 * Execute multi-query visibility scan across 2-10 queries.
 *
 * @param {string} brandName - Target brand name
 * @param {string[]} competitors - Array of competitor names
 * @param {string[]} queries - Array of search queries (2-10 items)
 * @returns {Promise<object>} Aggregate visibility scores and per-query breakdown
 */
async function runMultiQueryScan(brandName, competitors = [], queries = []) {
  if (!queries || queries.length === 0) {
    throw new Error('At least 2 queries are required for multi-query scan.');
  }

  const cleanQueries = queries.map(q => q.trim()).filter(q => q.length > 0).slice(0, 10);
  if (cleanQueries.length === 0) {
    throw new Error('No valid queries provided.');
  }

  const cleanBrand = brandName.trim();
  const cleanCompetitors = competitors.map(c => c.trim()).filter(c => c.length > 0).slice(0, 3);

  const perQueryResults = [];
  let brandVisibleCount = 0;
  const competitorVisibilityCounts = cleanCompetitors.map(name => ({ name, count: 0 }));

  for (const query of cleanQueries) {
    console.log(`[multi-scan] Running query: "${query}"`);
    
    // Fetch data for query (cache layer prevents redundant external API calls)
    const aiOverviewData = await fetchAIOverview(query);
    const aiModeData = await fetchAIMode(query);

    // Detect for brand
    const brandDetection = detect(cleanBrand, aiOverviewData, aiModeData);
    const brandFound = brandDetection.aiOverview.found || brandDetection.aiMode.found;
    if (brandFound) brandVisibleCount++;

    // Detect for competitors
    const competitorDetections = cleanCompetitors.map(comp => {
      const compDetection = detect(comp, aiOverviewData, aiModeData);
      const compFound = compDetection.aiOverview.found || compDetection.aiMode.found;
      
      const compTracker = competitorVisibilityCounts.find(c => c.name === comp);
      if (compTracker && compFound) compTracker.count++;

      return {
        name: comp,
        found: compFound,
        aiOverviewFound: compDetection.aiOverview.found,
        aiModeFound: compDetection.aiMode.found
      };
    });

    perQueryResults.push({
      query,
      brand: {
        found: brandFound,
        aiOverviewFound: brandDetection.aiOverview.found,
        aiModeFound: brandDetection.aiMode.found,
        snippet: brandDetection.aiOverview.snippets[0] || brandDetection.aiMode.snippets[0] || null
      },
      competitors: competitorDetections
    });
  }

  const totalQueries = cleanQueries.length;
  const brandScore = Math.round((brandVisibleCount / totalQueries) * 100);

  const competitorScores = competitorVisibilityCounts.map(comp => ({
    name: comp.name,
    score: Math.round((comp.count / totalQueries) * 100),
    visibleIn: comp.count
  }));

  // Determine top performing competitor
  let bestCompetitor = null;
  if (competitorScores.length > 0) {
    bestCompetitor = [...competitorScores].sort((a, b) => b.score - a.score)[0];
  }

  return {
    summary: {
      totalQueries,
      brandVisibleIn: brandVisibleCount,
      brandScore,
      bestCompetitor: bestCompetitor ? bestCompetitor.name : null,
      bestCompetitorScore: bestCompetitor ? bestCompetitor.score : null
    },
    overallScore: {
      brand: brandScore,
      competitors: competitorScores
    },
    perQuery: perQueryResults
  };
}

module.exports = {
  runMultiQueryScan
};
