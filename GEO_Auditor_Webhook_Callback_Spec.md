# GEO Auditor — Webhook / Callback Support Spec

**Purpose of this document:** Execution spec for adding fire-and-forget callback support to the existing Public Visibility API. No code included — this defines what to build and in what order. This is an addition on top of `GEO_Auditor_Public_API_Spec.md` — it assumes that endpoint already exists and works.

---

## 1. Overview

**One-liner:** Let callers pass an optional `callback_url` when requesting a scan. Instead of (or in addition to) waiting for the direct response, the server POSTs the finished result to that URL once the scan completes — so an integrating bot or agent can fire the request and move on, rather than blocking or polling for completion.

**Why this matters:** Scans take a few seconds (SerpApi lookup + detection + gap analysis). A real agent/bot integration doesn't want to sit blocked waiting, or repeatedly re-check a status endpoint. A callback is the standard pattern for this (same idea as Stripe, GitHub, or Slack webhooks) and reuses logic that already exists — it adds one outgoing request at the point the scan already finishes.

---

## 2. Priorities (build order)

### P0 — Must ship
1. Accept an optional `callback_url` parameter on the existing visibility endpoint (query param or request body field — match whatever convention the rest of the endpoint already uses).
2. If `callback_url` is present: immediately acknowledge the request (e.g. respond with a simple "accepted, processing" status) instead of making the caller wait for the full result inline.
3. Run the scan exactly as it already runs today — no changes to detection or gap-analysis logic.
4. When the scan finishes, send one outgoing POST request to `callback_url` with the same JSON result shape the direct (non-callback) response already returns. Reuse the existing result object — do not build a second response format.
5. If `callback_url` is absent, behavior is unchanged from today: respond directly and synchronously as the existing endpoint already does.

### P1 — Should ship
6. Basic delivery safety: if the callback POST fails (caller's URL is down, times out, returns an error), retry once after a short delay, then give up silently — don't crash the scan process over a failed callback delivery.
7. Validate `callback_url` is a well-formed URL before accepting the request; reject obviously malformed values early with a clear error instead of failing later during delivery.
8. Log callback delivery attempts (URL, success/failure, timestamp) for your own debugging — never log the caller's SerpApi key alongside this.

### P2 — Nice to have (only if P0+P1 are solid with time to spare)
9. A small shared secret / signature header on the outgoing callback POST (e.g. an HMAC signature) so the receiving app can verify the callback genuinely came from GEO Auditor — mirrors how real webhook providers do it. Skip entirely if time is short; it's a trust-signal nicety, not a functional requirement.

---

## 3. Core Features
- **Optional callback_url parameter** on the existing endpoint (P0)
- **Immediate "accepted" response** when a callback is requested (P0)
- **Result delivery via outgoing POST** once the scan completes (P0)
- **Single retry on callback failure** (P1)
- **callback_url validation** (P1)
- **Signed callback payloads** (P2, optional)

---

## 4. Architecture (components, not code)
- No new analysis logic — this sits entirely at the request/response layer of the existing Public Visibility API route.
- One new step at the exact point the existing scan logic currently returns its result: check if a `callback_url` was provided; if so, send the result there via an outgoing HTTP POST instead of (or alongside) returning it inline.
- A minimal retry wrapper around that outgoing POST — one retry, then stop.

---

## 5. Non-Goals (explicitly out of scope)
- No persistent job queue or background worker system — the existing scan already runs server-side; this just changes where the result is delivered, not how the work itself is scheduled.
- No webhook management UI (listing past callbacks, re-sending, etc.) — this is a request-time option, not a standing subscription system.
- No signature verification requirement for callers — if P2's signing is built, it's for callers who want it, not mandatory.

---

## 6. Risks / Watch-outs
- Don't let a slow or failing `callback_url` block or crash the scan itself — the scan should complete and the result should be available either way; delivery failure is a separate concern from scan success.
- Validate the URL is a real HTTP(S) URL before attempting delivery, to avoid wasted retries on obviously malformed input.
- Never include the caller's SerpApi key in the callback payload or in delivery logs.

---

## 7. Definition of Done
A caller can submit a scan request with a `callback_url`, receive an immediate "accepted" response, and — once the scan finishes server-side — see the full visibility/gap-analysis result arrive as a POST at that URL, with no behavior change for callers who omit `callback_url` entirely.

---

## Notes for the executing agent
Build P0 only unless time clearly allows more. Do not introduce a job queue, database table for tracking callback status, or any new persistence layer — this should be a small addition to the existing request-handling flow, not new infrastructure. If P0 items 1–5 aren't cleanly working, stop and leave the endpoint exactly as it was before this spec — a working endpoint without callbacks is strictly better than a broken one with them.
