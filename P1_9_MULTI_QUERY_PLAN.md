# P1 #9 Implementation Plan — Multi-Query Visibility Score

> **Status:** Ready for execution (start AFTER P1 #7 and #8 are verified working)
> **Scope:** P1 #9 — Multi-query support producing an aggregate "visibility score"
> **Pre-requisite:** P1 #7 (gap analysis) and #8 (recommendations) must be complete and working.
> **Rule:** Follow SKILL.md — plan before code, thin vertical slices, checkpoint commits.

---

## 1. What We're Building

From the hackathon spec:
> Multi-query support: run the same brand across 5–10 related queries at once instead of a single query, producing a "visibility score" instead of one yes/no.

**Concrete deliverable:** The user can enter their brand + competitors as before, but instead of a single query, they enter (or auto-generate) 5–10 related queries. The system runs visibility detection across ALL queries and produces:

1. An **aggregate visibility score** (0–100%) for the brand across all queries
2. The **same score for each competitor** for comparison
3. A **per-query breakdown** showing which queries the brand is visible/missing in
4. The **gap analysis + recommendations aggregated** across all queries (not per-query)

---

## 2. Architecture Decisions

### 2a. Query Input Strategy

Two modes:
- **Manual:** User types 5–10 queries (textarea, one per line)
- **Auto-suggest:** User enters one seed query + brand, and we generate related queries using common patterns (e.g., "best [category]", "[brand] vs [competitor]", "[category] review", "[brand] worth it")

For the hackathon MVP, implement **manual input** first. Auto-suggest is a bonus if time permits.

### 2b. Execution Strategy

- Run queries **sequentially** (not parallel) to respect SerpApi rate limits and caching.
- Each query reuses the existing `fetchAIOverview()` + `fetchAIMode()` pipeline — the cache layer prevents redundant API calls.
- Cap at **10 queries max** to keep execution time under 30 seconds in demo mode.

### 2c. Scoring Formula

```
Visibility Score = (queries where brand is found in AI Overview OR AI Mode) / (total queries) * 100
```

Round to nearest integer. Display as "X%" with color coding:
- 70–100%: Green (strong visibility)
- 40–69%: Amber/primary (moderate)
- 0–39%: Red (weak/missing)

### 2d. Demo Mode

Extend `demo/sample-response.json` with 2–3 additional query fixtures so multi-query works in demo mode. Or generate slightly varied responses from the existing fixture.

---

## 3. File Changes

### New Files

| File | Purpose |
|------|---------|
| `server/services/multiQueryScanner.js` | Orchestrates running detection across multiple queries, computes aggregate score |
| `client/src/components/MultiQueryForm.jsx` | Multi-query input form (textarea or multiple input fields) |
| `client/src/components/VisibilityScoreCard.jsx` | Large score display component (circular gauge or prominent number) |
| `client/src/components/QueryBreakdownTable.jsx` | Per-query results breakdown table |

### Modified Files

| File | Change |
|------|--------|
| `server/controllers/scanController.js` | Add `runMultiScan` handler |
| `server/routes/scanRoutes.js` | Add `POST /api/scan/multi` route |
| `client/src/App.jsx` | Add multi-query tab view, render new components when `activeTab === 'multi-query-score'` |
| `client/src/hooks/useScan.js` | Add `runMultiScan` function alongside existing `runScan` |
| `client/src/App.css` | Add styles for score gauge, query breakdown, multi-query form |
| `demo/sample-response.json` | Add additional query fixtures for demo mode |

---

## 4. Implementation Steps

### Step 1: Create Multi-Query Scanner Service

**File:** `server/services/multiQueryScanner.js`

```javascript
/**
 * Multi-Query Scanner — P1 #9
 *
 * Runs brand/competitor detection across multiple queries
 * and produces an aggregate visibility score.
 *
 * Spec ref: P1 #9 — "run the same brand across 5–10 related queries at once
 * instead of a single query, producing a 'visibility score' instead of one yes/no."
 */

const { fetchAIOverview, fetchAIMode } = require('./serpapi');
const { detect } = require('./detector');

/**
 * @param {string} brandName
 * @param {string[]} competitors - Array of competitor names
 * @param {string[]} queries - Array of 2-10 search queries
 * @returns {Promise<{
 *   overallScore: { brand: number, competitors: {name: string, score: number}[] },
 *   perQuery: Array<{
 *     query: string,
 *     brand: { found: boolean, aiOverview: boolean, aiMode: boolean },
 *     competitors: Array<{ name: string, found: boolean, aiOverview: boolean, aiMode: boolean }>
 *   }>,
 *   summary: { totalQueries: number, brandVisibleIn: number, bestCompetitor: string, bestCompetitorScore: number }
 * }>}
 */
async function runMultiQueryScan(brandName, competitors, queries) {
  // ... implementation
}
```

Key logic:
- Loop through each query sequentially
- For each query: call `fetchAIOverview()` + `fetchAIMode()` + `detect()` for brand and each competitor
- Accumulate results per query
- Compute `overallScore` = visible queries / total queries * 100

### Step 2: Add API Route

**File:** `server/routes/scanRoutes.js`

Add: `router.post('/multi', runMultiScan);`

**File:** `server/controllers/scanController.js`

Add `runMultiScan` handler:
- Accepts `{ brand, competitors, queries }` in request body
- Validates queries array (2–10 items, non-empty strings)
- Calls `multiQueryScanner.runMultiQueryScan()`
- Returns aggregated results

### Step 3: Extend Demo Fixture

Add 2 more query fixtures to `demo/sample-response.json` (e.g., "noise cancelling headphones vs earbuds", "best headphones for work from home") with slightly different brand visibility patterns so the score isn't always 100%.

### Step 4: Build Frontend Components

**MultiQueryForm.jsx** — Similar to ScanForm but with:
- Brand + competitors (same as current)
- A textarea for queries (one per line) OR expandable input rows
- A "suggested queries" helper that pre-fills common patterns
- Submit button: "Run Multi-Query Audit"

**VisibilityScoreCard.jsx** — Large, prominent display:
- Brand score (big number, colored by tier)
- Competitor scores side by side
- "Your brand is visible in X of Y queries"

**QueryBreakdownTable.jsx** — Matrix table:
- Rows = queries
- Columns = brand + each competitor
- Cells = visible/missing badges (reuse existing VisibilityBadge)

### Step 5: Wire into App.jsx

When `activeTab === 'multi-query-score'`, show:
1. MultiQueryForm (if no results)
2. VisibilityScoreCard + QueryBreakdownTable (if results exist)

### Step 6: Add CSS Styles

- Large score number: use `var(--font-headline)`, 64px+
- Score tiers: green/amber/red using existing `--success-*`, `--primary`, `--danger-*` tokens
- Circular progress ring (optional, CSS-only animation)

### Step 7: Test & Commit

```bash
git add server/services/multiQueryScanner.js
git commit -m "feat(P1): add multi-query scanner with aggregate visibility scoring"

git add server/controllers/scanController.js server/routes/scanRoutes.js
git commit -m "feat(P1): add POST /api/scan/multi route for multi-query scans"

git add client/src/components/MultiQueryForm.jsx client/src/components/VisibilityScoreCard.jsx client/src/components/QueryBreakdownTable.jsx
git commit -m "feat(P1): add multi-query form, score card, and breakdown table components"

git add client/src/App.jsx client/src/App.css client/src/hooks/useScan.js
git commit -m "feat(P1): integrate multi-query tab into main app"

git add demo/sample-response.json projectProgress.md
git commit -m "docs: extend demo fixture for multi-query and update progress"

git push origin main
```

---

## 5. Constraints

- Max 10 queries per multi-scan
- Sequential execution (not parallel) to respect rate limits
- No new npm dependencies
- Demo mode must work with fixture data
- Reuse existing detection logic — do NOT duplicate `detect()` or `fetchAIOverview()`
- The existing single-query scan (`POST /api/scan`) must continue working unchanged
- Update `projectProgress.md` when done — mark P1 #9 as `[x]`

---

## 6. Verification Checklist

- [ ] `POST /api/scan/multi` returns aggregate scores + per-query breakdown
- [ ] Multi-query tab shows form, score card, and breakdown table
- [ ] Demo mode works with 3+ queries
- [ ] Existing single-query scan still works (regression check)
- [ ] Score color coding works for all tiers (high/medium/low)
- [ ] All code committed and pushed
- [ ] `projectProgress.md` updated
