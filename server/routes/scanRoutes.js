/**
 * Scan Routes
 *
 * Thin routing layer — maps HTTP endpoints to controller methods.
 * No business logic here; all logic lives in scanController.
 */

const express = require('express');
const router = express.Router();
const { runScan, getScan } = require('../controllers/scanController');

// POST /api/scan — Run a new visibility scan
router.post('/', runScan);

// GET /api/scans/:id — Retrieve a saved scan
router.get('/:id', getScan);

module.exports = router;
