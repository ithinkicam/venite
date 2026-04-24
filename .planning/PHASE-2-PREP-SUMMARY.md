# Phase 2 Prep Summary — entry conditions + stress-aware pointing

**Branch:** `claude/chant-phase-2-prep` · **Final commit:** `c767f2f8` · **Status:** merged to master for convenience; gaps noted below for later revision.

One-paragraph frame: Phase 2 prep landed the three listed entry conditions — Exsurge SHA-pinned, Tone.js installed, pointing fixtures expanded from 2 to 20 — plus an unplanned stress-aware accent-syllable improvement when the "every DRAFT psalm has accents on the wrong syllable" finding surfaced during UAT. The syllable layer is now solid; the word-selection layer and the tone-pipeline layer are not.

## Shipped

- **Exsurge pinned** — `bbloomf/exsurge@23e6cccf4bd3c211a1ec6202cd36e95585f14c58` (v1.21.1), installed in `app/` as a git-url dependency. Bus-factor-1 mitigation (vendoring under `app/vendor/exsurge/`) is deferred until Exsurge is actually consumed at runtime.
- **Tone.js** — `tone@14.9.17` installed in `app/` as a peer of future `<ldf-chant-player>`. No imports yet.
- **20 pointing fixtures** — existing hand-pointed Ps 23 + Ps 95, plus 18 DRAFT fixtures generated algorithmically by `scripts/batch-point-psalms.js` for: 1, 4, 8, 19, 24, 27, 42, 51, 63, 67, 84, 91, 100, 103, 121, 130, 134, 139 (BCP 1979 Daily Office staples). DRAFTs carry `_meta.status: "DRAFT — algorithmic first pass"`.
- **Stress-aware syllable hints** — `VersePointing` schema gained `mediantStressSyllable?: number` and `finalStressSyllable?: number` (optional, syllable-from-start indices). Build-time pointer uses `cmu-pronouncing-dictionary@2.0.0` (as ldf devDep) to populate them. Runtime `<ldf-chant-pointing>` uses: (1) hint if present → (2) rule-based English-suffix detector (-ness, -tion, -ed, -ing, -ly, …) → (3) last-vowel-cluster fallback.
- **Batch-point generator** — `scripts/batch-point-psalms.js` is re-runnable; merges new hints into existing fixtures without clobbering hand-edited structural fields (verified against Ps 23 + Ps 95).
- **Tests** — 205 ldf tests still pass (5 pre-existing baseline failures unchanged); 3 new e2e tests for stress-hint flow in the chant-pointing component. CMU lookup hit rate: **96% on the 18 DRAFTs, 100% on Ps 23 + Ps 95**.
- **Default psalm** on `/psalter` is `23` (carried over from Phase 1 UAT wrap-up).

## Gaps — carry forward

These are the known weaknesses. Listed roughly by payoff-per-effort:

1. **No tone→pitch pipeline validation.** `generate-gabc.ts` exists but nothing consumes it at runtime. No `<ldf-chant-notation>` component wrapping Exsurge yet. **Consequence:** we cannot see/hear whether the stress hints we just generated actually land on the right pitches for any given tone. The syllable hints are lexical stress (CMU), not liturgical stress tuned to a specific tone's mediation/termination pattern. **Fix:** build `<ldf-chant-notation>` first (Exsurge wrapper), run all 20 pointings through Tone 1 (or another workhorse), then revisit.
2. **Word-selection heuristic has blind spots.** `point-psalm.ts` picks accent WORDS via "last word unless clitic." Observed misses on Ps 51 include `from`, `to`, and a handful of archaic function words. The `CLITIC_WORDS` set is drawn from Ps 23 + Ps 95; it needs expansion as more DRAFT fixtures surface edge cases. **Fix:** extend `CLITIC_WORDS` incrementally as fixtures are editorially reviewed.
3. **Lexical ≠ liturgical stress in edge cases.** CMU gives standard-English stress. Anglican chant sometimes places emphasis differently for pastoral reading or archaic forms. Example: "iniquities" in Ps 51 — CMU says stress on "iq" (correct for speech), but the rule-based fallback short-circuited to first-syllable in our output. `mediantStressSyllable` / `finalStressSyllable` are HINTS — future editorial pass can override.
4. **`preparatorySyllables?: number[]` is schema-only, unused.** Multi-accent mediations (tones with a 2-accent cadence) need this. No pointer logic populates it yet. Waiting on the tone pipeline.
5. **Peregrinus psalm pairing** — Peregrinus tone (for Ps 114/115) is in the library but no psalm in the 20-fixture set is paired with it via `PsalmToneAssignment`. Will matter once the compile-service user-preference cascade goes in (Phase 4).
6. **DRAFT fixtures not editorially reviewed.** Word-level pointing on the 18 DRAFTs is algorithmic. They render sensibly now (stress hints help) but a musician's ear will catch structural issues — wrong flex placement, missed dactylic endings, etc. The `/chant-pointing` skill exists for this review workflow.
7. **Exsurge vendoring (bus-factor-1 mitigation) deferred.** Pin is by SHA but the source is a single GitHub fork. If `bbloomf/exsurge` goes away, the dep breaks. Vendor under `app/vendor/exsurge/` during Phase 2 proper.
8. **No runtime rendering of notation.** Chant notation today is the CSS overlay only. `chantNotation: 'always'` / `'collapsed'` / `'tablet-only'` modes all currently render the same visual (the overlay). The distinction will only matter once `<ldf-chant-notation>` lands.
9. **Stencil e2e for stress-hint flow** written but not runnable — the repo's `@stencil/core@2.17.4` requires `jest@27` while the repo pins `jest@24.9.0`. Build is clean; tests compile but don't execute. Pre-existing issue.

## Phase 2 (proper) entry conditions — updated status

- ✅ **Exsurge fork pinned** (done)
- ✅ **Tone.js installed** (done, uninstantiated)
- ✅ **`chantNotation` picker** (shipped in Phase 1, ahead of schedule)
- ✅ **Expand to 20 psalms** (done; 18 DRAFT, 2 golden)
- ⬜ **`<ldf-chant-notation>` component** (Exsurge-backed, not started)
- ⬜ **`<ldf-chant-player>` component** (Tone.js-backed, not started)
- ⬜ **Full Sarum tone library** (still 9 tones)

## UAT receipts

- **Branch:** `claude/chant-phase-2-prep` → merged to master
- **Artifacts:** `UAT-phase2-prep-psalm51-draft.png` (before), `UAT-stress-aware-ps23.png` (after, hand-pointed), `UAT-stress-aware-ps51.png` (after, DRAFT) at repo root.
- **CMU hit rate:** 409/426 on 18 DRAFTs (96%), 34/34 on golden (100%).
- **Tests:** 205/210 ldf pass (baseline unchanged); stencil build clean.

## Pointers

- Phase 1 summary: `.planning/PHASE-1-SUMMARY.md`
- Phase 1 plan: `.planning/PHASE-1-PLAN.md`
- UAT session state: `.planning/CHANT-UAT-STATE.md`
- Stress lookup: `ldf/src/chant/stress-lookup.ts`
- Batch generator: `scripts/batch-point-psalms.js`
- Pointing shape: `ldf/src/chant/pointing.ts`
- Editorial review workflow: `.planning/skills/chant-pointing.md`
