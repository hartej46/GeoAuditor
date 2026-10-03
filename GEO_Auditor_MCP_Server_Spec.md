# GEO Auditor — MCP Server Wrapper Spec

**Purpose of this document:** Execution spec for exposing the existing Public Visibility API as an MCP (Model Context Protocol) server, so AI agents — Claude, Claude Code, or any other MCP-compatible agent — can call it as a native tool rather than hitting a raw URL. No code included. This assumes `GEO_Auditor_Public_API_Spec.md` is already built and working — this wraps it, it doesn't replace it.

---

## 1. Overview

**One-liner:** A thin MCP server that exposes one tool, `check_brand_visibility`, which internally calls the already-built REST endpoint and returns the same result — giving any AI agent a native, discoverable tool instead of a URL it has to be told how to call.

**Why this matters for the hackathon:** this is the sharpest demo beat available for the AI Agents track — "any AI agent can call this directly as a tool, not just hit an endpoint." It requires no new business logic, only a translation layer in front of code that already works.

---

## 2. Priorities (build order)

### P0 — Must ship
1. Install the official MCP TypeScript SDK and set up a minimal `McpServer` instance with a name and version.
2. Register one tool, `check_brand_visibility`, with a clear description and a typed parameter schema (brand name, up to 3 competitors, target query/topic) — the description is what an AI agent reads to decide when to use the tool, so it should be specific and plain-language.
3. Inside the tool's handler: call the existing `/api/v1/visibility` endpoint internally (same logic already built, no duplication) and return its JSON result as the tool's output.
4. Use HTTP-based transport (Streamable HTTP), not stdio — this server needs to be reachable remotely as part of the public deployment, not run as a local-only process.
5. Verify the tool works end-to-end using MCP Inspector (the official testing tool) before considering this done — confirm the tool is discoverable and returns a correct result for a real query.

### P1 — Should ship
6. A short README section documenting the MCP server: how to connect to it, the tool name, and its parameters — mirrors the documentation approach already used for the REST API.
7. Basic error handling in the tool handler: if the underlying REST call fails, return a clear error message through the MCP response rather than letting the handler crash.

### P2 — Nice to have (only if P0+P1 are solid with time to spare)
8. A second tool, e.g. `run_gap_analysis` or `multi_query_visibility_score`, exposing additional existing endpoints the same way — only once the first tool is fully verified working.

---

## 3. Core Features
- **MCP server instance** with HTTP transport (P0)
- **`check_brand_visibility` tool** wrapping the existing REST endpoint (P0)
- **MCP Inspector verification** before calling this done (P0)
- **Documentation section** for how to connect (P1)
- **Graceful error handling** in the tool handler (P1)

---

## 4. Architecture (components, not code)
- A new, separate entry point (e.g. an `mcp-server` file/folder) — this should not be merged into the existing Express app's route handlers, but it can live in the same repo and project.
- The MCP tool handler calls the existing REST endpoint the same way any external client would — treat your own API as the dependency, don't bypass it by reaching into internal functions directly. This keeps the MCP layer genuinely thin and keeps both interfaces (REST and MCP) guaranteed consistent.

---

## 5. Non-Goals (explicitly out of scope)
- No new analysis logic — if it's not already exposed via the REST API, it doesn't belong in the MCP tool either.
- No support for multiple simultaneous tools beyond the P2 stretch — one well-documented, well-tested tool beats three untested ones.
- No custom authentication scheme for the MCP server itself beyond whatever the underlying REST API already requires (e.g. the bring-your-own-SerpApi-key model, if applicable).

---

## 6. Risks / Watch-outs
- Don't duplicate the REST endpoint's logic inside the MCP handler — if they drift out of sync, you now have two sources of truth for the same feature. The MCP tool should be a thin pass-through.
- Test with MCP Inspector before assuming this works — a tool that looks correct in code but was never actually verified end-to-end is a real risk this close to a demo.
- If time is short, skip this entirely rather than ship an unverified MCP server — an untested integration point is worse to demo than not mentioning MCP at all.

---

## 7. Definition of Done
An AI agent (verified via MCP Inspector, or a real client if time allows) can discover the `check_brand_visibility` tool, call it with a brand/competitors/query, and receive back the same correct result the REST endpoint already returns.

---

## Notes for the executing agent
Build P0 only, in order. This is a wrapper, not a new feature — if you find yourself writing new detection or analysis logic to support this, stop; that logic should already exist in the REST API this wraps. If MCP Inspector verification (P0.5) doesn't succeed, the feature is not done, regardless of whether the code looks correct.
