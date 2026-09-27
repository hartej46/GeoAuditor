# GEO Auditor — Submission Checklist

> **Deadline:** Oct 5, 2026, 23:59 IST
> Source: [Hackathon Spec Section 8](GEO_Auditor_Hackathon_Spec%20(1).md)

---

## Submission Requirements

### Repo & Documentation
- [x] Public GitHub repo: `github.com/hartej46/GeoAuditor`
- [x] README with setup/usage instructions
- [x] README explicitly names SerpApi products: AI Overview API, AI Mode API, Organic Search API
- [x] README explains WHY each SerpApi endpoint matters (not vague)
- [ ] Final README review — update features section after P1 is implemented

### Demo Video
- [ ] Screen recording under 3 minutes
- [ ] Shows project running locally
- [ ] Core functionality visible (scan, comparison, gap analysis, recommendations)
- [ ] Upload to YouTube (unlisted) or Google Drive
- [ ] **Test link in incognito window** — no access request required
- [ ] Script prepared: `DEMO_VIDEO_SCRIPT.md`

### Submission Form
- [ ] Lead participant: name, email, mobile, occupation, years of experience
- [ ] Team member names/emails (if any, max 4 additional)
- [ ] Track selected: **Commerce & Market Intelligence**
- [ ] Confirmed project did not exist before hackathon
- [ ] AI tools disclosed (Gemini, Claude via Antigravity IDE)
- [ ] Rules and Terms accepted

### Security Sweep (CRITICAL — do before making repo public)
- [ ] No API keys in any file
- [ ] No credentials in git history: `git log --all -p | grep -i "serpapi_key\|api_key\|password\|secret"` returns nothing
- [ ] `.env` is in `.gitignore` ✅ (already done)
- [ ] `.env.example` has placeholder values only ✅ (already done)
- [ ] No hardcoded tokens in frontend code
- [ ] No sensitive data in `demo/sample-response.json`

---

## Feature Completion Status

| Feature | Status | Notes |
|---------|--------|-------|
| P0 #1–6 | ✅ Complete | All core features working |
| P1 #7 Gap Analysis | 🔄 In progress | Gemini executing P1_IMPLEMENTATION_PLAN.md |
| P1 #8 Recommendations | 🔄 In progress | Gemini executing P1_IMPLEMENTATION_PLAN.md |
| P1 #9 Multi-Query Score | 📋 Planned | Plan ready: P1_9_MULTI_QUERY_PLAN.md |
| P1 #10 Trend View | ⏸️ Stretch | Only if #7–9 solid with time to spare |
| P2 #11–13 | ⏸️ Not started | Only after all P1 done |
| README | ✅ Written | Needs final update after P1 |
| Demo Script | ✅ Written | DEMO_VIDEO_SCRIPT.md |

---

## Timeline to Deadline

| Date | Target |
|------|--------|
| Sep 27 | P1 #7+#8 implementation (Gemini); README + plans (done) |
| Sep 28-29 | P1 #9 implementation; verify P1 #7+#8 |
| Sep 30-Oct 1 | Polish UI, fix bugs, P1 #10 if time |
| Oct 2-3 | Record demo video, finalize README |
| Oct 4 | Security sweep, fill submission form |
| **Oct 5** | **Final submission (23:59 IST)** |
