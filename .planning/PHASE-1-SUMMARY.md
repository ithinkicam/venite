# Phase 1 Summary — Chant integration

**Branch:** `claude/chant-phase-1` · **Final commit:** `23c9b73a` · **Commits on branch:** 43 · **Status:** Gate 5 passed; Wave 6 documentation landing.

One-paragraph frame: Phase 1 built the LDF schema, the smoke-test tone library, the golden-fixture pointing for two psalms, the CSS-overlay pointing component, and the DisplaySettings plumbing needed to make any of it visible. **No live GABC rendering; no audio.** Those are Phase 2.

## Shipped

- **LDF types** (`ldf/src/chant/`): `pitch`, `neume-group`, `mediation`, `differentia`, `tone-variant`, `tone-file`, `chant-data`, `pointing`, `psalm-tone-assignment`, `format-tone-id`, `generate-gabc`, `point-psalm`. Metadata widened on `Psalm` / `Refrain` / `Text` / `ResponsivePrayer`.
- **Tone library** — 9 JSON files in `commonprayer/src/chant/tones/`: `tone-1.json`…`tone-8.json` + `tone-peregrinus.json`. Public-domain Sarum formulas; structural invariants enforced by `ldf/tests/tone-library.test.ts`.
- **Golden-fixture pointing** — hand-pointed Ps 23 + Ps 95 in `commonprayer/src/chant/pointing/{psalm-23,psalm-95,psalms-bcp1979}.json`. Own editorial pointings; not copied from St Dunstan's.
- **Pointer** — `point-psalm.ts` wrapping vendored `bbloomf/jgabc/psalmtone.js` (Unlicense). Attributions in `ldf/src/chant/vendor/ATTRIBUTIONS.md`.
- **Stencil component** — `<ldf-chant-pointing>` at `components/src/components/chant-pointing/` (`.tsx` + `.scss` + `.e2e.ts`). Rendered inline by `<ldf-psalm>` when `metadata.pointing` is present.
- **Psalm CSS** — decorated drop-cap on verse 1 when `DisplaySettings.dropcaps === 'decorated'`.
- **DisplaySettings** — three new fields: `chantNotation` (`'off' | 'collapsed' | 'always' | 'tablet-only'`), `chantTradition`, `psalmsBold`.
- **DisplaySettings modal** — pickers for `chantNotation` + `psalmsBold`; shared `DisplaySettingsModule` so `/psalter` and `/pray` use the same modal.
- **Wire-through** — `displaySettings` threaded through `<ldf-liturgical-document>` → `<ldf-psalm>` on `/pray`, `/psalter`, `/daily-readings`. Render-time pointing-table fetch from `/offline/chant/pointing/psalms-bcp1979.json`.
- **Offline sync script** — `scripts/sync-chant-offline.js` aggregates tones into `app/src/offline/chant/tones.json` (9 tones). Wired into `app/angular.json` assets.
- **Psalter default** — default psalm changed from 1 → 23 so the golden fixture is the landing view.
- **`/chant-pointing` skill** — `.planning/skills/chant-pointing.md` for iterative pointing correction.
- **Tests** — 205 ldf tests green (5 pre-existing baseline failures documented in `.planning/BASELINE-KNOWN-ISSUES.md`); Stencil e2e + Karma smoke spec for pray page.

## Known gaps (intentional; deferred to Phase 2+)

- **No live GABC rendering.** Exsurge is not installed yet; `<ldf-chant-notation>` does not exist. Only the CSS-overlay pointing renders today.
- **No audio.** Tone.js not installed; `ToneVariant.recordings?` slot is empty; no `<ldf-chant-player>`.
- **Only 9 tones.** Smoke-test subset (8 Sarum + Peregrinus); full Sarum table deferred to Phase 2.
- **Only 2 psalms with pointing.** Ps 23 and Ps 95. Expanding to 20 is a Phase 2 entry condition.
- **No antiphon-mode → tone resolution** in the compile service. The user-preference cascade (`PsalmToneAssignment.source`) is schema-only; no runtime resolver yet. Phase 4.
- **UAT pipeline health.** Three bugs surfaced in the end-of-Phase-1 UAT session and were fixed, evidence the wire-through is exercising real code paths end-to-end:
  1. `/psalter` gear icon was missing the new pickers (two `DisplaySettingsComponent`s in the repo). Fixed by extracting `DisplaySettingsModule` and sharing it between `/pray` and `/psalter` (commits `f55b95df`, `8aa92e63`).
  2. `DisplaySettings` positional constructor mismatch after adding three new fields. Fixed by aligning positional args with constructor order (commits `3121480b`, `e2c25592`).
  3. `/psalter` defaulted to Ps 1 (no pointing data), so Phase 1 was invisible on first load. Changed default to Ps 23 (commit `23c9b73a`).

## Phase 2 entry conditions

- **Exsurge fork pinned.** `bbloomf/exsurge` SHA pinned in `app/package.json` (or vendored to `app/vendor/exsurge/` if bus-factor-1 risk materializes).
- **Tone.js installed** for dynamic tone synthesis from `ToneVariant.intonation` / `recitingTone` / `mediation` / `differentiae` pitch data.
- **`chantNotation` picker surfaced in UI** — **done ahead of schedule** in Phase 1 (commit `950bb59f`, merged `a6c8dbb4`). Phase 2 only needs to make the picker actually change rendering behavior.
- **Expand to 20 psalms** with pointing fixtures. Use the `/chant-pointing` skill + `point-psalm.ts` algorithmic first pass.
- **`<ldf-chant-notation>` component** — new Stencil component wrapping Exsurge; lazy-loaded.
- **`<ldf-chant-player>` component** — new Stencil component wrapping Tone.js; lazy-loaded; coexists with TTS via `MediaSessionService`.
- **Full Sarum tone library** — expand the 9-tone smoke set to the complete Sarum Table.

## UAT receipts

- **Branch:** `claude/chant-phase-1`
- **Final commit SHA:** `23c9b73a` (`chore(app): change /psalter default psalm from 1 to 23`)
- **Three UAT-session bug fixes:** `8aa92e63` (shared DisplaySettingsModule), `e2c25592` (DisplaySettings positional-mismatch fix), `23c9b73a` (default-psalm change). An earlier `@venite/ng-pray` lib port (`b87cd580`) was reverted in `958f6bc0` in favor of the shared-module approach.
- **UAT state snapshot:** `.planning/CHANT-UAT-STATE.md` records the local dev-server recipe (Node 22 + `--openssl-legacy-provider`, manual `@venite/ldf`/`@venite/components` copies into `app/node_modules`, `skipLibCheck: true` workaround).
- **Artifacts:** `.playwright-mcp/` contains console + page snapshots from the 2026-04-23 UAT session (Puppeteer/Playwright MCP verification that `<ldf-psalm>` receives `displaySettings` and that `/offline/chant/pointing/psalms-bcp1979.json` is fetched at render time).
- **Baseline test health:** 205/210 ldf tests pass; 5 pre-existing baseline failures documented in `.planning/BASELINE-KNOWN-ISSUES.md` (unrelated to chant).

## Pointers

- Design: `resources/CHANT_DESIGN.md` (amended in Wave 6 with Phase 1 deltas).
- Plan: `.planning/PHASE-1-PLAN.md` (§Wave 6 §521 defines this doc's scope).
- Agent dispatch: `.planning/PHASE-1-AGENT-EXECUTION.md`.
- UAT session state: `.planning/CHANT-UAT-STATE.md`.
- Tone shape: `ldf/src/chant/tone-file.ts` + siblings.
- Pointing shape: `ldf/src/chant/pointing.ts`.
