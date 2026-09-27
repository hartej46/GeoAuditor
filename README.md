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

# Set up environment
cp .env.example .env
# Edit .env and add your SERPAPI_KEY (or leave default for demo mode)
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
2. Edit `.env`:
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
│   └── vite.config.js          # Vite config with API proxy
├── server/                     # Express backend (MVC)
│   ├── controllers/            # Request handlers (scanController)
│   ├── services/               # Business logic (serpapi, detector, gapAnalyzer)
│   ├── models/                 # Database models (Scan)
│   ├── routes/                 # API route definitions
│   ├── config/                 # Database configuration
│   ├── migrations/             # SQL migration files
│   └── index.js                # Server entry point
├── demo/                       # Demo fixture data
│   └── sample-response.json    # Pre-tested SerpApi response for offline demo
├── .env.example                # Environment variables template
└── package.json                # Root package with server scripts
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
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
