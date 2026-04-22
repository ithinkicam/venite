# Phase 1 Agent Execution Plan

**Companion to:** `/Users/cameronlewis/Dev/venite/.planning/PHASE-1-PLAN.md`
**Purpose:** Specify how PHASE-1-PLAN.md tasks are dispatched to **parallel worker agents** — not a single executor.

Venite's build discipline favors parallel multi-agent execution. This document answers:
1. Who (which agents) run which tasks?
2. How do they run in parallel without colliding on files or dependencies?
3. How does the orchestrator coordinate them, merge branches, and run gates?
4. What does each agent's self-contained brief look like?

---

## Roles

**Orchestrator** (the main session Claude, or a dedicated `gsd-executor` coordinator). Does *not* write production code. Its job is:
- Dispatch workers in parallel via the `Agent` tool (one message, multiple `Agent` tool calls).
- Monitor completion notifications.
- Merge worker branches into the wave branch.
- Run wave-level acceptance checks.
- Handle cross-package glue (e.g. `ldf` build → `npm link @venite/ldf` in `app`).
- Halt at Checkpoint Gates for user review.
- Escalate hazards.

**Worker agents** (Agent tool; typically `subagent_type: general-purpose`, or `gsd-executor` when that agent supports arbitrary task lists). Each worker:
- Receives a self-contained brief (see § Agent brief template) referencing one or more PHASE-1-PLAN.md task IDs.
- Works on its own git branch.
- Commits atomically per the plan's suggested commit messages.
- Reports back: task IDs completed, commit SHAs, acceptance-check output, any hazards encountered.

---

## Branch strategy

- **Base branch:** `claude/chant-phase-1` (current feature branch; already exists and tracks `origin/claude/chant-phase-1`).
- **Per-wave integration branch:** none. Workers push to per-agent branches and the orchestrator merges into `claude/chant-phase-1` at the end of each wave.
- **Per-agent branch naming:** `claude/chant-phase-1-W<wave>.<agent-id>` — e.g. `claude/chant-phase-1-W1.types`, `claude/chant-phase-1-W2.pointer`.
- **Merge style:** fast-forward if clean; `--no-ff` merge commits if multiple workers touched the same wave for traceability. Conflicts should be **rare** because worker tasks are scoped to disjoint files (the plan is deliberately written to enforce this).

---

## Commit discipline

- Workers commit **per task**, not per branch. A single worker that owns 3 tasks produces 3 commits (unless the plan flags an atomic pair).
- Commit message format: `<type>(<scope>): <taskID> — <short summary>` — e.g. `feat(ldf): W1.1 — add chant types (Pitch, ToneFile, ChantData, PsalmPointing)`. The plan's per-wave commit-message suggestions are the source of truth.
- **Atomic pairs** (currently only W1.5 + W1.6) must land in one commit, one worker.
- Workers pass the commit message via HEREDOC per the project's commit discipline.

---

## Gate protocols

The plan's three Checkpoint Gates are enforced by the orchestrator:

1. **Gate 0 — after W0.4.** Orchestrator posts: "Wave 0 complete. Orphan `/chant/` deleted; `components.d.ts` regenerated; `ldf/` and `components/` both build clean." Halts for user sign-off before launching Wave 1 workers.
2. **Gate 2 — after W2.4.** Orchestrator posts the two pointing-fixture JSONs (`commonprayer/src/chant/pointing/psalm-23.json` and `psalm-95.json`) inline in the chat so the user can eyeball the pointings. This is the hardest gate. Expect 1–2 rounds of adjustments via the `/chant-pointing` skill (delivered in Wave 4) before the user signs off.
3. **Gate 5 — after W5.4.** Orchestrator runs the UAT checklist in a dev build and posts screenshots or console output confirming Ps 23 renders with pointing/drop-cap/bolding toggles. Halts for final sign-off before Wave 6 documentation.

No Gate 6 — Wave 6 is housekeeping.

---

## Peak concurrency

| Wave | Workers | Peak concurrency | Critical path |
|---|---|---|---|
| W0 Cleanup | 1 | 1 | W0.1 → W0.2 → W0.3 → W0.4 (all sequential within the worker) |
| W1 Types + static data | 4 | **4** | wave1-types (W1.1 → W1.2 → W1.3 → W1.4 → W1.10) |
| W2 Generators + pointer | 3 | **3** | wave2-pointer (W2.2 iteration against fixtures) |
| W3 Components | 2 | **2** | wave3-component (W3.1 + W3.3) |
| W4 Skill | 1 | 1 | W4.1 |
| W5 Pray page wire-up | 2 | **2** | wave5-integrate (W5.1 + W5.3) |
| W6 Documentation | 1 | 1 | W6.1 → W6.2 |

**Peak across phase: 4 concurrent workers in Wave 1.** Orchestrator adds 1 session. Budget up to 5 concurrent Claude sessions at peak.

---

## Per-wave dispatch plan

### Wave 0 — serial (1 worker)

A single cleanup worker runs W0.1 → W0.4 in order. Each step depends on the prior.

| Agent id | Tasks | Branch | Depends on |
|---|---|---|---|
| `wave0-cleanup` | W0.1, W0.2, W0.3, W0.4 | `claude/chant-phase-1-W0.cleanup` | master/feature branch checkout |

**Orchestrator post-Wave-0:** merge branch, verify ldf + components build green, **Gate 0** halt.

---

### Wave 1 — 4 parallel workers

Launch all four in a **single message** with 4 `Agent` tool calls. Workers write to disjoint file sets.

| Agent id | Tasks | Files touched (no overlap with other Wave 1 agents) | Branch | Depends on |
|---|---|---|---|---|
| `wave1-types` | W1.1, W1.2, W1.3, W1.4, W1.10 | `ldf/src/chant/**`, `ldf/src/{psalm,refrain,text,responsive-prayer}.ts`, `ldf/src/index.ts`, `ldf/tests/chant*.test.ts`, `ldf/tests/format-tone-id.test.ts`, `ldf/tests/tone-library.test.ts` | `claude/chant-phase-1-W1.types` | W0.4 + wave1-tones (W1.7) landing before W1.10 runs |
| `wave1-settings` | W1.5 + W1.6 (atomic) | `ldf/src/display-settings.ts`, `app/src/app/preferences/preferences.service.ts` | `claude/chant-phase-1-W1.settings` | W0.4 + `@venite/ldf` rebuild post wave1-types |
| `wave1-tones` | W1.7 | `commonprayer/src/chant/tones/tone-{1..8,peregrinus}.json` | `claude/chant-phase-1-W1.tones` | W0.1 (orphan cherry-pick complete) |
| `wave1-script` | W1.8, W1.9 | `scripts/sync-chant-offline.ts`, `scripts/package.json`, `scripts/sync-chant-offline.test.ts`, `app/angular.json` | `claude/chant-phase-1-W1.script` | W1.7 (needs tone JSON to read) |

**Launch ordering nuance:** wave1-settings depends on wave1-types' W1.1 being *published* (rebuilt `@venite/ldf`) so the positional constructor matches. Two options:
- **Option A (preferred):** Launch wave1-types and wave1-tones first (parallel). Once types land + orchestrator runs `cd ldf && npm run build`, launch wave1-settings and wave1-script (parallel). This gives two sub-waves but still peaks at 2 concurrent workers within each.
- **Option B:** Launch all 4 in one shot; wave1-settings and wave1-script poll or sleep until `@venite/ldf` is rebuilt. Fragile — not recommended.

Orchestrator defaults to Option A.

**Orchestrator post-Wave-1:**
1. Merge wave1-types.
2. `cd ldf && npm run build`.
3. `cd app && npm link ../ldf` (or equivalent).
4. Merge wave1-settings (tests its positional constructor against the rebuilt types).
5. Merge wave1-tones.
6. Merge wave1-script.
7. Run `cd ldf && npm test` → all chant tests green.
8. Run `node scripts/sync-chant-offline.ts` → outputs `app/src/offline/chant/tones.json` with 9 tones.
9. Proceed to Wave 2 (no Gate here — Gate 2 is after W2.4).

---

### Wave 2 — 3 parallel workers

| Agent id | Tasks | Files touched | Branch | Depends on |
|---|---|---|---|---|
| `wave2-gabc` | W2.1 | `ldf/src/chant/generate-gabc.ts`, `ldf/tests/generate-gabc.test.ts` | `claude/chant-phase-1-W2.gabc` | W1.1 types published |
| `wave2-pointer` | W2.2 | `ldf/src/chant/vendor/psalmtone.js`, `ldf/src/chant/vendor/ATTRIBUTIONS.md`, `ldf/src/chant/point-psalm.ts`, `ldf/tests/point-psalm.test.ts` | `claude/chant-phase-1-W2.pointer` | W1.1 + wave2-fixtures' golden data |
| `wave2-fixtures` | W2.3 | `commonprayer/src/chant/pointing/psalm-23.json`, `psalm-95.json`, `psalms-bcp1979.json` | `claude/chant-phase-1-W2.fixtures` | W1.1 types |

**Coordination note — fixture-vs-pointer ordering:** wave2-fixtures must finish first because its hand-pointed output is the test golden that wave2-pointer compares against. Orchestrator should dispatch wave2-fixtures and wave2-gabc together, wait for fixtures, then dispatch wave2-pointer with fixtures available for tests. Alternative: wave2-pointer works iteratively, first emitting a naive pointer whose tests fail until the fixtures land and guide correction.

**Copyright reminder for wave2-fixtures:** the worker must not transcribe from St Dunstan's printed pointings. Use jgabc algorithmic output, correct by ear using St Dunstan's *structural* conventions (caesura marking, flex usage), emit our own editorial choices.

**Orchestrator post-Wave-2:**
1. Merge wave2-fixtures.
2. Merge wave2-gabc.
3. Merge wave2-pointer (tests now compare to the golden).
4. Run `node scripts/sync-chant-offline.ts` (that's W2.4).
5. Run `cd ldf && npm test` → all pointer + generator + library tests green.
6. **Gate 2 halt.** Post fixture JSONs for user eyeball.

---

### Wave 3 — 2 parallel workers

| Agent id | Tasks | Files touched | Branch | Depends on |
|---|---|---|---|---|
| `wave3-component` | W3.1, W3.3 | `components/src/components/chant-pointing/**` | `claude/chant-phase-1-W3.component` | W1.1–W1.4 complete |
| `wave3-css` | W3.2 | `components/src/components/psalm/psalm.scss` | `claude/chant-phase-1-W3.css` | none |

**Orchestrator post-Wave-3:**
1. Merge both branches.
2. `cd components && npm run build` — Stencil regenerates `components.d.ts` with `LdfChantPointing` (not `LdfChantNotation` — Phase 2).
3. `cd components && npm test` green.
4. Proceed to Wave 4.

---

### Wave 4 — 1 worker

| Agent id | Tasks | Files touched | Branch | Depends on |
|---|---|---|---|---|
| `wave4-skill` | W4.1 | `~/.claude/skills/chant-pointing/chant-pointing/SKILL.md` (or project-local alternative) | `claude/chant-phase-1-W4.skill` | W2.3 fixtures exist |

Can run in parallel with Wave 3 in principle (no file overlap). Orchestrator's choice: either pipeline them or serialize for simpler tracking. **Default: launch wave4-skill immediately after Wave 3 workers are dispatched** so it runs in the background while components build.

---

### Wave 5 — 2 parallel workers

| Agent id | Tasks | Files touched | Branch | Depends on |
|---|---|---|---|---|
| `wave5-integrate` | W5.1, W5.3 | `components/src/components/psalm/psalm.tsx`, `components/src/components/psalm/psalm.e2e.ts`, `app/src/app/pray/pray.page.chant.spec.ts` | `claude/chant-phase-1-W5.integrate` | Wave 3 done |
| `wave5-settings-ui` | W5.2 | `app/src/app/pray/display-settings/display-settings-config.ts`, `app/src/app/pray/display-settings/display-settings.component.html` | `claude/chant-phase-1-W5.settings-ui` | Wave 1 settings landed |

W5.4 manual UAT is the **user**, not an agent. Orchestrator drives the app and halts at Gate 5.

**Orchestrator post-Wave-5:**
1. Merge both.
2. `cd components && npm run build`; `cd app && ng build`.
3. Run Karma spec.
4. Start dev server.
5. Post UAT checklist to user.
6. **Gate 5 halt.**

---

### Wave 6 — 1 worker

| Agent id | Tasks | Files touched | Branch | Depends on |
|---|---|---|---|---|
| `wave6-docs` | W6.1, W6.2 | `resources/CHANT_DESIGN.md`, `.planning/PHASE-1-SUMMARY.md` | `claude/chant-phase-1-W6.docs` | Gate 5 passed |

---

## Self-contained agent brief template

Every worker is launched via the `Agent` tool with a brief of this shape. Adapt the fields.

```
You are a worker agent for Phase 1 of the Venite chant feature.

READ FIRST (in order):
1. /Users/cameronlewis/Dev/venite/.planning/PHASE-1-AGENT-EXECUTION.md — know your role
2. /Users/cameronlewis/Dev/venite/.planning/PHASE-1-PLAN.md — search for your task IDs
3. /Users/cameronlewis/Dev/venite/resources/CHANT_DESIGN.md — design intent
4. Any research docs the plan's task entries reference (in .planning/research/)

YOUR ASSIGNMENT
- Wave: W<n>
- Agent id: <id, e.g. wave1-types>
- Task IDs: <comma-separated list>
- Branch: claude/chant-phase-1-W<n>.<id> (cut from claude/chant-phase-1)
- Depends on: <prior workers merged / W<n-1> complete>

WHAT TO DO
- Execute your task IDs only. Do NOT edit files outside the plan's "Files touched" lists for those IDs.
- Commit per task using the exact commit message suggested in the plan, prefixed with the task ID.
- Atomic pair handling: if your task list contains a plan-flagged atomic pair (e.g., W1.5+W1.6), those commits must land as ONE commit.
- After every commit, run the task's Acceptance check. If it fails, fix before proceeding.
- When your task list is done, push your branch.

COPYRIGHT GUARDRAIL
- Do not copy text, typography, pointing, or translations from copyrighted sources: St Dunstan's Plainsong Psalter (Andrewes Press 2002), Litton's Plainsong Psalter (1988), Anglican Chant Psalter (1987), Winfred Douglas's English adaptations.
- Ancient Sarum melodic formulas and Latin chant texts are public domain — those are fine to include.
- Our editorial pointings are our own output, not reproductions.

BOUNDARY CONDITIONS
- If you hit a hazard not in the plan's Risks table, STOP. Report to orchestrator. Do not work around it.
- If `npm install` / `npm run build` fails for reasons unrelated to your work, STOP. Report.
- If a file you need to edit has changed since the plan was written (different line numbers, different constructor shape), STOP. Report.
- Do NOT merge your branch. Orchestrator merges.

REPORT BACK
When done, respond with a single structured message:
- task_ids_completed: [...]
- commit_shas: [...]
- branch: claude/chant-phase-1-W<n>.<id>
- acceptance_check_output: (stdout of the commands listed under each task's Acceptance section)
- hazards_hit: [...] (or "none")
- open_questions_surfaced: [...] (or "none")
- time_taken: (optional)
```

---

## Orchestrator runbook

### Pre-flight
1. Confirm user has approved PHASE-1-PLAN.md + this doc + resolved Open Questions.
2. `git checkout claude/chant-phase-1 && git pull`.
3. Verify local working tree is clean.

### Per-wave loop
```
for wave in 0..6:
    # Dispatch workers
    launch worker(s) per § Per-wave dispatch plan (single message, multiple Agent tool calls)

    # Wait (background-mode agents signal via notifications)
    await all worker completions

    # Merge
    for worker in workers (ordered per plan):
        git checkout claude/chant-phase-1
        git merge --no-ff claude/chant-phase-1-W<n>.<id>

    # Wave-level acceptance
    run wave's acceptance commands (see § Per-wave dispatch plan)

    # Gate
    if wave in {0, 2, 5}:
        post wave summary to user
        halt until user confirms
```

### Error handling
- **Worker reports hazard:** orchestrator reads the hazard, decides between (a) re-dispatching with updated brief, (b) redirecting via a small orchestrator-authored fix commit, or (c) escalating to user with a short question.
- **Merge conflict (rare):** orchestrator resolves locally (files should be disjoint; any conflict signals plan divergence or worker scope creep — investigate).
- **Wave acceptance fails:** bisect worker-by-worker. Un-merge the last worker, re-run acceptance, iterate.

### Resource governance
- Peak 4 concurrent workers + 1 orchestrator = 5 sessions. Parallelism is a ceiling, not a floor — orchestrator may serialize (e.g. launch wave1-types alone, then the rest) if capacity constrained.
- Use `run_in_background: true` on Agent tool calls so the orchestrator can dispatch, do its own merges, and receive completion notifications.

---

## Concurrency → wall-clock estimate

Plan estimates 8–13 working days single-agent. Parallelism compresses critical paths; wave durations below assume 4-worker peak and no bottleneck on user gate turnaround.

| Wave | Single-agent days | Parallel wall-clock days | Parallel saves |
|---|---|---|---|
| W0 | 0.5 | 0.5 | — (serial by nature) |
| W1 | 2–3 | **1–1.5** | max(wave1-types, wave1-settings, wave1-tones, wave1-script) |
| W2 | 3–5 | **2–3** | wave2-pointer is critical path; wave2-gabc + wave2-fixtures fit inside |
| W3 | 1–2 | **0.5–1** | 2-way split |
| W4 | 0.5 | 0.5 (parallel with W3) | absorbed into W3 time |
| W5 | 1–2 | **0.5–1** | 2-way split |
| W6 | 0.5 | 0.5 | serial |
| **Total** | **8–13** | **≈ 5–7** | — |

User gate turnaround (Gate 0, Gate 2, Gate 5) adds real wall-clock time. If user responds same-day to gates, expect the low end; if gates sit overnight, add a day per gate.

---

## Open flex points (orchestrator judgment calls)

- **Worker subagent_type choice.** Default to `general-purpose`. Use `gsd-executor` if the worker's task list cleanly matches the GSD executor's task format (most tasks in this plan do). `gsd-executor` gives atomic-commit + state-tracking discipline for free.
- **Launch-in-background vs foreground.** Background-mode (`run_in_background: true`) is strongly preferred for parallelism — orchestrator receives notifications rather than blocking.
- **Branch cleanup.** After a wave merges cleanly, orchestrator may delete the per-agent branches to keep `git branch -a` readable. Optional; keep them if audit trail matters.
- **Mid-wave re-dispatch.** If a worker fails halfway and the orchestrator wants to re-launch with a tighter scope, the re-launched worker gets a new agent-id (`wave1-types-v2`) and a new branch. Never reuse an agent-id after a failure.

---

**End of agent execution plan.** Before dispatching Wave 0, orchestrator should confirm that (a) user has signed off on this doc's branch strategy, (b) user has resolved all nine Open Questions in PHASE-1-PLAN.md, (c) the current `claude/chant-phase-1` HEAD is a clean starting point.
