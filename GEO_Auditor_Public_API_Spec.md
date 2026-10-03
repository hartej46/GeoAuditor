# GEO Auditor — Public Visibility API Spec

**Purpose of this document:** Execution spec for one additional feature — a public, read-only API that exposes GEO Auditor's analysis layer so other tools and AI agents can integrate with it directly. No code included — this defines what to build and in what order.

---

## 1. Overview

**One-liner:** A public JSON API that returns GEO Auditor's brand-visibility and gap-analysis results, so other applications or AI agents can query "does this brand appear in Google's AI answers" programmatically, not just through the dashboard.

**Why this is not duplicate of SerpApi:** SerpApi returns raw search data (AI Overview blocks, AI Mode results, organic listings). It has no concept of "this brand," "competitor comparison," or "why this brand is missing." That analysis layer — detection, scoring, structural gap reasoning — is GEO Auditor's own logic. This feature exposes that layer, not SerpApi's raw data.

**Why this instead of the account/login feature:** cheaper to build (reuses existing logic rather than adding new auth infrastructure), carries no cross-domain session/auth risk on the current split deployment (Vercel + Render/Railway), and directly strengthens the project's core pitch — "a platform other tools can build on" — rather than adding plumbing unrelated to the judging criteria.

---

## 2. Priorities (build order)

### P0 — Must ship
1. One read-only endpoint, e.g. `GET /api/v1/visibility`, accepting brand, competitors, and query as parameters, returning the same JSON shape your frontend's Gap Analysis view already consumes.
2. Quota protection: the endpoint requires the caller's own SerpApi key (passed as a header) to run a live lookup. No key provided → endpoint falls back to serving pre-tested Sandbox/demo data instead of silently failing or spending your quota.
3. Basic input validation (reject empty/malformed brand or query params with a clear error, not a server crash).
4. Rate limiting on the no-key (sandbox) path — strict per-IP limit (e.g. 10 requests/minute) so the public demo mode can't be hammered or scraped.

### P1 — Should ship
5. A documented example in the README: the exact endpoint, an example `curl` request, and an example JSON response — this is what makes it read as a real integration point, not a route a judge happened to find.
6. Consistent, structured error responses (status code + message) instead of raw stack traces leaking to callers.
7. Basic request logging (method, path, timestamp) for your own debugging — never log the caller's SerpApi key.

### P2 — Nice to have (only if P0+P1 are solid with time to spare)
8. A proper OpenAPI/Swagger spec file for the endpoint.
9. A second endpoint exposing the multi-query visibility score separately from single-query gap analysis.

---

## 3. Core Features
- **Public Visibility Endpoint** — the core read API (P0)
- **Bring-Your-Own-Key Quota Protection** — caller's key or sandbox fallback (P0)
- **Rate-Limited Sandbox Mode** — safe default for callers without a key (P0)
- **API Documentation Block** — README section with example request/response (P1)
- **Structured Error Handling** (P1)

---

## 4. Architecture (components, not code)
- New route layer (e.g. a `publicApi` route file) that reuses your existing `serpapi.js`, `detector.js`, and `gapAnalyzer.js` logic — this feature should not duplicate any existing analysis code, only expose it.
- A small middleware step: extract the caller's SerpApi key from a request header if present; if absent, route the request to cached Sandbox data instead of a live SerpApi call.
- A simple in-memory or lightweight rate limiter keyed by IP, scoped only to the no-key/sandbox path.

---

## 5. Non-Goals (explicitly out of scope)
- No API key issuance system for your own service — this is "bring your own SerpApi key," not a developer-account system with its own keys.
- No billing, usage dashboards, or per-customer quota tracking.
- No write endpoints — this API is read-only.
- No GraphQL or alternative query formats — one simple REST endpoint is enough.

---

## 6. Risks / Watch-outs
- **Never log or echo back the caller's SerpApi key** in responses, error messages, or logs.
- Without the sandbox rate limit, a public no-key endpoint is an open invitation to be hammered — do not skip step P0.4.
- CORS needs to be open (or appropriately permissive) on this route specifically, since external tools calling it won't share your frontend's origin — don't accidentally restrict it to the same CORS policy as your internal frontend-only routes.

---

## 7. Timeline
Given the limited time before the Oct 5 deadline, this feature should be scoped to roughly a single focused build session. If P0 items 1–4 aren't working cleanly within that time, stop and ship without this feature rather than risk the core submission.

---

## 8. Definition of Done
A stranger with their own SerpApi key can run one `curl` command against the documented endpoint and get back a correct, structured JSON visibility result — and a stranger with no key can do the same against the sandbox fallback without hitting your live quota.

---

## Notes for the executing agent
Build P0 only, in order. Do not add authentication beyond the bring-your-own-key header check — no user accounts, no API key generation for this service. If SerpApi quota protection (P0.2) and the rate limiter (P0.4) are not both working, treat the feature as not done — these two items are what make the endpoint safe to make public at all.
