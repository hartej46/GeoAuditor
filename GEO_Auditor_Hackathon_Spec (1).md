# GEO Auditor — SerpApi India Hackathon Project Spec

**Purpose of this document:** This is an execution spec, not a pitch deck. It is written to be handed to an AI coding agent (or a human dev) and worked through top-to-bottom. No code is included on purpose — this defines *what* to build and in *what order*, not *how*.

---

## 1. Overview

**One-liner:** A tool that shows brand/business owners whether and how they appear inside Google's AI-generated search answers (AI Overview / AI Mode) — and gives them concrete steps to improve that visibility, the way SEO tools do for classic rankings.

**Problem:** SEO tools tell you where you rank on page 1. None of them tell you whether you exist inside Google's AI-generated summary — which is increasingly where users get their final answer without clicking any link. That's a blind spot for almost every business right now.

**Target user:** Marketing teams, SMB owners, and SEO/marketing agencies who want to know their "Generative Engine Optimization" (GEO) standing versus competitors.

---

## 2. Hackathon Fit

- **Track:** Commerce & Market Intelligence (primary recommendation). Knowledge & Public Interest is a secondary fit — make the final call once the MVP shape is locked, but default to Commerce & Market Intelligence unless there's a strong reason to switch.
- **Meaningful SerpApi usage:** Google AI Overview API + Google AI Mode API are the core data source — the product does not exist without them. Google Organic Search API is used as the "classic search" baseline for comparison.
- **Judging angle:** Strongest on *Originality* (few tools address this yet) and *Usefulness* (real, current pain point). *Technical Complexity* needs to be made visible deliberately — see P1 features below, don't let the MVP stay too shallow.

---

## 3. Priorities (build order — do not reorder without a reason)

### P0 — Must ship (demo-blocking; there is no product without these)
1. Input flow: user enters a brand/product name, up to 3 competitor names, and a target query/topic.
2. Fetch AI Overview + AI Mode results for that query via SerpApi.
3. Detect whether the target brand appears anywhere in the AI-generated answer text or its cited sources (yes/no + the matching snippet if yes).
4. Run the same detection for each competitor, side by side.
5. Results view: a simple table/card comparing brand vs. competitors — visibility yes/no, plus the exact AI-answer text where each appears.
6. One reliable, pre-tested example flow (real product category, tested repeatedly) that works end-to-end for the demo recording.

### P1 — Should ship (raises technical complexity + originality score)
7. "Why you're missing" analysis: compare the brand's top organic pages against the sources the AI Overview actually cited, and explain structurally why the brand wasn't picked (e.g., no comparison page, thin content vs. the cited competitor, missing FAQ-style content).
8. Actionable, prioritized recommendations list based on the gap analysis above.
9. Multi-query support: run the same brand across 5–10 related queries at once instead of a single query, producing a "visibility score" instead of one yes/no.
10. Historical/trend view — even a simple "run again tomorrow, compare" is enough (stretch — only if P0 and P1.7–9 are solid with time to spare).

### P2 — Nice to have (polish only, after P0 and P1 are both solid)
11. Export a client-shareable report (PDF or shareable link).
12. Multi-location comparison using SerpApi's location parameter (e.g., visibility in Mumbai vs. Delhi results).
13. Proper dashboard UI with charts instead of plain tables.

**Rule for the executing agent:** do not start P1 work until every P0 item has a working, demo-able path. Do not start P2 until P1 items 7–8 are done.

---

## 4. Core Features (name + one-line description)
- **Brand Visibility Scanner** — core detection engine (P0)
- **Competitor Comparison View** — side-by-side results table (P0)
- **Gap Analysis Engine** — explains *why* the brand is missing and *what to fix* (P1)
- **Multi-Query Visibility Score** — aggregate score across related queries (P1)
- **Trend Tracker** — visibility change over time (P1 stretch)
- **Exportable Report** (P2)
- **Multi-Location Comparison** (P2)

---

## 5. High-Level Architecture (components, not code)
- **Frontend:** simple web dashboard — input form + results view. No auth needed.
- **Backend / orchestration:** handles SerpApi calls, caches results locally to avoid burning search credits during dev/testing, and runs the LLM analysis step.
- **SerpApi integration layer:** wraps calls to the AI Overview API, AI Mode API, and Organic Search API.
- **LLM analysis layer:** takes SerpApi's raw results plus the user's brand info and produces the gap analysis + recommendations. Keep this provider-agnostic in the spec — don't hardcode to one LLM vendor.
- **Data storage:** lightweight. Only needed if the Trend Tracker (P1 stretch) is attempted; otherwise the tool can be stateless per scan.

---

## 6. Non-Goals (explicitly out of scope — do not let this scope-creep)
- No user accounts or auth system for the hackathon MVP.
- No payment/billing integration.
- No mobile app — web only.
- No search engines other than Google for v1.
- No scheduling/cron infrastructure for trend tracking unless P0 + P1 are fully done with days to spare.

---

## 7. Timeline (submission deadline: Oct 5, 2026, 23:59 IST)
- **Week 1:** P0 items 1–6 complete and demo-able end to end.
- **Week 2:** P1 items 7–9 (gap analysis + multi-query score). Start README and demo script in parallel.
- **Final days:** record demo video, finalize submission form answers, polish the public repo, and do a full secrets/credentials sweep before making the repo public.

---

## 8. Submission Requirements Checklist (from official hackathon rules — do not skip any)
- [ ] Public GitHub repo containing the project, documentation, and setup/usage instructions.
- [ ] README explicitly names which SerpApi products/APIs are used and why they matter (name exact endpoints: AI Overview API, AI Mode API, Organic Search API — don't leave this vague).
- [ ] Demo video: screen recording, under 3 minutes, shows the project running locally with core functionality visible; link must open in an incognito/private window without requesting access.
- [ ] Submission form: lead participant name, email, mobile number, occupation, years of experience; team member names/emails if applicable (max 4 additional members).
- [ ] Select track: Commerce & Market Intelligence (confirm before final submission).
- [ ] State that the project did not exist before the hackathon (building fresh).
- [ ] Disclose any AI tools used in development — name them and briefly describe their contribution.
- [ ] Accept the Rules and Terms & Conditions.
- [ ] **Security check before making the repo public: confirm no API keys, credentials, or secrets exist anywhere in the repo or its git history.**

---

## 9. Risks / Watch-outs
- AI Overview/AI Mode results don't trigger for every query — pick demo queries in advance where they reliably appear, and re-verify this close to recording day.
- Don't burn the free monthly search quota during development — cache test results locally instead of re-calling the API on every test run.
- The Gap Analysis Engine (P1 item 7) is the highest-risk item on the list for running over time budget — timebox it. A simpler heuristic-based version is an acceptable fallback if the LLM-based version isn't converging in time.

---

## 10. Definition of Done
The project is submission-ready when a stranger can clone the public repo, follow the README, run it locally, enter a brand name, and see a working visibility comparison against competitors — without needing any explanation beyond what's written down.

---

## Notes for the executing agent
Work strictly top-down through the priority tiers: P0 → P1 → P2. Do not skip ahead. Each numbered feature above should be broken into its own task/subtask as work begins. If a SerpApi endpoint (AI Overview API / AI Mode API) is unavailable, region-locked, or returns an unexpected response shape, surface that as a blocker back to the human immediately — do not silently substitute a different approach.
