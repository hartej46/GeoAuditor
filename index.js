/**
 * GEO Auditor — Root Server Entrypoint for Vercel & Node
 */
const app = require('./server/index');

module.exports = app;
module.exports.default = app;

// Only start listening when run directly as main script and not on Vercel
if (require.main === module && !process.env.VERCEL) {
  if (typeof app.start === 'function') {
    app.start().catch(err => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
  }
}
