# GEO Auditor — Demo Video Script

> **Max Duration:** 3 minutes (under, not over)
> **Format:** Screen recording, project running locally, core functionality visible
> **Requirement:** Link must open in incognito/private window without requesting access

---

## Pre-Recording Setup

1. Start backend: `npm run dev` from project root
2. Start frontend: `cd client && npm run dev`
3. Open browser to `http://localhost:5173`
4. Clear any previous results
5. Make sure demo sandbox mode is active (no API key needed for recording)
6. Set browser zoom to 100%, use a clean browser window (no bookmarks bar)
7. Screen resolution: 1920x1080 or 2560x1440

---

## Script (Target: 2:30–2:45)

### Opening (0:00–0:15) — Hook

**Show:** Landing page with hero text visible

**Narration:**
> "SEO tools tell you where you rank on Google. But none of them tell you whether your brand appears inside Google's AI-generated answers — the AI Overview and AI Mode responses where users increasingly get their answers without ever clicking a link. GEO Auditor fixes that blind spot."

---

### Section 1: The Scan (0:15–0:50) — P0 Demo

**Action:** Fill in the scan form (or show pre-filled demo values)
- Brand: Sony WH-1000XM5
- Competitors: Bose QuietComfort Ultra, Apple AirPods Max, Sennheiser Momentum 4
- Query: best noise cancelling headphones

**Action:** Click "Run Generative Audit" button

**Narration:**
> "Enter your brand, up to three competitors, and a search query you care about. GEO Auditor calls SerpApi's AI Overview API and AI Mode API to fetch what Google's AI actually says — then scans for your brand and every competitor."

**Show:** Loading state, then results appearing

---

### Section 2: Competitor Matrix (0:50–1:15) — P0 Results

**Action:** Scroll to the comparison matrix table

**Narration:**
> "Instantly, you see a side-by-side comparison. For each brand, we show whether it appears in the AI Overview, in AI Mode, and the exact snippet Google's AI generated about it. In this case, Sony is visible — but let's see what happens when a brand is missing."

**Action:** Point out the visibility badges (Visible/Missing), highlight the matching snippet cards

---

### Section 3: Gap Analysis (1:15–1:50) — P1 #7 + #8

**Action:** Scroll down to the gap analysis section (or run a query where the brand IS missing)

**Narration:**
> "When your brand is missing from AI answers, GEO Auditor doesn't just tell you 'not found' — it explains WHY. We compare your top organic pages against the sources Google's AI actually cited, and identify structural gaps: no comparison content, missing review site coverage, weak organic ranking."

**Action:** Show the structural gaps cards with severity badges

**Narration:**
> "Then we turn those gaps into actionable recommendations — prioritized by impact and effort — so you know exactly what to fix first."

**Action:** Show the recommendations list

---

### Section 4: Multi-Query Score (1:50–2:20) — P1 #9

**Action:** Switch to Multi-Query Score tab

**Narration:**
> "One query gives you a snapshot. But for a real visibility picture, you need to check across multiple related queries. Enter five to ten search terms, and GEO Auditor runs the full audit across all of them — producing an aggregate visibility score."

**Action:** Show score card (e.g., "Brand visible in 3 of 5 queries — 60% visibility") and the per-query breakdown table

---

### Closing (2:20–2:40) — Technical Summary

**Show:** Brief flash of the code structure or terminal output

**Narration:**
> "Under the hood, GEO Auditor is powered by three SerpApi endpoints: the Google AI Overview API, the AI Mode API, and the Organic Search API. There's no external LLM dependency — the gap analysis uses a deterministic heuristic engine. The entire tool runs locally with zero auth required. Built for the SerpApi India Hackathon, Commerce and Market Intelligence track."

---

### End Card (2:40–2:50)

**Show:** GitHub repo URL on screen

> "Try it yourself — link in the description."

---

## Recording Tips

- Use OBS, Loom, or QuickTime for screen recording
- Record at 1080p minimum
- Include cursor movements so viewers can follow along
- Keep mouse movements deliberate and slow
- Upload to YouTube (unlisted) or Google Drive (anyone with link can view)
- **Test the link in an incognito window before submitting**

---

## Fallback Script (if P1 #9 isn't ready)

If multi-query isn't complete by recording day, skip Section 4 and expand Section 3 with a second example query. Target 2:00–2:15 runtime.
