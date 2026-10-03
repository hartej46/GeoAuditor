/**
 * GEO Auditor — Server Entry Point
 *
 * Express server with MVC architecture:
 *  - Initializes PostgreSQL connection pool
 *  - Runs database migrations
 *  - Mounts MVC routes
 *  - Serves React build in production
 */

const path = require('path');
// Load environment variables: check server/.env first, then root .env fallback
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const fs = require('fs');
const { initDB, query, isDBAvailable } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-SerpApi-Key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());

let dbInitialized = false;
async function ensureDB() {
  if (dbInitialized) return;
  if (process.env.DATABASE_URL) {
    initDB();
    if (isDBAvailable()) {
      try {
        await runMigrations();
      } catch (err) {
        console.warn('  ⚠ Migration error:', err.message);
      }
    }
  }
  dbInitialized = true;
}

// Middleware for serverless warm-up & DB readiness
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await ensureDB();
  }
  next();
});

// --- API Routes (MVC) ---
app.use('/api/scan', require('./routes/scanRoutes'));
// Mount GET /api/scans/:id on a separate path prefix
app.use('/api/scans', require('./routes/scanRoutes'));

// --- Public API v1 (read-only visibility endpoint) ---
app.use('/api/v1', require('./routes/publicApiRoutes'));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serpApiKeySet: !!(process.env.SERPAPI_KEY && process.env.SERPAPI_KEY !== 'your_serpapi_key_here'),
    dbConnected: isDBAvailable(),
  });
});

// --- Root API status endpoint ---
app.get('/', (req, res, next) => {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientBuildPath)) {
    return next();
  }
  res.json({
    name: 'GEO Auditor API',
    status: 'online',
    serpApiKeySet: !!(process.env.SERPAPI_KEY && process.env.SERPAPI_KEY !== 'your_serpapi_key_here'),
    dbConnected: isDBAvailable(),
    endpoints: {
      health: 'GET /api/health',
      scan: 'POST /api/scan',
      multiScan: 'POST /api/scan/multi',
      scans: 'GET /api/scans',
      scanById: 'GET /api/scans/:id',
      publicVisibility: 'GET /api/v1/visibility?brand=...&query=...'
    }
  });
});

// --- Serve React build in production (when bundled) ---
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

/**
 * Run database migrations on startup.
 */
async function runMigrations() {
  if (!isDBAvailable()) return;

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    try {
      await query(sql);
      console.log(`  ✓ Migration: ${file}`);
    } catch (err) {
      console.error(`  ✗ Migration ${file} failed:`, err.message);
    }
  }
}

// --- Start (for standalone Node / Docker / non-serverless) ---
async function start() {
  await ensureDB();

  app.listen(PORT, () => {
    console.log(`\n  ✦ GEO Auditor running at http://localhost:${PORT}`);
    console.log(`  ✦ SerpApi key: ${process.env.SERPAPI_KEY && process.env.SERPAPI_KEY !== 'your_serpapi_key_here' ? 'configured ✓' : 'NOT SET ✗ — using demo mode'}`);
    console.log(`  ✦ Database: ${isDBAvailable() ? 'connected ✓' : 'NOT SET ✗ — scans won\'t persist'}`);
    console.log(`  ✦ React dev: run "cd client && npm run dev" for frontend\n`);
  });
}

// Export app for serverless platforms like Vercel
module.exports = app;

if (!process.env.VERCEL) {
  start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
