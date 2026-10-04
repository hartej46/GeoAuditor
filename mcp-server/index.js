/**
 * GEO Auditor — Model Context Protocol (MCP) Server
 *
 * Implements GEO_Auditor_MCP_Server_Spec.md:
 *  - P0 #1: Minimal McpServer instance with name & version
 *  - P0 #2: Typed check_brand_visibility tool
 *  - P0 #3: Thin pass-through to existing /api/v1/visibility REST endpoint
 *  - P0 #4: HTTP transport (Streamable HTTP + SSE)
 *  - P1 #7: Graceful error handling in tool handler
 */

const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Attempt loading environment variables from mcp-server/.env or server/.env if available
const envFiles = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', 'server', '.env')
];
for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    try {
      const raw = fs.readFileSync(envPath, 'utf8');
      for (const line of raw.split('\n')) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || '').trim();
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (!process.env[key]) process.env[key] = val;
        }
      }
    } catch (e) {
      // Ignore env load errors
    }
  }
}

const SERVER_NAME = 'geo-auditor';
const SERVER_VERSION = '1.0.0';
const DEFAULT_API_URL = process.env.GEO_AUDITOR_API_URL;
const MCP_PORT = parseInt(process.env.MCP_PORT, 10) || 3001;

/**
 * Register the check_brand_visibility tool on an McpServer instance.
 */
function registerTools(server) {
  server.tool(
    'check_brand_visibility',
    'Audit whether a brand or product appears in Google AI-generated answers (Google AI Overview & AI Mode) vs competitors for a target search query. Returns detection status, matching AI snippets, authoritative cited sources, structural gap analysis, and actionable GEO recommendations.',
    {
      brand: z.string().describe('Brand or product name to audit (e.g. "Sony WH-1000XM5", "Notion", "Figma")'),
      query: z.string().describe('Search query to evaluate in Google AI answers (e.g. "best noise cancelling headphones", "best note taking app for students")'),
      competitors: z.array(z.string()).or(z.string()).optional().describe('Competitor names to compare side-by-side (array of strings or comma-separated string, max 3)'),
      serpapi_key: z.string().optional().describe('Caller\'s own SerpApi key for live Google AI Overview data. If omitted, uses server default key or falls back to sandbox demo mode.'),
      location: z.string().optional().describe('SerpApi geographic location (default: "United States")'),
      gl: z.string().optional().describe('Two-letter country code (default: "us")')
    },
    async ({ brand, query, competitors, serpapi_key, location, gl }) => {
      try {
        const queryParams = new URLSearchParams({
          brand: brand.trim(),
          query: query.trim()
        });

        if (competitors) {
          const compStr = Array.isArray(competitors)
            ? competitors.map(c => c.trim()).filter(Boolean).slice(0, 3).join(',')
            : competitors.trim();
          if (compStr) queryParams.set('competitors', compStr);
        }

        if (location) queryParams.set('location', location.trim());
        if (gl) queryParams.set('gl', gl.trim());

        const headers = {
          'Accept': 'application/json',
          'User-Agent': 'GEO-Auditor-MCP/1.0'
        };

        if (serpapi_key && typeof serpapi_key === 'string' && serpapi_key.trim().length > 0) {
          headers['X-SerpApi-Key'] = serpapi_key.trim();
        }

        const requestUrl = `${DEFAULT_API_URL}/api/v1/visibility?${queryParams.toString()}`;
        console.log(`[mcp-server] Calling REST API: ${requestUrl}`);

        const response = await fetch(requestUrl, {
          method: 'GET',
          headers
        });

        const data = await response.json();

        // P1 #7: Handle REST API error responses gracefully without crashing
        if (!response.ok) {
          const errMsg = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `[GEO Auditor Error ${response.status}] ${errMsg}`
              }
            ]
          };
        }

        // Return formatted JSON visibility result
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };

      } catch (err) {
        console.error('[mcp-server] Tool execution error:', err.message);
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `[GEO Auditor Error] Failed to execute visibility check: ${err.message}`
            }
          ]
        };
      }
    }
  );
}

/**
 * Factory to create a configured McpServer instance.
 */
function createMcpServer() {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION
  });
  registerTools(server);
  return server;
}

/**
 * Create and configure Express app for MCP HTTP transport.
 */
function createExpressApp() {
  const app = express();

  // Trust reverse proxies (Vercel, Cloudflare, etc.) so req.protocol is accurate
  app.set('trust proxy', 1);

  // Permissive CORS for MCP clients
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-SerpApi-Key, mcp-session-id');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  app.use(express.json());

  // Store active SSE transports by sessionId
  const sseTransports = new Map();

  // Root discovery endpoint
  app.get('/', (req, res) => {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${MCP_PORT}`;
    const baseUrl = `${proto}://${host}`;

    res.json({
      name: 'GEO Auditor MCP Server',
      version: SERVER_VERSION,
      protocol: 'Model Context Protocol (MCP)',
      transport: {
        sse: `${baseUrl}/sse`,
        messages: `${baseUrl}/messages?sessionId=<sessionId>`,
        streamableHttp: `${baseUrl}/mcp`
      },
      tools: [
        {
          name: 'check_brand_visibility',
          description: 'Audit whether a brand appears in Google AI answers vs competitors'
        }
      ]
    });
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', mcp: true, version: SERVER_VERSION });
  });

  // --- SSE Transport (GET /sse + POST /messages) ---
  app.get('/sse', async (req, res) => {
    console.log('[mcp-server] New incoming SSE connection');
    const mcpServer = createMcpServer();
    const transport = new SSEServerTransport('/messages', res);
    sseTransports.set(transport.sessionId, transport);

    res.on('close', () => {
      console.log(`[mcp-server] SSE connection closed (session: ${transport.sessionId})`);
      sseTransports.delete(transport.sessionId);
    });

    try {
      await mcpServer.connect(transport);
    } catch (err) {
      console.error('[mcp-server] SSE connect error:', err.message);
    }
  });

  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
      return res.status(400).send('Missing sessionId query parameter');
    }

    const transport = sseTransports.get(sessionId);
    if (!transport) {
      return res.status(404).send('Session not found or expired');
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (err) {
      console.error(`[mcp-server] Error handling message for session ${sessionId}:`, err.message);
      res.status(500).send('Internal server error processing message');
    }
  });

  // --- Streamable HTTP Transport (POST /mcp) ---
  const streamableSessions = new Map();

  app.all('/mcp', async (req, res) => {
    try {
      const sessionId = req.headers['mcp-session-id'];
      let transport = sessionId ? streamableSessions.get(sessionId) : null;

      if (!transport) {
        const mcpServer = createMcpServer();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID()
        });
        await mcpServer.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);

      if (transport.sessionId && !streamableSessions.has(transport.sessionId)) {
        streamableSessions.set(transport.sessionId, transport);
        transport.onclose = () => {
          streamableSessions.delete(transport.sessionId);
        };
      }
    } catch (err) {
      console.error('[mcp-server] Streamable HTTP error:', err.message);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    }
  });

  return app;
}

const app = createExpressApp();

/**
 * Start HTTP server (SSE + Streamable HTTP).
 */
async function startHttpServer() {
  return new Promise((resolve) => {
    const serverInstance = app.listen(MCP_PORT, () => {
      console.log(`\n  ✦ GEO Auditor MCP Server running on port ${MCP_PORT}`);
      console.log(`  ✦ SSE Endpoint:           http://localhost:${MCP_PORT}/sse`);
      console.log(`  ✦ Streamable HTTP:        http://localhost:${MCP_PORT}/mcp`);
      console.log(`  ✦ Backend API Target:     ${DEFAULT_API_URL}`);
      console.log(`  ✦ Registered Tools:       check_brand_visibility\n`);
      resolve(serverInstance);
    });
  });
}

/**
 * Start stdio server (for CLI / Claude Desktop local spawn).
 */
async function startStdioServer() {
  const mcpServer = createMcpServer();
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('[mcp-server] GEO Auditor MCP Server connected via stdio');
}

// Entry point selection: stdio vs HTTP
if (require.main === module && !process.env.VERCEL) {
  if (process.argv.includes('--stdio')) {
    startStdioServer().catch(err => {
      console.error('[mcp-server] Stdio fatal error:', err);
      process.exit(1);
    });
  } else {
    startHttpServer().catch(err => {
      console.error('[mcp-server] HTTP fatal error:', err);
      process.exit(1);
    });
  }
}

module.exports = app;
module.exports.app = app;
module.exports.createExpressApp = createExpressApp;
module.exports.createMcpServer = createMcpServer;
module.exports.startHttpServer = startHttpServer;
module.exports.startStdioServer = startStdioServer;
