# Chant Phase 1 — Research Index

Map of inputs that informed `PHASE-1-PLAN.md`. All paths absolute.

**Primary plan artifacts:**
- `/Users/cameronlewis/Dev/venite/.planning/PHASE-1-PLAN.md` — the *what*: waves, task breakdown, design deltas, open questions, risks.
- `/Users/cameronlewis/Dev/venite/.planning/PHASE-1-AGENT-EXECUTION.md` — the *how*: parallel orchestrator + worker dispatch, per-wave agent manifest, branch strategy, self-contained brief template.

## Starting point (design intent)

- **`/Users/cameronlewis/Dev/venite/resources/CHANT_DESIGN.md`** — the original design: GABC-only, Exsurge renderer, dynamic WebAudio synth, `ldf/src/chant/*` types, phased rollout. 22 design decisions. Starting point for the plan; several decisions are amended below.

## Research dossiers

- **`/Users/cameronlewis/Dev/venite/.planning/research/chant-pdfs.md`** — Deep extraction from St Dunstan's Table of Sarum Tones (pp. 499–508), Plainsong Psalter (Litton), collects, lessons, Marian antiphons, Compline. Informs: tone-library schema (Peregrinus has two reciting notes; named endings Gloucester/York/Gisburn; abrupt mediations; solemn vs ferial vs Gospel-canticle intonations), pointing conventions (St Dunstan dots + ⁻/ˇ marks; Litton acute + diagonal bar), Marian-antiphon language question (St Dunstan ships English, not Latin), and Phase-2+ transcription burden (~99 tone entries for full Sarum table).

- **`/Users/cameronlewis/Dev/venite/.planning/research/competitors-sing-the-office.md`** — singtheoffice.com dossier (closed-source React/Parcel SPA, 3.2 MB bundle reverse-engineered). Informs: `antiphonTones: simple | solemn` toggle, per-mode persistent transposition map, drop-cap on first verse, `psalmsBold: none | alternate | all` tri-state (adopted in Phase 1), click-a-neume to play (Phase 2), "no recordings" is expensive to reverse post-launch (leave `PsalmTone.recordings?` slot).

- **`/Users/cameronlewis/Dev/venite/.planning/research/competitors-episcopal-chant.md`** — episcopalchant.com dossier. Uses **Exsurge + Tone.js + Hypher + bbloomf/jgabc's `psalmtone.js`**. Credits Venite's Greg Johnston. Validates GABC/Exsurge bet. Informs: switch Design Decision #22 (raw WebAudio) → Tone.js; harvest `bbloomf/jgabc` `psalmtone.js` as base for `point-psalm.ts`; add tempo/transpose/step-forward/"chant from here" to Phase 2 backlog.

- **`/Users/cameronlewis/Dev/venite/.planning/research/gabc-exsurge-ecosystem.md`** — technical brief. Corrects: renderer is **`bbloomf/exsurge`** (not dead `frmatthew/exsurge`; not stale npm `exsurge@0.0.0`); pin via `"exsurge": "github:bbloomf/exsurge#<sha>"`; vendor/mirror for bus factor 1. Font: **`ExsurgeChar.otf`** (17 KB, MIT, bundled) — Design Decision #18 (Caeciliae default) is wrong. Bundle size: **~52 KB gzip** (not 200 KB). GregoBase: **~19,000 chants** (not 14,000). iOS Safari AudioContext user-gesture unlock + silent `<audio>` workaround budgeted.

- **`/Users/cameronlewis/Dev/venite/.planning/research/codebase-integration.md`** — file-level integration map of the repo. Flags: orphan `/chant/` dir is a build artifact (delete); `components/src/components.d.ts` is a stale autogen that imports `@venite/chant` (regenerate); `DisplaySettings` uses a **positional constructor** (`ldf/src/display-settings.ts:1–21`) assembled by `combineLatest` in `app/src/app/preferences/preferences.service.ts:387–403` — new fields go at the END only; `MediaSessionService` already exists (`app/src/app/services/media-session.service.ts`, 388 lines) — extend, don't rebuild; no npm workspaces → cross-package edits need `npm link`; `commonprayer/` is a Deno SSG with no sync to `app/src/offline/` → Phase 1 must include a sync script.

- **`/Users/cameronlewis/Dev/venite/.planning/research/prior-art-landscape.md`** — broader ecosystem. Confirms: orphan `/chant/dist/` has a richer zod-validated `Differentia` / `Mediation` / `Termination` schema and tones 1–8 + Peregrinus JSON (Feb 15–22 work) worth cherry-picking before deletion. The Anglican lane is wide open (plainsong.org still "launching Lent 2026"). GregoBaseCorpus (bacor) snapshot is a CC0 ingest target for Phase 3.

## Codebase reference

- **`/Users/cameronlewis/Dev/venite/.planning/codebase/ARCHITECTURE.md`**, **`STACK.md`**, **`CONVENTIONS.md`**, **`STRUCTURE.md`**, **`TESTING.md`**, **`CONCERNS.md`**, **`INTEGRATIONS.md`** — existing codebase maps. Used as ground truth for package layout, test idioms (Jest for ldf, Stencil e2e for components, Karma/Jasmine for app), and cross-package dependency chain.
