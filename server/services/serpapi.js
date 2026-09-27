/**
 * SerpApi Integration Layer
 * 
 * Wraps calls to Google AI Overview API, AI Mode API, and Organic Search API.
 * Implements cache-first strategy to avoid burning API credits during dev/testing.
 * 
 * Spec ref: P0 #2 — "Fetch AI Overview + AI Mode results for that query via SerpApi."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const DEMO_FILE = path.join(__dirname, '..', '..', 'demo', 'sample-response.json');
const SERPAPI_BASE = 'https://serpapi.com/search.json';

/**
 * Check if we're running in demo mode (no valid API key).
 */
function isDemoMode() {
  const key = process.env.SERPAPI_KEY;
  return !key || key === 'your_serpapi_key_here';
}

/**
 * Load the demo fixture and return the appropriate section.
 */
function loadDemoFixture(type) {
  try {
    const fixture = JSON.parse(fs.readFileSync(DEMO_FILE, 'utf-8'));
    if (type === 'ai_overview') return fixture.ai_overview_response;
    if (type === 'ai_mode') return fixture.ai_mode_response;
    return fixture;
  } catch (err) {
    throw new Error(`Demo fixture not found at ${DEMO_FILE}: ${err.message}`);
  }
}

/**
 * Generate a deterministic cache key from query params.
 */
function cacheKey(engine, query, extraParams = {}) {
  const locStr = extraParams.location || '';
  const glStr = extraParams.gl || '';
  const hash = crypto.createHash('md5').update(`${engine}:${query}:${locStr}:${glStr}`).digest('hex');
  return path.join(CACHE_DIR, `${engine}_${hash}.json`);
}

/**
 * Read from local cache. Returns parsed JSON or null.
 */
function readCache(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(`  [cache] HIT — ${path.basename(filePath)}`);
      return data;
    }
  } catch (err) {
    console.warn(`  [cache] Read error: ${err.message}`);
  }
  return null;
}

/**
 * Write response to local cache.
 */
function writeCache(filePath, data) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  [cache] STORED — ${path.basename(filePath)}`);
  } catch (err) {
    console.warn(`  [cache] Write error: ${err.message}`);
  }
}

/**
 * Generic SerpApi fetch with cache-first strategy.
 * @param {string} engine - SerpApi engine name (e.g. 'google_ai_overview', 'google_ai_mode')
 * @param {string} query - The search query
 * @param {object} extraParams - Additional API parameters (location, gl, etc.)
 * @returns {object} Parsed API response
 */
async function fetchFromSerpApi(engine, query, extraParams = {}) {
  const cacheFile = cacheKey(engine, query, extraParams);
  
  // 1. Check cache first
  const cached = readCache(cacheFile);
  if (cached) return cached;

  // 2. Build request URL
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey || apiKey === 'your_serpapi_key_here') {
    throw new Error(
      'SERPAPI_KEY not set. Copy .env.example to .env and add your key.\n' +
      'Get a free key at https://serpapi.com/'
    );
  }

  const queryParams = {
    engine,
    q: query,
    api_key: apiKey,
  };

  if (extraParams.location) queryParams.location = extraParams.location;
  if (extraParams.gl) queryParams.gl = extraParams.gl;

  const params = new URLSearchParams(queryParams);
  const url = `${SERPAPI_BASE}?${params.toString()}`;
  console.log(`  [serpapi] Fetching ${engine} for "${query}" (location: ${extraParams.location || 'default'})...`);

  // 3. Make the API call
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SerpApi ${engine} returned ${response.status}: ${body}`);
  }

  const data = await response.json();

  // 4. Cache the response
  writeCache(cacheFile, data);

  return data;
}

/**
 * Fetch Google AI Overview results for a query.
 * Uses engine: google (AI Overview is part of regular Google results).
 * 
 * Handles the page_token flow: if Google defers the AI Overview content,
 * SerpApi returns a page_token instead. We then make a follow-up request
 * to the google_ai_overview engine with that token (it expires in ~60s).
 */
async function fetchAIOverview(query, options = {}) {
  // Demo mode: return fixture data
  if (isDemoMode()) {
    console.log(`  [demo] Using demo fixture for AI Overview (location: ${options.location || 'United States'})`);
    return loadDemoFixture('ai_overview');
  }

  const extraParams = {};
  if (options.location) extraParams.location = options.location;
  if (options.gl) extraParams.gl = options.gl;

  const result = await fetchFromSerpApi('google', query, extraParams);

  // Handle deferred AI Overview — page_token means content wasn't inline
  if (result.ai_overview && result.ai_overview.page_token && !result.ai_overview.text_blocks) {
    console.log(`  [serpapi] AI Overview deferred — fetching via page_token...`);
    const fullOverview = await fetchFromSerpApi('google_ai_overview', query, {
      page_token: result.ai_overview.page_token,
      ...extraParams
    });
    // Merge the full overview back into the result
    result.ai_overview = { ...result.ai_overview, ...fullOverview };
  }

  return result;
}

/**
 * Fetch Google AI Mode results for a query.
 * Uses engine: google_ai_mode.
 */
async function fetchAIMode(query, options = {}) {
  // Demo mode: return fixture data
  if (isDemoMode()) {
    console.log(`  [demo] Using demo fixture for AI Mode (location: ${options.location || 'United States'})`);
    return loadDemoFixture('ai_mode');
  }

  const extraParams = {};
  if (options.location) extraParams.location = options.location;
  if (options.gl) extraParams.gl = options.gl;

  return fetchFromSerpApi('google_ai_mode', query, extraParams);
}

/**
 * Extract organic results from a Google search response.
 * In demo mode, returns fixture data.
 * In live mode, the organic_results are already present in the AI Overview response
 * (same API call, engine: 'google'), so we can reuse that cached response.
 *
 * @param {string} query - The search query
 * @param {object} options - Optional location and country params
 * @returns {Promise<object[]>} Array of organic result objects
 */
async function fetchOrganicResults(query, options = {}) {
  if (isDemoMode()) {
    const fixture = loadDemoFixture('ai_overview');
    return fixture.organic_results || [];
  }

  const extraParams = {};
  if (options.location) extraParams.location = options.location;
  if (options.gl) extraParams.gl = options.gl;

  const result = await fetchFromSerpApi('google', query, extraParams);
  return result.organic_results || [];
}


module.exports = {
  fetchAIOverview,
  fetchAIMode,
  fetchOrganicResults,
  isDemoMode,
};

