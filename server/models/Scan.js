/**
 * Scan Model
 *
 * Database operations for scan records.
 * Handles creating scans with their results and retrieving them.
 * All SQL is parameterized to prevent injection.
 */

const { query, getPool, isDBAvailable } = require('../config/db');

const Scan = {
  /**
   * Create a new scan with its detection results in a single transaction.
   *
   * @param {object} params
   * @param {string} params.brand - Brand name
   * @param {string} params.queryText - Search query
   * @param {boolean} params.demoMode - Whether demo fixture was used
   * @param {object} params.brandResult - Detection result for brand { aiOverview, aiMode }
   * @param {Array} params.competitorResults - Array of { name, aiOverview, aiMode }
   * @returns {object} The created scan with results, or null if DB unavailable
   */
  async create({ brand, queryText, demoMode, brandResult, competitorResults }) {
    if (!isDBAvailable()) return null;

    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      // Insert scan record
      const scanRes = await client.query(
        `INSERT INTO scans (brand, query, demo_mode)
         VALUES ($1, $2, $3)
         RETURNING id, brand, query, demo_mode, created_at`,
        [brand, queryText, demoMode]
      );
      const scan = scanRes.rows[0];

      // Insert brand result
      await client.query(
        `INSERT INTO scan_results (scan_id, entity_name, entity_type, ai_overview, ai_mode)
         VALUES ($1, $2, 'brand', $3, $4)`,
        [scan.id, brand, JSON.stringify(brandResult.aiOverview), JSON.stringify(brandResult.aiMode)]
      );

      // Insert competitor results
      for (const comp of competitorResults) {
        await client.query(
          `INSERT INTO scan_results (scan_id, entity_name, entity_type, ai_overview, ai_mode)
           VALUES ($1, $2, 'competitor', $3, $4)`,
          [scan.id, comp.name, JSON.stringify(comp.aiOverview), JSON.stringify(comp.aiMode)]
        );
      }

      await client.query('COMMIT');
      return scan;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Find a scan by ID with all its results.
   *
   * @param {string} id - Scan UUID
   * @returns {object|null} Scan with nested results, or null if not found
   */
  async findById(id) {
    if (!isDBAvailable()) return null;

    const scanRes = await query(
      'SELECT id, brand, query, demo_mode, created_at FROM scans WHERE id = $1',
      [id]
    );

    if (scanRes.rows.length === 0) return null;

    const scan = scanRes.rows[0];

    const resultsRes = await query(
      `SELECT entity_name, entity_type, ai_overview, ai_mode
       FROM scan_results WHERE scan_id = $1
       ORDER BY entity_type ASC, entity_name ASC`,
      [id]
    );

    const brandRow = resultsRes.rows.find(r => r.entity_type === 'brand');
    const competitorRows = resultsRes.rows.filter(r => r.entity_type === 'competitor');

    return {
      ...scan,
      brand: brandRow
        ? { name: brandRow.entity_name, aiOverview: brandRow.ai_overview, aiMode: brandRow.ai_mode }
        : null,
      competitors: competitorRows.map(r => ({
        name: r.entity_name,
        aiOverview: r.ai_overview,
        aiMode: r.ai_mode,
      })),
    };
  },

  /**
   * List recent scans (for potential future dashboard use).
   *
   * @param {number} limit - Max number of scans to return
   * @returns {Array} List of scan summaries
   */
  async findRecent(limit = 10) {
    if (!isDBAvailable()) return [];

    const res = await query(
      'SELECT id, brand, query, demo_mode, created_at FROM scans ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return res.rows;
  },
};

module.exports = Scan;
