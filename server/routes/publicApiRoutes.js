/**
 * Public API Routes — P0 #1 + P0 #4
 *
 * Mounts the public read-only visibility endpoint.
 * Applies rate limiting ONLY to sandbox (no-key) requests.
 * Applies request logging to all requests.
 *
 * Architecture: This route layer reuses existing analysis services
 * via publicApiController — no business logic duplication.
 */

const express = require('express');
const router = express.Router();
const { getVisibility } = require('../controllers/publicApiController');
const { createRateLimiter } = require('../middleware/rateLimiter');
const { createRequestLogger } = require('../middleware/requestLogger');

// Instantiate middleware
const sandboxRateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000 });
const requestLogger = createRequestLogger();

// Apply request logging to all public API requests
router.use(requestLogger);

/**
 * Conditional rate limiter: only applied when no X-SerpApi-Key header is present.
 * Callers with their own key are not rate-limited (they're spending their own quota).
 */
function conditionalRateLimiter(req, res, next) {
  const callerKey = req.headers['x-serpapi-key'];
  if (!callerKey || typeof callerKey !== 'string' || callerKey.trim().length === 0) {
    // No key → sandbox mode → apply rate limit
    return sandboxRateLimiter(req, res, next);
  }
  // Has key → live mode → no rate limit
  next();
}

// GET /api/v1/visibility — Core public read-only endpoint
router.get('/visibility', conditionalRateLimiter, getVisibility);

module.exports = router;
