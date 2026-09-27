/**
 * GEO Auditor — Server Entry Point
 *
 * Express server with MVC architecture:
 *  - Initializes PostgreSQL connection pool
 *  - Runs database migrations
 *  - Mounts MVC routes
 *  - Serves React build in production
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const { initDB, query, isDBAvailable } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());

// --- API Routes (MVC) ---
app.use('/api/scan', require('./routes/scanRoutes'));
// Mount GET /api/scans/:id on a separate path prefix
app.use('/api/scans', require('./routes/scanRoutes'));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serpApiKeySet: !!(process.env.SERPAPI_KEY && process.env.SERPAPI_KEY !== 'your_serpapi_key_here'),
    dbConnected: isDBAvailable(),
  });
});

// --- Serve React build in production ---
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

// --- Start ---
async function start() {
  // Initialize DB (non-fatal if unavailable)
  initDB();

  // Run migrations
  await runMigrations();

  app.listen(PORT, () => {
    console.log(`\n  ✦ GEO Auditor running at http://localhost:${PORT}`);
    console.log(`  ✦ SerpApi key: ${process.env.SERPAPI_KEY && process.env.SERPAPI_KEY !== 'your_serpapi_key_here' ? 'configured ✓' : 'NOT SET ✗ — using demo mode'}`);
    console.log(`  ✦ Database: ${isDBAvailable() ? 'connected ✓' : 'NOT SET ✗ — scans won\'t persist'}`);
    console.log(`  ✦ React dev: run "cd client && npm run dev" for frontend\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
