/**
 * GEO Auditor — Root Server Entrypoint for Vercel & Node
 */
const app = require('./server/index');

module.exports = app;
module.exports.default = app;
