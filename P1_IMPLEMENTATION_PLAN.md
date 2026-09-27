# P1 Implementation Plan — Gap Analysis Engine & Recommendations

> **Status:** Ready for execution
> **Scope:** P1 #7 (Why you're missing gap analysis) + P1 #8 (Actionable recommendations)
> **Pre-requisite:** All P0 items (1–6) are complete and demo-able.
> **Rule:** Follow SKILL.md — plan before code, thin vertical slices, checkpoint commits.

---

## 1. What We're Building

### P1 #7 — "Why You're Missing" Gap Analysis

From the hackathon spec:
> Compare the brand's top organic pages against the sources the AI Overview actually cited, and explain structurally why the brand wasn't picked (e.g., no comparison page, thin content vs. the cited competitor, missing FAQ-style content).

**Concrete deliverable:** When a scan completes, if the brand is MISSING from the AI Overview, the system should:
1. Fetch the brand's top organic search results for the same query (via SerpApi Google Organic Search API — `engine: google`).
2. Compare those pages structurally against the sources the AI Overview actually cited (already available from the P0 scan in `ai_overview.reference_links`).
3. Produce a structured gap report explaining *why* the brand's pages weren't selected.

### P1 #8 — Actionable Recommendations

From the hackathon spec:
> Actionable, prioritized recommendations list based on the gap analysis above.

**Concrete deliverable:** Based on the gap analysis, generate 3–5 prioritized, specific recommendations the brand can act on to improve their chances of appearing in AI Overviews.

---

## 2. Architecture Decisions

### 2a. No External LLM Required (Heuristic-First Approach)

The hackathon spec (section 5) mentions an "LLM analysis layer" but also (section 9, Risks) says:
> "A simpler heuristic-based version is an acceptable fallback if the LLM-based version isn't converging in time."

**Decision: Use a heuristic/rule-based engine.** Reasons:
- No extra API key dependency (keeps setup simple for judges).
- Deterministic, explainable output.
- Faster execution (no LLM latency).
- Can always be upgraded later.

### 2b. Data Source for Organic Results

Use the existing `fetchFromSerpApi()` in `server/services/serpapi.js` with `engine: 'google'` — the P0 AI Overview fetch already calls this engine. The organic results are in the `organic_results` array of the same response. We may already have them cached from the P0 scan.

### 2c. Demo Mode Support

The demo fixture (`demo/sample-response.json`) must be extended with:
- `organic_results` array (brand's organic ranking for the query).
- The gap analysis and recommendations should work fully in demo mode.

---

## 3. File Changes (Exact Paths)

### New Files to Create

| File | Purpose |
|------|---------|
| `server/services/gapAnalyzer.js` | Core gap analysis engine — compares organic pages vs. cited sources |
| `client/src/components/GapAnalysis.jsx` | Frontend component to display gap analysis results |
| `client/src/components/Recommendations.jsx` | Frontend component to display actionable recommendations |

### Existing Files to Modify

| File | Change |
|------|--------|
| `server/services/serpapi.js` | Add `fetchOrganicResults(query)` function that returns organic_results from the Google response |
| `server/controllers/scanController.js` | Call gap analyzer after detection, include gapAnalysis + recommendations in response |
| `demo/sample-response.json` | Add `organic_results` array to the `ai_overview_response` object |
| `client/src/App.jsx` | Render `<GapAnalysis>` and `<Recommendations>` below `<ResultsTable>` when data exists |
| `client/src/App.css` | Add styles for gap analysis cards and recommendations list |
| `projectProgress.md` | Update P1 progress checklist |

---

## 4. Implementation Steps (Execute in This Order)

### Step 1: Extend Demo Fixture with Organic Results

**File:** `demo/sample-response.json`

Add an `organic_results` array inside `ai_overview_response`. This simulates what SerpApi returns for regular Google search results alongside the AI Overview. Include 8-10 organic results. Make sure:
- Some results are from **the same domains as `reference_links`** (e.g., rtings.com, wirecutter) — these are the "AI-cited" sources.
- Some results are from the **brand's own domain** (e.g., sony.com) — these are the brand's organic pages.
- Some results are from **competitor domains** (e.g., bose.com, apple.com).
- Include realistic `title`, `link`, `snippet`, and `position` fields.

Example structure for each organic result:
```json
{
  "position": 1,
  "title": "Best Noise Cancelling Headphones 2026 - RTINGS.com",
  "link": "https://www.rtings.com/headphones/reviews/best/noise-cancelling",
  "snippet": "We've tested over 200 headphones to find the best noise cancelling options...",
  "displayed_link": "rtings.com > headphones > reviews",
  "source": "RTINGS.com"
}
```

### Step 2: Add `fetchOrganicResults()` to SerpApi Service

**File:** `server/services/serpapi.js`

Add a new exported function:

```javascript
/**
 * Extract organic results from a Google search response.
 * In demo mode, returns fixture data.
 * In live mode, the organic_results are already present in the AI Overview response
 * (same API call, engine: 'google'), so we can reuse that cached response.
 *
 * @param {string} query - The search query
 * @returns {object[]} Array of organic result objects
 */
async function fetchOrganicResults(query) {
  if (isDemoMode()) {
    const fixture = loadDemoFixture('ai_overview');
    return fixture.organic_results || [];
  }

  // The AI Overview fetch already uses engine:'google' which includes organic_results
  // This will hit cache if already fetched during the same scan
  const result = await fetchFromSerpApi('google', query, {});
  return result.organic_results || [];
}
```

Export it: add `fetchOrganicResults` to `module.exports`.

### Step 3: Build the Gap Analyzer Service

**File:** `server/services/gapAnalyzer.js` (NEW)

This is the core P1 logic. Create this service with a single exported function:

```javascript
/**
 * Gap Analyzer — P1 #7 + #8
 *
 * Compares brand's organic search presence against AI Overview cited sources
 * to explain why the brand is missing and what to fix.
 *
 * Spec ref: P1 #7 — "Compare the brand's top organic pages against the sources
 * the AI Overview actually cited, and explain structurally why the brand wasn't
 * picked."
 * Spec ref: P1 #8 — "Actionable, prioritized recommendations list based on
 * the gap analysis above."
 */
```

**Function signature:**
```javascript
function analyzeGap(brandName, organicResults, citedSources, brandDetectionResult)
```

**Parameters:**
- `brandName` — string, the brand/product name
- `organicResults` — array of organic result objects from SerpApi (each has `position`, `title`, `link`, `snippet`, `source`)
- `citedSources` — array of `{ title, link }` from `ai_overview.reference_links`
- `brandDetectionResult` — the P0 detection result for the brand (`{ aiOverview: { found, snippets, ... }, aiMode: { ... } }`)

**Return value:**
```javascript
{
  gapAnalysis: {
    brandOrganicPresence: {
      found: boolean,
      pages: [
        { position: number, title: string, link: string, snippet: string }
      ],
      bestRank: number | null
    },
    citedSourceAnalysis: {
      totalCited: number,
      sources: [
        { title: string, link: string, domain: string }
      ]
    },
    overlap: {
      brandPagesCited: [],
      brandPagesNotCited: [],
      citedNotBrand: [],
    },
    structuralGaps: [
      {
        gapType: string,
        severity: 'high' | 'medium' | 'low',
        title: string,
        explanation: string
      }
    ]
  },
  recommendations: [
    {
      priority: number,
      action: string,
      detail: string,
      effort: 'low' | 'medium' | 'high',
      impact: 'low' | 'medium' | 'high'
    }
  ]
}
```

**Gap Detection Heuristics (implement these rules in order):**

1. **`no_organic_presence`** (HIGH severity) — Brand has zero pages in organic results for this query. If the brand doesn't even rank organically, it has no chance of being cited.

2. **`low_organic_ranking`** (MEDIUM severity) — Brand appears in organic results but below position 10. AI Overviews tend to cite top-ranking authoritative sources.

3. **`no_comparison_content`** (HIGH severity) — Check if the cited sources are comparison/listicle pages (look for keywords in titles/snippets like "best", "vs", "top", "comparison", "review"). If cited sources are comparison pages but the brand's organic pages are product pages (no comparison keywords), flag this gap.

4. **`thin_snippet_content`** (MEDIUM severity) — Compare the average snippet length of cited sources vs. brand's organic pages. If brand snippets are significantly shorter, flag as potential thin content.

5. **`missing_review_coverage`** (MEDIUM severity) — Check if cited sources are review sites (rtings.com, wirecutter, tomsguide, soundguys, techradar, whathifi, etc.). If the brand lacks coverage on these review sites, flag it.

6. **`domain_not_authoritative`** (LOW severity) — If cited sources are all from well-known review/publication domains and the brand's pages are from a lesser-known domain, note the authority gap.

7. **`competitor_better_positioned`** (MEDIUM severity) — If competitors have organic pages ranking higher than the brand for the same query, flag this.

**Recommendations Generation (implement these based on detected gaps):**

Map each gap type to one or more recommendations. For example:
- `no_organic_presence` -> "Create dedicated content targeting this query" (high impact, medium effort)
- `no_comparison_content` -> "Publish a comparison page (e.g., 'Brand vs Competitor A vs Competitor B')" (high impact, medium effort)
- `missing_review_coverage` -> "Reach out to review sites like [list cited review sites] for product coverage" (high impact, high effort)
- `thin_snippet_content` -> "Expand your page content with detailed specs, FAQs, and structured data" (medium impact, low effort)
- `low_organic_ranking` -> "Improve SEO fundamentals: internal linking, backlinks, page speed, and keyword optimization" (high impact, high effort)

Sort recommendations by: impact DESC, then effort ASC.

### Step 4: Wire Gap Analysis into the Scan Controller

**File:** `server/controllers/scanController.js`

In the `runScan` function, after the existing detection code (after line ~55), add:

```javascript
// --- Gap Analysis (P1 #7 + #8) ---
console.log('[scan] Running gap analysis...');
const organicResults = await fetchOrganicResults(cleanQuery);
const gapResult = analyzeGap(
  cleanBrand,
  organicResults,
  aiOverviewData?.ai_overview?.reference_links || [],
  brandResult
);
```

Add the imports at the top:
```javascript
const { fetchOrganicResults } = require('../services/serpapi');
const { analyzeGap } = require('../services/gapAnalyzer');
```

Include in the response object:
```javascript
const response = {
  // ... existing fields ...
  gapAnalysis: gapResult.gapAnalysis,
  recommendations: gapResult.recommendations,
};
```

### Step 5: Build Frontend — GapAnalysis Component

**File:** `client/src/components/GapAnalysis.jsx` (NEW)

Create a React component that displays the gap analysis results. Follow the existing Sahara Warm Minimalism design patterns from `ResultsTable.jsx`.

**Structure:**
- Section header with eyebrow text: "P1 - Structural Analysis"
- Title: "Why You're Missing"
- Only show this component if `gapAnalysis` data exists AND brand is MISSING from AI Overview
- Show brand's organic presence summary (best rank, number of pages found)
- Show cited sources list with domains
- Show structural gaps as cards, each with:
  - Severity badge (HIGH = danger color, MEDIUM = warning/primary color, LOW = muted)
  - Gap title
  - Explanation text
- Use the existing CSS class patterns: `sahara-card`, `metric-card`, `status-badge`, etc.

### Step 6: Build Frontend — Recommendations Component

**File:** `client/src/components/Recommendations.jsx` (NEW)

Create a React component that displays the prioritized recommendations. Follow Sahara design patterns.

**Structure:**
- Section header with eyebrow text: "P1 - Action Plan"
- Title: "Recommendations to Improve AI Visibility"
- Only show if `recommendations` array is non-empty
- Render each recommendation as a numbered card with:
  - Priority number (large, primary color)
  - Action title (bold)
  - Detail text
  - Two small pills: Impact badge + Effort badge
- Use appropriate color coding: high impact = success green, high effort = danger red, etc.

### Step 7: Wire Frontend Components into App

**File:** `client/src/App.jsx`

Import the two new components:
```jsx
import GapAnalysis from './components/GapAnalysis';
import Recommendations from './components/Recommendations';
```

Render them below the existing `{results && <ResultsTable data={results} />}`:
```jsx
{results && <ResultsTable data={results} />}
{results?.gapAnalysis && (
  <GapAnalysis
    gapAnalysis={results.gapAnalysis}
    brandName={results.brand.name}
    brandFound={results.brand.aiOverview?.found || results.brand.aiMode?.found}
  />
)}
{results?.recommendations && results.recommendations.length > 0 && (
  <Recommendations recommendations={results.recommendations} />
)}
```

### Step 8: Add CSS Styles

**File:** `client/src/App.css`

Add styles for the new components at the end of the file. Follow existing design token usage:

- Gap analysis section: use `.sahara-card` pattern with severity-colored left borders
- Severity badges: HIGH = `var(--danger-text)` on `var(--danger-bg)`, MEDIUM = `var(--primary)` on `var(--primary-fixed)`, LOW = `var(--outline)` on `var(--surface-container)`
- Recommendations: numbered cards with large priority number, impact/effort pills
- Keep all styles consistent with the Sahara Warm Minimalism tokens already defined in `:root`

### Step 9: Test the Full Flow

1. Start the server: `npm run dev` (from project root)
2. Start the client: `cd client && npm run dev`
3. Run a scan with the default demo values (Sony WH-1000XM5 vs competitors)
4. Verify:
   - P0 results still display correctly (regression check)
   - Gap analysis section appears below the comparison matrix
   - Structural gaps are listed with severity badges
   - Recommendations appear with priority ordering
5. Test edge case: when brand IS found in AI Overview, gap analysis should either not show or show a "You're visible!" summary instead of gaps.

### Step 10: Commit and Push

```bash
git add server/services/gapAnalyzer.js
git commit -m "feat(P1): add gap analysis engine with heuristic-based structural gap detection"

git add server/services/serpapi.js server/controllers/scanController.js
git commit -m "feat(P1): wire gap analyzer into scan pipeline, add organic results fetch"

git add demo/sample-response.json
git commit -m "fix(demo): extend fixture with organic_results for gap analysis demo"

git add client/src/components/GapAnalysis.jsx client/src/components/Recommendations.jsx
git commit -m "feat(P1): add GapAnalysis and Recommendations frontend components"

git add client/src/App.jsx client/src/App.css
git commit -m "feat(P1): integrate gap analysis and recommendations into main app view"

git add projectProgress.md P1_IMPLEMENTATION_PLAN.md
git commit -m "docs: update progress tracker and add P1 implementation plan"

git push origin main
```

---

## 5. Important Constraints

- **Do NOT introduce any new npm dependencies.** The heuristic analyzer uses only built-in JS. No LLM SDK.
- **Do NOT break P0.** The gap analysis is additive — the existing scan flow must continue working exactly as before, with gap data appended to the response.
- **Demo mode must work.** All gap analysis logic must produce meaningful output when using the demo fixture (no live API key required).
- **Follow SKILL.md rules.** Commit at each working checkpoint. Do not skip to P2.
- **Follow existing code patterns.** Use the same JSDoc comment style, the same error handling patterns, the same CSS class naming conventions.
- **Update `projectProgress.md`** after completing each item — mark P1 #7 and #8 as done.

---

## 6. Verification Checklist

After implementation, verify these pass:

- [ ] Server starts without errors: `npm run dev`
- [ ] Client starts without errors: `cd client && npm run dev`
- [ ] Demo scan returns `gapAnalysis` and `recommendations` in JSON response
- [ ] Gap analysis UI renders below comparison matrix when brand is missing
- [ ] Recommendations list shows 3-5 prioritized items
- [ ] Existing P0 comparison matrix still works correctly
- [ ] All code committed and pushed to `origin/main`
- [ ] `projectProgress.md` updated with P1 #7 and #8 marked as `[x]`
