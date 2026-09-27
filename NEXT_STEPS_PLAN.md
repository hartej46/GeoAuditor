# GEO Auditor — Next Steps Implementation Plan (P1 #10 & P2 #11)

> **Goal:** Complete the remaining high-impact features for the SerpApi Hackathon:
> 1. **P1 #10: Historical / Trend View** (Audit history log, visibility tracking over time, re-run capability).
> 2. **P2 #11: Exportable Client Report** (Print/PDF-ready executive audit summary and Markdown download).
> 3. **UI Nav Tab Activation** (Clean tab-switching so all navbar items show dedicated, relevant views).

---

## 1. Current State Audit

### Completed Features ✅
- **P0 #1–6:** Brand & competitor detection, SerpApi AI Overview + AI Mode integration, organic baseline, demo sandbox mode (`hartej46/GeoAuditor` commits 1–6).
- **P1 #7:** "Why you're missing" gap analysis engine (`GapAnalysis.jsx`, heuristic rules comparing organic pages vs AI citations).
- **P1 #8:** Prioritized actionable recommendations engine (`Recommendations.jsx`, high/medium/low impact badges).
- **P1 #9:** Multi-query visibility score (`MultiQueryForm.jsx`, `VisibilityScoreCard.jsx`, `QueryBreakdownTable.jsx`, `/api/scan/multi`).

### Pending Features ⏳
- **P1 #10:** Historical / Trend View (Navbar tab `Audit History` currently unhandled; no persistence without Postgres).
- **P2 #11:** Exportable client-shareable report (PDF/print styling or Markdown export).
- **Tab Activation:** Make navbar tabs (`Audit Scanner`, `Competitor Matrix`, `Gap Analysis`, `Multi-Query Score`, `Audit History`) cleanly filter and switch views.

---

## 2. Technical Specification

### Step 1: Storage Layer with Dual-Persistence (Postgres + File/Memory Fallback)
**File to modify:** `server/models/Scan.js` and `server/controllers/scanController.js`
- **Why:** In demo sandbox or when `DATABASE_URL` is not provided, history must still persist locally (in `cache/history.json` or in-memory) so judges can test history and trend views out of the box without running a local Postgres container.
- **Methods to provide:**
  1. `Scan.save(scanData)`: Saves to PostgreSQL if available, otherwise appends to `cache/history.json`.
  2. `Scan.list(limit = 20)`: Returns the last 20 scans with summary fields:
     - `id`: scan UUID
     - `timestamp`: ISO date string
     - `brand`: Brand name
     - `type`: `'single'` | `'multi'`
     - `query`: Target query or query count (e.g. `"best crm for startups" (3 queries)`)
     - `visibilityScore`: percentage (0-100%)
     - `aiOverviewFound`: boolean
     - `aiModeFound`: boolean
     - `competitorCount`: number
  3. `Scan.getById(id)`: Returns full scan payload for re-loading.

### Step 2: New Backend Endpoints
**File to modify:** `server/routes/scanRoutes.js` & `server/controllers/scanController.js`
- `GET /api/scans`: Returns list of historical scans sorted newest first.
- `GET /api/scans/:id`: Returns full scan details to restore past audit state.
- `DELETE /api/scans/:id`: (Optional) Clear an individual history item.

### Step 3: Frontend Component — `AuditHistory.jsx`
**New file:** `client/src/components/AuditHistory.jsx`
- **Summary Header:** Total audits run, average brand visibility score, and visual trend sparkline (SVG) showing visibility percentage over time.
- **Audit Table:**
  - Date & Time
  - Brand Name
  - Query / Scope (e.g. Single query or Multi-query count)
  - AI Overview Presence (% or Found/Missing badge)
  - AI Mode Presence (% or Found/Missing badge)
  - Overall Visibility Score bar
  - Action buttons:
    - **"Load Audit"**: Sets the loaded scan as current results and switches to audit scanner or multi-query view.
    - **"Re-run Now"**: Automatically triggers a fresh scan with the same parameters to measure drift.

### Step 4: Exportable Client Report (P2 #11)
**New file:** `client/src/components/ExportReportModal.jsx` or inline export toolbar in `ResultsTable.jsx` / `VisibilityScoreCard.jsx`
- **Actions:**
  - **"Print / Save PDF"**: Injects a clean `@media print` stylesheet that hides navigation, forms, and buttons, presenting a clean executive audit brief with brand score, competitor benchmark, gaps, and recommendations.
  - **"Export Markdown"**: Generates and downloads a `.md` audit summary file suitable for emailing or adding to GitHub / Notion.
  - **"Export JSON"**: Downloads raw SerpApi + audit analysis payload.

### Step 5: Activate Navigation Tabs in `App.jsx`
**File to modify:** `client/src/App.jsx`
- Switch views cleanly based on `activeTab`:
  - `'audit-scanner'`: Form + full scan results (Summary, Comparison, Gap Analysis, Recommendations).
  - `'competitor-matrix'`: Focuses specifically on the Competitor Comparison Matrix and Snippet breakdown.
  - `'gap-analysis'`: Focuses on Content Gap Analysis and Prioritized Recommendations.
  - `'multi-query-score'`: MultiQueryForm + VisibilityScoreCard + QueryBreakdownTable.
  - `'audit-history'`: Dedicated `AuditHistory` view with trend tracker.

---

## 3. Implementation Verification Checklist

1. [ ] Run `npm run build` in `client/` — zero build errors.
2. [ ] Single scan automatically appears in `Audit History`.
3. [ ] Multi-query scan automatically appears in `Audit History`.
4. [ ] Trend line renders dynamically based on historical scores.
5. [ ] Clicking "Load Audit" loads past data without refetching API credits.
6. [ ] Clicking "Export Report" produces a clean, printable PDF-ready view or Markdown download.
7. [ ] All 5 tabs in the navbar function properly.
