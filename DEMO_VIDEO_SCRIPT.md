# GEO Auditor — 3-Minute Demo Video Script

> **Target Duration:** 2:45 – 3:00 minutes (Strict Hackathon Limit: Under 3 minutes)  
> **Format:** Clean screen recording with voiceover narration  
> **Track:** Commerce & Market Intelligence (SerpApi Hackathon 2026)  
> **Requirements:** Full real-world functionality visible, link opens in private/incognito window without requesting access.

---

## 🎬 Pre-Recording Setup

### 1. Terminal / Background Services
Open a split terminal or ensure the background services are running:
```bash
# Terminal 1: Backend Server (Port 3000)
cd server && node index.js

# Terminal 2: React Frontend UI (Port 5173)
cd client && npm run dev

# Terminal 3: MCP Server (Port 3001)
npm run mcp
```

### 2. Browser Windows / Tabs Prepared
Set browser zoom to **100%**, hide bookmarks bar, and open:
- **Tab 1:** `http://localhost:5173` (GEO Auditor Dashboard)
- **Tab 2:** Terminal or Postman ready with the Public API & Webhook curl commands
- **Tab 3:** `http://localhost:3001/` (MCP Discovery endpoint) or Claude Desktop config

---

## 🧭 Video Timing Breakdown

```
[0:00 - 0:25]  1. The Hook & The Generative Search Problem
[0:25 - 1:00]  2. Live Brand Audit & Competitor Matrix
[1:00 - 1:30]  3. "Why You're Missing" Gap Analysis & Actionable Fixes
[1:30 - 2:00]  4. Public Visibility REST API & Async Webhook Callbacks
[2:00 - 2:30]  5. Model Context Protocol (MCP) Server for AI Agents
[2:30 - 2:48]  6. Multi-Query Score, Historical Trends & Executive Export
[2:48 - 3:00]  7. Technical Architecture & Outro
```

---

## 🎙️ Step-by-Step Script & Actions

---

### Step 1: The Hook & The Problem (0:00 – 0:25)
**Screen:** Show the GEO Auditor landing page hero section on `http://localhost:5173`.  
**Visual Action:** Slowly hover over the hero title *"Discover if your brand appears in Google's AI-generated search answers"*.

**Voiceover Narration:**
> "Every SEO tool tells you where your website ranks in Google's traditional ten blue links. But search has fundamentally changed. Today, Google's **AI Overview** and **AI Mode** synthesize answers right on the page, satisfying user intent with zero clicks required.
> 
> If your brand isn't cited inside that AI synthesis, you are invisible. **GEO Auditor** is a Generative Engine Optimization platform built on SerpApi that audits your brand's AI visibility, compares you to competitors, and shows you exactly how to get cited."

---

### Step 2: Live Brand Audit & Competitor Matrix (0:25 – 1:00)
**Screen:** The Audit Scanner form on the dashboard.  
**Visual Action:**
1. Show pre-filled inputs:
   - **Brand:** `Notion` (or `Sony WH-1000XM5`)
   - **Competitors:** `Obsidian`, `Evernote` (or `Bose QuietComfort Ultra`, `Apple AirPods Max`)
   - **Search Query:** `best note taking app for students`
2. Click the primary **"Run Generative Audit"** button.
3. Show the real-time loading indicator, then results appearing.
4. Scroll to the **Competitor Comparison Matrix** and hover over the green and red detection badges.

**Voiceover Narration:**
> "Let's run a live audit. We'll search for 'best note taking app for students' with Notion as our target brand against competitors Obsidian and Evernote.
> 
> Under the hood, GEO Auditor calls SerpApi's Google AI Overview and AI Mode endpoints in parallel. Instantly, our Comparison Matrix reveals the exact visibility breakdown: Notion and Obsidian are synthesized into Google's AI answer, while Evernote is completely absent.
> 
> Clicking into any brand reveals the verbatim snippet extracted directly from Google's AI response, showing exactly how the AI represents the product."

---

### Step 3: "Why You're Missing" Gap Analysis & Actionable Fixes (1:00 – 1:30)
**Screen:** Scroll down to the **Gap Analysis** and **Recommendations** section.  
**Visual Action:**
1. Highlight the **Structural Gaps** cards with their severity pills (`[HIGH]`, `[MEDIUM]`).
2. Point out the **Cited Sources breakdown** (YouTube, review roundups, authority publications).
3. Hover over the **Prioritized Recommendations** with Effort vs. Impact tags.

**Voiceover Narration:**
> "When a competitor outperforms you or your brand is missing, GEO Auditor doesn't just give you a red flag — it performs a deep structural Gap Analysis.
> 
> We compare your brand's organic footprint against the authoritative sources Google's AI actually cited. In this case, it discovers high-severity gaps: missing third-party comparison guides and lack of video citation presence.
> 
> It then translates those gaps into prioritized recommendations — ranked by effort and impact — giving marketing and content teams an immediate playbook to earn AI citations."

---

### Step 4: Public Visibility REST API & Async Webhooks (1:30 – 2:00)
**Screen:** Switch briefly to Terminal / Postman.  
**Visual Action:**
1. Execute curl for the Public API:
   ```bash
   curl -s "http://localhost:3000/api/v1/visibility?brand=Notion&query=best+note+taking+app+for+students" | jq .
   ```
2. Show the clean JSON response containing brand presence, score, cited sources, and gaps.
3. Execute curl with `callback_url`:
   ```bash
   curl -X GET "http://localhost:3000/api/v1/visibility?brand=Notion&query=best+note+taking+app&callback_url=https://example.com/webhook"
   ```
4. Highlight the immediate **`HTTP 202 Accepted`** response in ~35ms with `scanId`.

**Voiceover Narration:**
> "For developer workflows and enterprise integrations, GEO Auditor exposes an official **Public Visibility API** at `/api/v1/visibility`. It returns complete brand detection, cited sources, and gap intelligence in a single structured JSON response.
> 
> It also features an **Asynchronous Webhook Callback** system: append a `callback_url`, and the API immediately returns `HTTP 202 Accepted` in under 40 milliseconds, executing the scan in the background and posting the finished payload to your server with delivery headers and automatic retry safety."

---

### Step 5: Model Context Protocol (MCP) Server for AI Agents (2:00 – 2:30)
**Screen:** Show `http://localhost:3001/` discovery JSON or Claude Desktop config.  
**Visual Action:**
1. Show the MCP server running on port `3001` with endpoints for **Streamable HTTP** (`/mcp`) and **SSE** (`/sse`).
2. Show the registered tool definition: `check_brand_visibility`.
3. Show Claude Desktop or an AI assistant invoking the tool directly to analyze a brand.

**Voiceover Narration:**
> "We've also built an official **Model Context Protocol (MCP) Server**, making GEO Auditor natively accessible to autonomous AI agents in Claude Desktop, Cursor, or custom LLM frameworks.
> 
> Using the current standard **Streamable HTTP transport** and SSE, AI agents can discover the `check_brand_visibility` tool and run real-time generative search audits on demand. The MCP server acts as a thin wrapper over our REST API, supporting Bring-Your-Own-Key quota protection so teams can plug GEO intelligence directly into their automated agent pipelines."

---

### Step 6: Multi-Query Score, Historical Trends & Executive Export (2:30 – 2:48)
**Screen:** Switch back to the Web UI at `http://localhost:5173`.  
**Visual Action:**
1. Click the **"Multi-Query"** tab to show aggregate brand visibility across 5 queries.
2. Click the **"History"** tab to show PostgreSQL audit trend charts over time.
3. Click the **"Export Report"** button to download a polished PDF / Markdown executive brief.

**Voiceover Narration:**
> "Beyond single queries, GEO Auditor calculates an aggregate **Multi-Query Visibility Score** across your entire category search landscape, tracks historical audit trends in PostgreSQL, and generates client-ready PDF and Markdown executive reports with a single click."

---

### Step 7: Technical Architecture & Outro (2:48 – 3:00)
**Screen:** Show the GitHub repository page or project README with architecture badge.

**Voiceover Narration:**
> "Under the hood: SerpApi's Google AI Overview, AI Mode, and Search engines, powered by an Express MVC backend, React 19 frontend, and an official MCP server with 100% deterministic heuristic analysis.
> 
> Check out the open-source code on GitHub. Thanks for watching!"

---

## 💡 Practical Recording Checklist

- [ ] **Timing Check:** Rehearse once with a stopwatch — ensure each section hits its mark (keep total runtime between 2:40 and 2:55).
- [ ] **Mouse Control:** Avoid rapid cursor wiggling; move smoothly and hover over elements as you talk about them.
- [ ] **Audio Quality:** Use an external microphone or headset in a quiet room with minimal echo.
- [ ] **Clean Video:** 1080p minimum (1920x1080), 30 or 60 fps, full screen browser.
- [ ] **Incognito Verification:** Before submitting your recording link (Loom, YouTube Unlisted, or Google Drive), **open it in an Incognito / Private browsing window** to verify it plays without asking for login or permissions.
