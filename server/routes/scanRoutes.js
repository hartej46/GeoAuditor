/**
 * Scan Routes
 *
 * Thin routing layer — maps HTTP endpoints to controller methods.
 * No business logic here; all logic lives in scanController.
 */

const express = require('express');
const router = express.Router();
const { runScan, getScans, getScan, runMultiScan } = require('../controllers/scanController');

// GET /api/scans — Retrieve audit history summaries
router.get('/', getScans);

// POST /api/scan — Run a new single query visibility scan
router.post('/', runScan);

// POST /api/scan/multi — Run a multi-query visibility scan
router.post('/multi', runMultiScan);

// GET /api/scans/:id — Retrieve a saved scan
router.get('/:id', getScan);

module.exports = router;


