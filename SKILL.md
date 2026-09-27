---
name: engineering-discipline
description: Enforces a disciplined, senior-engineer workflow when building software with AI assistance — scoped context, plan-before-code, thin vertical slices, mandatory diff review, checkpoint commits, stage-gated development, and a pre-ship secrets/scope sweep. Use this whenever the user asks to build, implement, or code a project, feature, or MVP with AI help — especially multi-step, spec-driven, or hackathon builds. Do not use for one-off throwaway scripts or trivial single-file edits.
---

# Engineering Discipline

Apply this workflow whenever building something beyond a trivial script. The goal: ship code the user can fully explain and defend, not code that merely ran once.

## Before writing any code

1. Confirm a repo skeleton exists: git initialized, `.gitignore` present and excluding `.env`/secrets, folder structure matching the intended architecture. If missing, set these up first — before any feature code.
2. Confirm the current scope. Work only on the task/tier explicitly given. If the user hasn't scoped it, ask which piece to build first rather than attempting everything in the spec at once.

## Before writing code for a given task

3. Propose a short plan — file structure and data flow — and get explicit confirmation before writing implementation code. Never skip straight to code on a non-trivial task.

## While building

4. Build the riskiest end-to-end path first (the one integration or unknown most likely to fail), even in rough form, before polishing anything. Prove it works before investing further.
5. Present each diff with a brief explanation of what changed and why. Don't silently make design decisions the user hasn't seen — flag anything non-obvious.
6. Suggest a commit at each working checkpoint, with a clear, specific message (not "fix" or "update").

## Between stages

7. Do not begin the next feature/priority tier until the user has confirmed — themselves, not just on the agent's say-so — that the current one actually works. If asked to proceed anyway, note explicitly that the prior stage wasn't user-verified.
8. Stay inside stated non-goals. Do not add authentication, extra abstractions, dependencies, or "helpful" polish that wasn't requested. If something seems missing, ask rather than adding it unprompted.

## Before shipping / making anything public

9. Search the full repo and git history for credentials, keys, or secrets before any public push or submission. Flag anything found immediately — do not proceed until resolved.
10. Diff the final result against the original scope/spec and flag anything built that wasn't asked for.

## When to relax this

Skip steps 3, 6, and 9 for genuine throwaway experiments or single-file scripts with no lasting purpose. Apply the full workflow for anything that will be reviewed, demoed, submitted, or maintained.
