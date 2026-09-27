# GEO Auditor — P2 #13 Dashboard UI with Visual Charts Plan

> **Goal:** Fulfill Hackathon Spec item 13: *"Proper dashboard UI with charts instead of plain tables."*  
> Deliver rich, interactive visual comparisons between Brand and Competitors without adding heavy external dependencies (using pure React SVG and Sahara CSS).

---

## 1. Feature Specifications

### A. GEO Dimension Comparison Radar / Bar Chart (`GeoComparisonChart.jsx`)
* **Purpose:** Compare target brand against up to 3 competitors across 4 core GEO pillars:
  1. **AI Overview Presence** (100% if cited/found, 0% if missing)
  2. **AI Mode Synthesis** (100% if synthesized, 0% if missing)
  3. **Organic Rank Strength** (Score 0–100 based on search position: #1 = 100, #3 = 80, #5 = 60, #10 = 30, unranked = 0)
  4. **Content & Authority Score** (Score based on domain match and snippet length/depth)
* **Visual:** Pure SVG grouped horizontal bars or radar polygon with brand color (`var(--primary)` / terracotta) vs competitor colors (`var(--on-surface-variant)` / muted slate).

### B. AI Share of Voice Donut / Ring Chart (`ShareOfVoiceChart.jsx`)
* **Purpose:** Visual breakdown of mention density / source citations in Google's AI answers.
* **Visual:** SVG circular ring chart showing percentage share of citations (e.g. Brand 40%, Competitor A 30%, Competitor B 30%). Center displays top brand status badge.

### C. Competitor Matrix Dashboard Integration
* In `client/src/App.jsx`, when `activeTab === 'competitor-matrix'`:
  * Render an **Executive Visual Dashboard** at the top containing:
    - `ShareOfVoiceChart` (left card)
    - `GeoComparisonChart` (right card)
  * Followed by the existing side-by-side card breakdown and snippet text cards.

---

## 2. Technical Architecture & File Changes

1. **`client/src/components/GeoComparisonChart.jsx`** (New):
   - Calculates 4 dimension scores from `results` data.
   - Renders animated SVG score bars with legend, labels, and percentage markers.

2. **`client/src/components/ShareOfVoiceChart.jsx`** (New):
   - Computes citation/mention ratios between brand and competitors.
   - Renders SVG circular donut with stroke-dasharray and legend.

3. **`client/src/App.jsx`**:
   - Imports `GeoComparisonChart` and `ShareOfVoiceChart`.
   - Injects the visual chart suite into `competitor-matrix` and as a collapsible summary in `audit-scanner`.

4. **`client/src/App.css`**:
   - Adds `.chart-grid`, `.chart-card`, `.donut-chart`, and `.comparison-bar` CSS classes matching the Sahara Warm Minimalism theme.

5. **Verification**:
   - `npm run build` in `client/` (0 build errors).
   - `npm run lint` in `client/` (0 warnings).
   - Test in demo mode and live mode.
