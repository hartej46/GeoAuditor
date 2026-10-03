/**
 * Rate Limiter Middleware — P0 #4
 *
 * Simple in-memory rate limiter keyed by IP address.
 * Scoped to the sandbox (no-key) path of the public API to prevent
 * abuse of the free demo mode.
 *
 * Spec ref: P0 #4 — "Rate limiting on the no-key (sandbox) path —
 * strict per-IP limit (e.g. 10 requests/minute) so the public demo
 * mode can't be hammered or scraped."
 */

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // clean stale entries every 5 minutes

// In-memory store: Map<ip, { count, windowStart }>
const ipStore = new Map();

// Periodic cleanup of stale entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipStore.entries()) {
    if (now - record.windowStart > DEFAULT_WINDOW_MS * 2) {
      ipStore.delete(ip);
    }
  }
}, CLEANUP_INTERVAL_MS).unref(); // .unref() so the timer doesn't keep the process alive

/**
 * Create a rate-limiter middleware.
 *
 * @param {object} options
 * @param {number} [options.maxRequests=10] - Maximum requests per window
 * @param {number} [options.windowMs=60000] - Window size in milliseconds
 * @returns {function} Express middleware
 */
function createRateLimiter(options = {}) {
  const maxRequests = options.maxRequests || DEFAULT_MAX_REQUESTS;
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    let record = ipStore.get(ip);

    if (!record || (now - record.windowStart) > windowMs) {
      // New window
      record = { count: 1, windowStart: now };
      ipStore.set(ip, record);
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      const retryAfterSec = Math.ceil((record.windowStart + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Sandbox mode is limited to ${maxRequests} requests per minute. Please provide your own SerpApi key via the X-SerpApi-Key header for unlimited access.`,
        retryAfterSeconds: retryAfterSec,
      });
    }

    next();
  };
}

module.exports = { createRateLimiter };
