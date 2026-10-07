# GEO Auditor

> **Discover if your brand appears in Google's AI-generated search answers — and how you stack up against competitors.**

[![Built for SerpApi Hackathon](https://img.shields.io/badge/SerpApi-Hackathon%202026-c2652a?style=flat-square)](https://serpapi.com/)
[![Track](https://img.shields.io/badge/Track-Commerce%20%26%20Market%20Intelligence-blue?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## The Problem

SEO tools tell you where you rank on page 1. **None of them tell you whether you exist inside Google's AI-generated summary** — which is increasingly where users get their final answer without clicking any link.

That's a blind spot for almost every business right now.

## What GEO Auditor Does

GEO Auditor is a **Generative Engine Optimization (GEO)** tool that audits your brand's visibility inside Google's AI answers. Enter your brand, up to 3 competitors, and a target search query — and instantly see:

-  **Brand Visibility Scanner** — Are you mentioned in AI Overview and AI Mode answers?
-  **Competitor Comparison Matrix** — Side-by-side visibility: your brand vs. competitors
-  **"Why You're Missing" Gap Analysis** — Structural comparison of your organic pages against AI-cited sources
-  **Actionable Recommendations** — Prioritized steps to improve your AI search visibility
-  **Multi-Query Visibility Score** — Aggregate visibility across related search queries
-  **Matching Snippet Previews** — See the exact AI-generated text where each brand appears

---

## SerpApi Integration

GEO Auditor is built entirely on **SerpApi** as its core data source. The product does not exist without it.

### APIs Used

| SerpApi Product | Engine | Purpose in GEO Auditor |
|-----------------|--------|----------------------|
| **[Google AI Overview API](https://serpapi.com/google-ai-overview)** | `google` | Fetches the AI-generated summary that appears at the top of Google search results. We extract `ai_overview.text_blocks` for answer text and `ai_overview.reference_links` for cited sources. |
| **[Google AI Mode API](https://serpapi.com/google-ai-mode-api)** | `google_ai_mode` | Fetches Google's conversational AI Mode responses. We extract `text_blocks` and `references` to detect brand mentions in this newer, deeper AI answer format. |
| **[Google Search API](https://serpapi.com/search-api)** | `google` | Fetches standard organic search results (`organic_results`). Used for gap analysis: comparing which pages rank organically vs. which pages the AI Overview actually chose to cite. |

### Why SerpApi Matters Here

- **AI Overview data is not available in any other structured API.** Google doesn't expose AI Overview content through its own Search API. SerpApi is the only reliable way to programmatically access what the AI answer contains and which sources it cited.
- **AI Mode is brand new.** SerpApi's AI Mode API gives access to Google's conversational search format that most tools don't cover yet.
- **Organic + AI in one pipeline.** By combining organic results with AI Overview data from the same SerpApi call, we can perform the gap analysis that makes P1 features possible.

---

## Demo

### Demo Sandbox Mode

GEO Auditor ships with a **built-in demo mode** that works without an API key. It uses pre-tested fixture data (`demo/sample-response.json`) for the query *"best noise cancelling headphones"* to demonstrate the full flow end-to-end.

### Pre-tested Example

| Field | Value |
|-------|-------|
| Brand | Sony WH-1000XM5 |
| Competitors | Bose QuietComfort Ultra, Apple AirPods Max, Sennheiser Momentum 4 |
| Query | best noise cancelling headphones |

---

## Getting Started

### 🐳 1-Step Docker Startup (Recommended for Hackathon Judges)

If you have **Docker** and **Docker Compose** installed, you can spin up the complete production web app + PostgreSQL container in a single command:

```bash
# Clone and enter repo
git clone https://github.com/hartej46/GeoAuditor.git
cd GeoAuditor

# Option A: Start instantly in Sandbox Demo Mode (No API key required!)
docker compose up --build

# Option B: Start with your SerpApi key
SERPAPI_KEY=your_actual_api_key_here docker compose up --build
```

Then open **http://localhost:3000** in your browser!

---

### Standard Local Setup

#### Prerequisites

- **Node.js** v18+ (uses built-in `fetch`)
- **npm** (comes with Node.js)
- **SerpApi API key** — [Get a free key](https://serpapi.com/) (optional — demo mode works without it)
- **PostgreSQL** (optional — app works with automatic local JSON fallback)

#### Installation

```bash
# Clone the repo
git clone https://github.com/hartej46/GeoAuditor.git
cd GeoAuditor

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Set up environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env and add your SERPAPI_KEY (or leave default for demo mode)
```

#### Running Locally

```bash
# Terminal 1: Start the backend
npm run dev

# Terminal 2: Start the frontend
cd client
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health check:** http://localhost:3000/api/health

### Running with Live SerpApi Data

1. Get your API key from [serpapi.com](https://serpapi.com/)
2. Edit `server/.env`:
   ```
   SERPAPI_KEY=your_actual_api_key_here
   ```
3. Restart the server — it will now call SerpApi live (with local caching to avoid burning credits)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Vanilla CSS (Sahara Warm Minimalism design system) |
| Backend | Node.js, Express 4 (MVC architecture) |
| Database | PostgreSQL (optional, for scan persistence) |
| Data Source | SerpApi (AI Overview API, AI Mode API, Google Search API) |
| Analysis | Heuristic-based gap detection engine (no external LLM dependency) |

---

## Project Structure

```
GeoAuditor/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # UI components (ScanForm, ResultsTable, etc.)
│   │   ├── hooks/              # Custom React hooks (useScan)
│   │   ├── utils/              # Helper functions
│   │   ├── App.jsx             # Root application component
│   │   └── App.css             # Sahara Warm Minimalism design system
│   ├── .env.example            # Client env template (VITE_PORT, VITE_API_URL)
│   └── vite.config.js          # Vite config with API proxy
├── server/                     # Express backend (MVC)
│   ├── controllers/            # Request handlers
│   │   ├── scanController.js   # Internal scan orchestration
│   │   └── publicApiController.js # Public API visibility endpoint
│   ├── middleware/             # Express middleware
│   │   ├── rateLimiter.js      # IP-based rate limiter for sandbox mode
│   │   └── requestLogger.js    # Request logging (never logs API keys)
│   ├── services/               # Business logic (serpapi, detector, gapAnalyzer)
│   ├── models/                 # Database models (Scan)
│   ├── routes/                 # API route definitions
│   │   ├── scanRoutes.js       # Internal scan routes
│   │   └── publicApiRoutes.js  # Public API v1 routes
│   ├── config/                 # Database configuration
│   ├── migrations/             # SQL migration files
│   ├── .env.example            # Server env template (PORT, SERPAPI_KEY, DATABASE_URL)
│   └── index.js                # Server entry point
├── demo/                       # Demo fixture data
│   └── sample-response.json    # Pre-tested SerpApi response for offline demo
├── .env.example                # Root environment guide / pointers
└── package.json                # Root package with server scripts
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/visibility` | **Public API** — Read-only brand visibility analysis |
| `POST` | `/api/scan` | Run a visibility scan (brand, competitors, query) |
| `GET` | `/api/scans/:id` | Retrieve a saved scan by ID |
| `GET` | `/api/health` | Health check (SerpApi key status, DB connection) |

### POST /api/scan — Request Body

```json
{
  "brand": "Sony WH-1000XM5",
  "competitors": ["Bose QuietComfort Ultra", "Apple AirPods Max", "Sennheiser Momentum 4"],
  "query": "best noise cancelling headphones"
}
```

---

## Public Visibility API

GEO Auditor exposes a **public, read-only JSON API** so other tools and AI agents can query brand visibility programmatically.

### `GET /api/v1/visibility`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `brand` | query string | ✅ | Brand or product name to audit |
| `query` | query string | ✅ | Search query to analyze |
| `competitors` | query string | ❌ | Comma-separated competitor names (max 3) |
| `location` | query string | ❌ | SerpApi location (default: `United States`) |
| `gl` | query string | ❌ | Country code (default: `us`) |
| `callback_url` | query string | ❌ | Optional webhook URL for asynchronous fire-and-forget delivery |

| Header | Required | Description |
|--------|----------|-------------|
| `X-SerpApi-Key` | ❌ | Your own SerpApi key for **live data**. Omit for sandbox mode. |

### Example: Sandbox Mode (no API key needed)

```bash
curl "https://geoauditor-server.vercel.app/api/v1/visibility?brand=Sony%20WH-1000XM5&query=best%20noise%20cancelling%20headphones&competitors=Bose%20QuietComfort%20Ultra,Apple%20AirPods%20Max"
```

### Example: Live Mode (bring your own SerpApi key)

```bash
curl -H "X-SerpApi-Key: YOUR_SERPAPI_KEY" \
  "https://geoauditor-server.vercel.app/api/v1/visibility?brand=Sony%20WH-1000XM5&query=best%20noise%20cancelling%20headphones&competitors=Bose%20QuietComfort%20Ultra,Apple%20AirPods%20Max"
```

### Example: Asynchronous Webhook / Callback Mode

For AI agents and automated workflows that prefer non-blocking execution, provide `callback_url`:

```bash
curl -H "X-SerpApi-Key: YOUR_SERPAPI_KEY" \
  "https://geoauditor-server.vercel.app/api/v1/visibility?brand=Sony%20WH-1000XM5&query=best%20noise%20cancelling%20headphones&callback_url=https://my-agent.com/webhooks/geo-audit"
```

The server immediately returns `202 Accepted` in ~50ms:

```json
{
  "status": "accepted",
  "message": "Scan accepted. Results will be delivered to callback_url once complete.",
  "scanId": "ceab6329-a0d6-4a34-9c9f-685a6307e006",
  "callbackUrl": "https://my-agent.com/webhooks/geo-audit",
  "mode": "live",
  "brand": "Sony WH-1000XM5",
  "query": "best noise cancelling headphones"
}
```

Once the scan finishes, GEO Auditor sends an outgoing `POST` request to `callback_url` with the complete visibility JSON payload and headers:
- `X-GEO-Auditor-Event: visibility.completed`
- `X-GEO-Auditor-Delivery: <delivery-uuid>`
- `Content-Type: application/json`

### Example Response (truncated)

```json
{
  "scanId": "a1b2c3d4-...",
  "query": "best noise cancelling headphones",
  "location": "United States",
  "gl": "us",
  "timestamp": "2026-10-04T00:00:00.000Z",
  "mode": "sandbox",
  "dataAvailability": { "aiOverview": true, "aiMode": true },
  "brand": {
    "name": "Sony WH-1000XM5",
    "aiOverview": {
      "found": true,
      "inSources": true,
      "snippets": ["The Sony WH-1000XM5 remains the gold standard for noise cancellation…"],
      "matchedSources": ["Sony WH-1000XM5 Review - SoundGuys"]
    },
    "aiMode": { "found": true, "inSources": true, "snippets": ["…"], "matchedSources": ["…"] }
  },
  "competitors": [
    { "name": "Bose QuietComfort Ultra", "aiOverview": { "found": true, "…": "…" }, "aiMode": { "…": "…" } }
  ],
  "gapAnalysis": {
    "brandOrganicPresence": { "found": true, "bestRank": 3, "pages": ["…"] },
    "citedSourceAnalysis": { "totalCited": 6, "sources": ["…"] },
    "overlap": { "brandPagesCited": ["…"], "brandPagesNotCited": ["…"], "citedNotBrand": ["…"] },
    "structuralGaps": [
      { "gapType": "no_comparison_content", "severity": "high", "title": "Missing Comparison / Listicle Content", "explanation": "…" }
    ]
  },
  "recommendations": [
    { "priority": 1, "action": "Publish Category Comparison & Roundup Content", "detail": "…", "effort": "medium", "impact": "high" }
  ]
}
```

### Rate Limiting

Sandbox mode (no `X-SerpApi-Key` header) is rate-limited to **10 requests per minute per IP**. Callers with their own SerpApi key are not rate-limited.

### Error Responses

All errors return structured JSON:

```json
{ "error": "Missing required parameter: brand", "message": "Provide a brand or product name to audit…" }
```

| Status | Meaning |
|--------|---------|
| `400` | Missing or malformed `brand` or `query` parameter |
| `429` | Rate limit exceeded (sandbox mode only) |
| `502` | Upstream SerpApi request failed (live mode only) |
| `500` | Internal server error |

---

## Model Context Protocol (MCP) Server

GEO Auditor includes an **official Model Context Protocol (MCP) server** (`mcp-server/`), allowing AI agents (such as Claude Desktop, Claude Code, Cursor, or custom LangChain/LlamaIndex agents) to discover and invoke GEO Auditor directly as a native tool.

### Starting the MCP Server

```bash
# Start HTTP MCP Server (SSE + Streamable HTTP on port 3001)
npm run mcp
```

Endpoints exposed:
- **SSE Transport:** `https://mcp-server-psi-weld.vercel.app/sse`
- **Streamable HTTP:** `https://mcp-server-psi-weld.vercel.app/mcp`
- **Discovery / Info:** `https://mcp-server-psi-weld.vercel.app/`

### Tools Available

#### `check_brand_visibility`
Audits whether a brand appears in Google's AI-generated search answers (Google AI Overview & AI Mode) vs competitors, returning detection status, matching snippets, authoritative cited sources, structural gap analysis, and recommendations.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `brand` | string | ✅ | Brand or product name to audit (e.g. `Sony WH-1000XM5`, `Notion`) |
| `query` | string | ✅ | Search query to evaluate in Google AI answers |
| `competitors` | string or array | ❌ | Competitor names to compare against (max 3) |
| `serpapi_key` | string | ❌ | Caller's own SerpApi key for live Google AI data |
| `location` | string | ❌ | Geographic location (default: `United States`) |
| `gl` | string | ❌ | Country code (default: `us`) |

### Example Tool Call

```json
{
  "name": "check_brand_visibility",
  "arguments": {
    "brand": "Notion",
    "query": "best note taking app for students",
    "competitors": ["Obsidian", "Evernote"],
    "serpapi_key": "your_serpapi_key_here"
  }
}
```

### Claude Desktop & Agent Configuration

Add GEO Auditor to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "geo-auditor": {
      "command": "node",
      "args": [
        "/path/to/GeoAuditor/mcp-server/index.js",
        "--stdio"
      ]
    }
  }
}
```

Or connect over HTTP (Streamable HTTP / SSE):
```json
{
  "mcpServers": {
    "geo-auditor-http": {
      "url": "https://mcp-server-psi-weld.vercel.app/mcp"
    }
  }
}
```

---

## Features by Priority

### P0 — Core (Complete ✅)
- Input flow: brand, up to 3 competitors, target query
- Fetch AI Overview + AI Mode results via SerpApi
- Brand/competitor detection in AI-generated answers and cited sources
- Side-by-side comparison matrix with visibility badges
- Pre-tested demo flow with fixture data

### P1 — Advanced Analysis
- "Why you're missing" gap analysis engine
- Actionable, prioritized recommendations
- Multi-query visibility score (aggregate across related queries)

### P2 — Polish
- Exportable client report (PDF/shareable link)
- Multi-location comparison (e.g., Mumbai vs. Delhi)
- Dashboard UI with charts

---

## Hackathon Track

**Commerce & Market Intelligence** — GEO Auditor helps businesses understand their visibility in the rapidly growing AI-generated search landscape, enabling data-driven decisions about content strategy and competitive positioning.

---

## AI Tools Disclosure

The following AI tools were used during development:
- **Google Gemini** — Code generation, implementation of features, debugging
- **Anthropic Claude (via Antigravity IDE)** — Architecture planning, code review, implementation plans, README authoring

Both tools were used as pair-programming assistants. All generated code was reviewed and tested by the developer.

---

## License

MIT

---

## Acknowledgments

- [SerpApi](https://serpapi.com/) — For providing the APIs that make this project possible
- [SerpApi India Hackathon 2026](https://serpapi.com/) — For the opportunity to build this
