/**
 * Public API Controller — Visibility & Webhook Callback Support
 *
 * Implements:
 *  - GEO_Auditor_Public_API_Spec.md (P0 #1-#4, P1 #5-#7)
 *  - GEO_Auditor_Webhook_Callback_Spec.md (P0 #1-#5, P1 #6-#8)
 *
 * Features:
 *  - Read-only visibility analysis endpoint: GET /api/v1/visibility
 *  - Bring-Your-Own-Key (BYOK) quota protection via X-SerpApi-Key header
 *  - Sandbox mode fallback with rate limiting (10 req/min)
 *  - Optional callback_url parameter for fire-and-forget asynchronous delivery (HTTP 202)
 *  - Single-retry delivery safety and URL validation
 *  - Redacted logging and structured error responses
 */

const crypto = require('crypto');
const { fetchAIOverview, fetchAIMode, fetchOrganicResults } = require('../services/serpapi');
const { detect } = require('../services/detector');
const { analyzeGap } = require('../services/gapAnalyzer');
const { deliverCallback, validateCallbackUrl } = require('../services/callbackService');
const fs = require('fs');
const path = require('path');

const DEMO_FILE = path.join(__dirname, '..', '..', 'demo', 'sample-response.json');

/**
 * Load the demo fixture for sandbox mode.
 */
function loadDemoFixture(type) {
  try {
    const fixture = JSON.parse(fs.readFileSync(DEMO_FILE, 'utf-8'));
    if (type === 'ai_overview') return fixture.ai_overview_response;
    if (type === 'ai_mode') return fixture.ai_mode_response;
    return fixture;
  } catch (err) {
    throw new Error(`Demo fixture not found: ${err.message}`);
  }
}

/**
 * Shared scan execution logic reused by both synchronous and callback requests.
 */
async function executeScan({ cleanBrand, cleanQuery, cleanCompetitors, locationStr, glStr, isSandbox, callerKey, scanId }) {
  let aiOverviewData, aiModeData, organicResults;

  if (isSandbox) {
    // === Sandbox Mode: use pre-tested demo fixture data ===
    aiOverviewData = loadDemoFixture('ai_overview');
    aiModeData = loadDemoFixture('ai_mode');
    organicResults = aiOverviewData.organic_results || [];
  } else {
    // === Live Mode: use caller's own SerpApi key (passed directly to options) ===
    const locationOptions = {
      location: locationStr,
      gl: glStr,
      apiKey: callerKey ? callerKey.trim() : undefined
    };

    try {
      aiOverviewData = await fetchAIOverview(cleanQuery, locationOptions);
      aiModeData = await fetchAIMode(cleanQuery, locationOptions);
      organicResults = await fetchOrganicResults(cleanQuery, locationOptions);
    } catch (apiErr) {
      const message = apiErr.message || 'SerpApi request failed';
      const safeMessage = message.replace(/api_key=[^&\s]+/gi, 'api_key=***');
      const err = new Error(safeMessage);
      err.statusCode = 502;
      throw err;
    }
  }

  // --- Run Detection (reuses existing services) ---
  const brandResult = detect(cleanBrand, aiOverviewData, aiModeData);

  const competitorResults = cleanCompetitors.map(comp => ({
    name: comp,
    ...detect(comp, aiOverviewData, aiModeData),
  }));

  // --- Run Gap Analysis (reuses existing service) ---
  const citedSources = aiOverviewData?.ai_overview?.references ||
                       aiOverviewData?.ai_overview?.reference_links ||
                       aiModeData?.references ||
                       [];

  const gapResult = analyzeGap(
    cleanBrand,
    organicResults,
    citedSources,
    brandResult,
    cleanCompetitors
  );

  // --- Data availability flags ---
  const aiOverviewAvailable = !!(aiOverviewData && aiOverviewData.ai_overview);
  const aiModeAvailable = !!(aiModeData && (aiModeData.text_blocks || aiModeData.reconstructed_markdown));

  // --- Assemble response (same shape as frontend Gap Analysis view) ---
  return {
    scanId: scanId || crypto.randomUUID(),
    query: cleanQuery,
    location: locationStr,
    gl: glStr,
    timestamp: new Date().toISOString(),
    mode: isSandbox ? 'sandbox' : 'live',
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
}

/**
 * GET /api/v1/visibility
 *
 * Query Parameters:
 *   - brand (required): The brand/product name to audit
 *   - query (required): The search query to analyze
 *   - competitors (optional): Comma-separated competitor names (max 3)
 *   - location (optional): SerpApi location string (default: "United States")
 *   - gl (optional): Country code (default: "us")
 *   - callback_url (optional): Destination URL to receive finished scan via HTTP POST
 *
 * Headers:
 *   - X-SerpApi-Key (optional): Caller's own SerpApi key for live data.
 *     If omitted, returns sandbox demo data.
 */
async function getVisibility(req, res) {
  try {
    // --- Input Validation (P0 #3) ---
    const { brand, query, competitors, location, gl } = req.query;
    const rawCallbackUrl = req.query.callback_url || req.query.callbackUrl;

    if (!brand || typeof brand !== 'string' || !brand.trim()) {
      return res.status(400).json({
        error: 'Missing required parameter: brand',
        message: 'Provide a brand or product name to audit, e.g. ?brand=Sony%20WH-1000XM5',
      });
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        error: 'Missing required parameter: query',
        message: 'Provide a search query to analyze, e.g. ?query=best%20noise%20cancelling%20headphones',
      });
    }

    // --- Validate callback_url if provided (Webhook Spec P1 #7) ---
    let cleanCallbackUrl = null;
    if (rawCallbackUrl) {
      const validation = validateCallbackUrl(rawCallbackUrl);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid parameter: callback_url',
          message: 'Provide a valid http or https URL for callback_url, e.g. ?callback_url=https://example.com/webhook',
        });
      }
      cleanCallbackUrl = rawCallbackUrl.trim();
    }

    const cleanBrand = brand.trim();
    const cleanQuery = query.trim();

    // Parse competitors: comma-separated string → array, max 3
    let cleanCompetitors = [];
    if (competitors && typeof competitors === 'string') {
      cleanCompetitors = competitors
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0)
        .slice(0, 3);
    }

    const locationStr = (location && typeof location === 'string') ? location.trim() : 'United States';
    const glStr = (gl && typeof gl === 'string') ? gl.trim().toLowerCase() : 'us';

    // --- Determine Mode: BYOK Live vs Sandbox (P0 #2) ---
    const callerKey = req.headers['x-serpapi-key'];
    const isSandbox = !callerKey || typeof callerKey !== 'string' || callerKey.trim().length === 0;

    const scanId = crypto.randomUUID();

    // --- Webhook / Callback Mode (Webhook Spec P0 #1, #2, #3, #4) ---
    if (cleanCallbackUrl) {
      // 1. Immediately acknowledge request with HTTP 202 Accepted (P0 #2)
      res.status(202).json({
        status: 'accepted',
        message: 'Scan accepted. Results will be delivered to callback_url once complete.',
        scanId,
        callbackUrl: cleanCallbackUrl,
        mode: isSandbox ? 'sandbox' : 'live',
        brand: cleanBrand,
        query: cleanQuery,
      });

      // 2. Run scan in background and deliver payload to callback URL (P0 #3, #4)
      (async () => {
        try {
          const resultPayload = await executeScan({
            cleanBrand,
            cleanQuery,
            cleanCompetitors,
            locationStr,
            glStr,
            isSandbox,
            callerKey,
            scanId
          });

          await deliverCallback(cleanCallbackUrl, resultPayload);
        } catch (bgErr) {
          console.error(`[public-api] Asynchronous scan or delivery failed for scanId ${scanId}: ${bgErr.message}`);
        }
      })();

      return;
    }

    // --- Synchronous Mode (P0 #5: absent callback_url behavior unchanged) ---
    const response = await executeScan({
      cleanBrand,
      cleanQuery,
      cleanCompetitors,
      locationStr,
      glStr,
      isSandbox,
      callerKey,
      scanId
    });

    res.json(response);

  } catch (err) {
    if (err.statusCode === 502) {
      return res.status(502).json({
        error: 'SerpApi request failed',
        message: err.message,
      });
    }

    console.error('[public-api] Error:', err.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'The visibility analysis failed unexpectedly. Please try again.',
    });
  }
}

module.exports = { getVisibility, executeScan };
