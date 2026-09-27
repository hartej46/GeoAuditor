/**
 * Scan Controller
 *
 * Orchestrates the scan business logic:
 *  1. Calls SerpApi services to fetch AI data
 *  2. Runs brand/competitor detection
 *  3. Persists results to database (if available)
 *  4. Returns the assembled response
 *
 * Keeps routes thin — all logic lives here.
 */

const { fetchAIOverview, fetchAIMode, fetchOrganicResults, isDemoMode } = require('../services/serpapi');
const { detect } = require('../services/detector');
const { analyzeGap } = require('../services/gapAnalyzer');
const Scan = require('../models/Scan');

/**
 * POST /api/scan — Run a visibility scan.
 */
async function runScan(req, res) {
  try {
    const { brand, competitors, query } = req.body;

    // --- Validation ---
    if (!brand || typeof brand !== 'string' || !brand.trim()) {
      return res.status(400).json({ error: 'Brand name is required.' });
    }
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query/topic is required.' });
    }

    const cleanBrand = brand.trim();
    const cleanQuery = query.trim();
    const cleanCompetitors = (competitors || [])
      .map(c => (typeof c === 'string' ? c.trim() : ''))
      .filter(c => c.length > 0)
      .slice(0, 3);

    console.log(`\n[scan] Brand: "${cleanBrand}" | Query: "${cleanQuery}" | Competitors: [${cleanCompetitors.join(', ')}]`);

    // --- Fetch SerpApi data ---
    console.log('[scan] Fetching AI Overview...');
    const aiOverviewData = await fetchAIOverview(cleanQuery);

    console.log('[scan] Fetching AI Mode...');
    const aiModeData = await fetchAIMode(cleanQuery);

    // --- Run detection ---
    console.log('[scan] Running brand detection...');
    const brandResult = detect(cleanBrand, aiOverviewData, aiModeData);

    const competitorResults = cleanCompetitors.map(comp => ({
      name: comp,
      ...detect(comp, aiOverviewData, aiModeData),
    }));

    // --- Gap Analysis (P1 #7 + #8) ---
    console.log('[scan] Running gap analysis...');
    const organicResults = await fetchOrganicResults(cleanQuery);
    const gapResult = analyzeGap(
      cleanBrand,
      organicResults,
      aiOverviewData?.ai_overview?.reference_links || [],
      brandResult
    );

    // --- Persist to DB (non-blocking — don't fail the scan if DB is down) ---
    let scanId = null;
    try {
      const savedScan = await Scan.create({
        brand: cleanBrand,
        queryText: cleanQuery,
        demoMode: isDemoMode(),
        brandResult,
        competitorResults,
      });
      if (savedScan) {
        scanId = savedScan.id;
        console.log(`[scan] Saved to DB with id: ${scanId}`);
      }
    } catch (dbErr) {
      console.warn(`[scan] DB save failed (non-fatal): ${dbErr.message}`);
    }

    // --- Data availability flags ---
    const aiOverviewAvailable = !!(aiOverviewData && aiOverviewData.ai_overview);
    const aiModeAvailable = !!(aiModeData && (aiModeData.text_blocks || aiModeData.reconstructed_markdown));

    // --- Assemble response ---
    const response = {
      scanId,
      query: cleanQuery,
      timestamp: new Date().toISOString(),
      demoMode: isDemoMode(),
      dataAvailability: {
        aiOverview: aiOverviewAvailable,
        aiMode: aiModeAvailable,
      },
      brand: {
        name: cleanBrand,
        ...brandResult,
      },
      competitors: competitorResults,
      gapAnalysis: gapResult.gapAnalysis,
      recommendations: gapResult.recommendations,
    };

    console.log(`[scan] Done. Brand in AI Overview: ${brandResult.aiOverview.found} | AI Mode: ${brandResult.aiMode.found}`);
    res.json(response);

  } catch (err) {
    console.error('[scan] Error:', err.message);

    if (err.message.includes('SERPAPI_KEY')) {
      return res.status(503).json({ error: err.message });
    }

    res.status(500).json({ error: 'Scan failed. Check server logs for details.' });
  }
}

/**
 * GET /api/scans/:id — Retrieve a saved scan by ID.
 */
async function getScan(req, res) {
  try {
    const { id } = req.params;

    const scan = await Scan.findById(id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found.' });
    }

    res.json(scan);
  } catch (err) {
    console.error('[scan] getScan error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve scan.' });
  }
}

/**
 * POST /api/scan/multi — Run a multi-query visibility scan.
 */
async function runMultiScan(req, res) {
  try {
    const { brand, competitors, queries } = req.body;

    if (!brand || typeof brand !== 'string' || !brand.trim()) {
      return res.status(400).json({ error: 'Brand name is required.' });
    }
    if (!queries || !Array.isArray(queries) || queries.length < 2) {
      return res.status(400).json({ error: 'At least 2 queries are required for multi-query scan.' });
    }

    const { runMultiQueryScan } = require('../services/multiQueryScanner');
    const result = await runMultiQueryScan(brand, competitors || [], queries);

    res.json({
      timestamp: new Date().toISOString(),
      demoMode: isDemoMode(),
      brand: brand.trim(),
      competitors: (competitors || []).map(c => c.trim()).filter(Boolean),
      ...result
    });
  } catch (err) {
    console.error('[scan] runMultiScan error:', err.message);
    res.status(500).json({ error: err.message || 'Multi-query scan failed.' });
  }
}

module.exports = { runScan, getScan, runMultiScan };

