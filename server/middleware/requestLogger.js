/**
 * Request Logger Middleware — P1 #7
 *
 * Basic request logging for debugging. Logs method, path, and timestamp.
 *
 * Spec ref: P1 #7 — "Basic request logging (method, path, timestamp)
 * for your own debugging — never log the caller's SerpApi key."
 *
 * SECURITY: This middleware intentionally never logs the X-SerpApi-Key
 * header value, even partially.
 */

/**
 * Create a request logging middleware for the public API.
 * @returns {function} Express middleware
 */
function createRequestLogger() {
  return (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    const hasCallerKey = !!req.headers['x-serpapi-key'];

    // Log on response finish to capture status code
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[public-api] ${timestamp} | ${req.method} ${req.originalUrl} | ` +
        `${res.statusCode} | ${duration}ms | ` +
        `mode=${hasCallerKey ? 'live' : 'sandbox'} | ` +
        `ip=${req.ip || 'unknown'}`
      );
    });

    next();
  };
}

module.exports = { createRequestLogger };
