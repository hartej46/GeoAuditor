/**
 * Scan Model with Dual Persistence
 *
 * Persists scan records and history summaries.
 * Supports both PostgreSQL (if DATABASE_URL is set) and local file fallback
 * (cache/history.json) with in-memory caching for zero-config demo sandbox mode.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { query, getPool, isDBAvailable } = require('../config/db');

const HISTORY_FILE = path.join(__dirname, '..', 'cache', 'history.json');

let inMemoryHistory = null;

/**
 * Ensure cache directory exists.
 */
function ensureCacheDir() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load history from cache/history.json or initialize with sample demo benchmarks.
 */
function loadHistoryFromFile() {
  if (inMemoryHistory) return inMemoryHistory;

  ensureCacheDir();
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
      inMemoryHistory = JSON.parse(raw);
      if (Array.isArray(inMemoryHistory)) {
        return inMemoryHistory;
      }
    }
  } catch (err) {
    console.warn('  [Scan] Reading history.json failed:', err.message);
  }

  // Pre-seed sample historical scans so Audit History view looks rich on initial launch
  const now = Date.now();
  inMemoryHistory = [
    {
      id: 'demo-hist-101',
      timestamp: new Date(now - 3600 * 1000 * 2).toISOString(),
      type: 'single',
      brand: 'Sony WH-1000XM5',
      query: 'best noise cancelling headphones 2026',
      visibilityScore: 100,
      aiOverviewFound: true,
      aiModeFound: true,
      competitorCount: 3,
      fullData: {
        scanId: 'demo-hist-101',
        query: 'best noise cancelling headphones 2026',
        timestamp: new Date(now - 3600 * 1000 * 2).toISOString(),
        demoMode: true,
        dataAvailability: { aiOverview: true, aiMode: true },
        brand: {
          name: 'Sony WH-1000XM5',
          aiOverview: { found: true, foundInSources: true, snippets: ['The Sony WH-1000XM5 remains the gold standard for noise cancellation...'] },
          aiMode: { found: true, foundInSources: true, snippets: ['The Sony WH-1000XM5 continues to dominate as the best overall...'] }
        },
        competitors: [
          { name: 'Bose QuietComfort Ultra', aiOverview: { found: true }, aiMode: { found: true } },
          { name: 'Apple AirPods Max', aiOverview: { found: true }, aiMode: { found: true } },
          { name: 'Sennheiser Momentum 4', aiOverview: { found: false }, aiMode: { found: true } }
        ]
      }
    },
    {
      id: 'demo-hist-102',
      timestamp: new Date(now - 3600 * 1000 * 18).toISOString(),
      type: 'multi',
      brand: 'Sony WH-1000XM5',
      query: '5 Queries (best noise cancelling headphones 2026...)',
      visibilityScore: 80,
      aiOverviewFound: true,
      aiModeFound: true,
      competitorCount: 3,
      fullData: {
        timestamp: new Date(now - 3600 * 1000 * 18).toISOString(),
        demoMode: true,
        brand: 'Sony WH-1000XM5',
        competitors: ['Bose QuietComfort Ultra', 'Apple AirPods Max', 'Sennheiser Momentum 4'],
        summary: { totalQueries: 5, brandVisibleIn: 4, brandScore: 80, bestCompetitor: 'Bose QuietComfort Ultra', bestCompetitorScore: 100 },
        overallScore: {
          brand: 80,
          competitors: [
            { name: 'Bose QuietComfort Ultra', score: 100, visibleIn: 5 },
            { name: 'Apple AirPods Max', score: 60, visibleIn: 3 },
            { name: 'Sennheiser Momentum 4', score: 40, visibleIn: 2 }
          ]
        },
        perQuery: [
          { query: 'best noise cancelling headphones 2026', brand: { found: true }, competitors: [{ name: 'Bose QuietComfort Ultra', found: true }] },
          { query: 'best headphones for travel', brand: { found: true }, competitors: [{ name: 'Bose QuietComfort Ultra', found: true }] },
          { query: 'sony wh 1000xm5 vs bose qc ultra', brand: { found: true }, competitors: [{ name: 'Bose QuietComfort Ultra', found: true }] },
          { query: 'best bluetooth headphones with mic', brand: { found: true }, competitors: [{ name: 'Bose QuietComfort Ultra', found: true }] },
          { query: 'top audiophile wireless headphones', brand: { found: false }, competitors: [{ name: 'Bose QuietComfort Ultra', found: true }] }
        ]
      }
    },
    {
      id: 'demo-hist-103',
      timestamp: new Date(now - 3600 * 1000 * 48).toISOString(),
      type: 'single',
      brand: 'Acme Audio Pro',
      query: 'best noise cancelling headphones 2026',
      visibilityScore: 0,
      aiOverviewFound: false,
      aiModeFound: false,
      competitorCount: 2,
      fullData: {
        scanId: 'demo-hist-103',
        query: 'best noise cancelling headphones 2026',
        timestamp: new Date(now - 3600 * 1000 * 48).toISOString(),
        demoMode: true,
        dataAvailability: { aiOverview: true, aiMode: true },
        brand: {
          name: 'Acme Audio Pro',
          aiOverview: { found: false, foundInSources: false, snippets: [] },
          aiMode: { found: false, foundInSources: false, snippets: [] }
        },
        competitors: [
          { name: 'Bose QuietComfort Ultra', aiOverview: { found: true }, aiMode: { found: true } },
          { name: 'Sony WH-1000XM5', aiOverview: { found: true }, aiMode: { found: true } }
        ]
      }
    }
  ];

  saveHistoryToFile(inMemoryHistory);
  return inMemoryHistory;
}

/**
 * Save history array to disk.
 */
function saveHistoryToFile(historyList) {
  ensureCacheDir();
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyList, null, 2));
    inMemoryHistory = historyList;
  } catch (err) {
    console.warn('  [Scan] Writing history.json failed:', err.message);
  }
}

const Scan = {
  /**
   * Save a scan or multi-query scan record to PostgreSQL (if available) and local file storage.
   *
   * @param {object} payload - Scan result payload
   * @returns {object} Summary record
   */
  async saveRecord(payload) {
    const id = payload.scanId || payload.id || crypto.randomUUID();
    const timestamp = payload.timestamp || new Date().toISOString();
    const isMulti = !!payload.perQuery;
    const type = isMulti ? 'multi' : 'single';

    let brand = '';
    if (typeof payload.brand === 'string') {
      brand = payload.brand;
    } else if (payload.brand?.name) {
      brand = payload.brand.name;
    }

    let queryText = payload.query || '';
    if (isMulti && !queryText) {
      const qCount = payload.summary?.totalQueries || payload.perQuery?.length || 0;
      const firstQ = payload.perQuery?.[0]?.query || '';
      queryText = `${qCount} Queries (${firstQ}...)`;
    }

    let visibilityScore = 0;
    let aiOverviewFound = false;
    let aiModeFound = false;

    if (isMulti) {
      visibilityScore = payload.summary?.brandScore ?? payload.overallScore?.brand ?? 0;
      aiOverviewFound = (payload.summary?.brandVisibleIn || 0) > 0;
      aiModeFound = (payload.summary?.brandVisibleIn || 0) > 0;
    } else {
      const foundOverview = !!payload.brand?.aiOverview?.found;
      const foundMode = !!payload.brand?.aiMode?.found;
      aiOverviewFound = foundOverview;
      aiModeFound = foundMode;
      visibilityScore = (foundOverview || foundMode) ? 100 : 0;
    }

    const competitorCount = Array.isArray(payload.competitors) ? payload.competitors.length : 0;

    const record = {
      id,
      timestamp,
      type,
      brand,
      query: queryText,
      visibilityScore,
      aiOverviewFound,
      aiModeFound,
      competitorCount,
      fullData: {
        ...payload,
        id,
        scanId: id
      }
    };

    // 1. Dual persistence: Save to local JSON history cache
    const history = loadHistoryFromFile();
    // Remove duplicate if exists
    const filtered = history.filter(item => item.id !== id);
    filtered.unshift(record);
    saveHistoryToFile(filtered);

    // 2. Save to PostgreSQL if available
    if (isDBAvailable() && !isMulti) {
      try {
        const client = await getPool().connect();
        try {
          await client.query('BEGIN');
          const scanRes = await client.query(
            `INSERT INTO scans (id, brand, query, demo_mode, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET brand = EXCLUDED.brand
             RETURNING id`,
            [id, brand, queryText, !!payload.demoMode, timestamp]
          );
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          console.warn('[Scan] DB insert warning:', err.message);
        } finally {
          client.release();
        }
      } catch (err) {
        console.warn('[Scan] DB connect warning:', err.message);
      }
    }

    return record;
  },

  /**
   * Compatibility wrapper for existing legacy create calls.
   */
  async create(params) {
    if (!isDBAvailable()) return null;
    return null;
  },

  /**
   * List recent audit summaries for history view.
   * @param {number} limit
   * @returns {Array} List of audit summaries
   */
  async list(limit = 20) {
    const history = loadHistoryFromFile();
    return history.slice(0, limit).map(item => ({
      id: item.id,
      timestamp: item.timestamp,
      type: item.type || 'single',
      brand: item.brand,
      query: item.query,
      visibilityScore: item.visibilityScore ?? 0,
      aiOverviewFound: item.aiOverviewFound ?? false,
      aiModeFound: item.aiModeFound ?? false,
      competitorCount: item.competitorCount ?? 0,
      fullData: item.fullData
    }));
  },

  /**
   * Find full scan by ID.
   * @param {string} id
   * @returns {object|null}
   */
  async findById(id) {
    const history = loadHistoryFromFile();
    const found = history.find(item => item.id === id);
    if (found) {
      return found.fullData || found;
    }

    if (isDBAvailable()) {
      try {
        const scanRes = await query('SELECT * FROM scans WHERE id = $1', [id]);
        if (scanRes.rows.length > 0) {
          return scanRes.rows[0];
        }
      } catch (err) {
        console.warn('[Scan] DB findById warning:', err.message);
      }
    }

    return null;
  }
};

module.exports = Scan;
