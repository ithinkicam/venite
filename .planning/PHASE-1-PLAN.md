# Phase 1 Execution Plan — Chant Support for Venite

**Status:** Ready to execute. Supersedes disagreements in `/Users/cameronlewis/Dev/venite/resources/CHANT_DESIGN.md` where noted.
**Audience:** An orchestrator agent coordinating parallel workers. This file is the *what*; `PHASE-1-AGENT-EXECUTION.md` is the *how* (parallel dispatch, agent briefs, branch strategy).
**Companions:**
- `/Users/cameronlewis/Dev/venite/.planning/PHASE-1-AGENT-EXECUTION.md` — parallel multi-agent dispatch plan (orchestrator + up to 4 concurrent workers per wave).
- `/Users/cameronlewis/Dev/venite/.planning/RESEARCH-INDEX.md` — index into the 6 research dossiers.

---

## Executive summary

**Mission.** Add plainchant support to Venite as a learner's aid for the Daily Office: text pointing, square-note GABC notation via Exsurge, and (Phase 2) dynamic tone audition. Not a performer — a teaching tool.

**Phase 1 scope.** Schema + smoke-test tone library (8 Sarum tones + Tonus Peregrinus) + algorithmic pointer + hand-pointed Ps 23 / Ps 95 golden fixtures + CSS-only pointing overlay component (`ldf-chant-pointing`) + three new `DisplaySettings` fields (`chantNotation`, `chantTradition`, `psalmsBold`) + drop-cap first-verse CSS + `/chant-pointing` correction skill stub + a commonprayer → app sync script. **Explicitly not in scope:** GABC rendering, Exsurge integration, audio synthesis, the full Sarum tone corpus, Marian antiphons, seasonal tone engine, Anglican chant.

**Most important deltas vs `CHANT_DESIGN.md`.**
- **Renderer:** pin `bbloomf/exsurge` (not `frmatthew/exsurge`; not npm `exsurge@0.0.0`), with a vendored mirror. (Phase 2 dep; called out now so Phase 1 types don't lock us in.)
- **Font:** `ExsurgeChar.otf` (bundled with Exsurge, 17 KB, MIT) — **not** Caeciliae. Design Decision #18 amended.
- **Audio (Phase 2+):** Tone.js, not raw WebAudio. Design Decision #22 amended.
- **Tone schema:** replace the flat `PsalmTone` with `recitingNote: string` with a richer `ToneFile / ToneVariant / Mediation / Differentia` structure cherry-picked from the orphan `/chant/dist/` module (zod-validated). Encodes Peregrinus's two reciting notes correctly; encodes mediation/termination as fixed pairs (true to Sarum practice).
- **PsalmPointing:** extend to carry caesura (`*`), flex (`†`), preparatory-syllable marks, and per-syllable flex-inflection marks (⁻ strong, ˇ weak).
- **Schema future-proofing:** add `PsalmTone.recordings?: { url; credit; license? }[]` now (unused in Phase 1).
- **Pointer:** vendor `bbloomf/jgabc`'s `psalmtone.js` (Unlicense, public domain) as starting point for `point-psalm.ts`; adapt to TypeScript; preserve attribution.
- **Marian antiphons (Phase 3, not Phase 1):** **Latin-only from GregoBase CC0** per Design Decision #14 — confirmed by owner. St Dunstan's English adaptations (Winfred Douglas, Andrewes Press 2002) are **copyrighted** and are not shippable. Existing English LDF text docs (`liturgy_backups/alma-redemptoris.ldf.json`) are Venite-authored prayer text and may remain as the text layer; they are not paired with St Dunstan melodies.
- **Copyright guardrail (applies across all phases):** St Dunstan's Plainsong Psalter (Andrewes Press 2002), Litton's Plainsong Psalter (1988), and the Anglican Chant Psalter (1987) are copyrighted reference material. Ancient Sarum melodic formulas and Latin chant texts are public domain. We **study** rubrics and structure from these sources but **do not reproduce** typography, English translations, or editorial pointings. Our pointing output in `commonprayer/src/chant/pointing/*.json` is algorithmic + our own editorial judgment, verified against (not copied from) the printed psalters.
- **Bundle / corpus size claims:** Exsurge ~52 KB gzip (not 200 KB); GregoBase ~19,000 chants (not 14,000). Cosmetic but worth fixing.
- **Cleanup precondition:** delete orphan `/chant/` + regenerate stale `components/src/components.d.ts` **before** any new code lands.
- **Content pipeline:** Phase 1 must include a `scripts/sync-chant-offline.ts` Node script to copy `commonprayer/src/chant/tones/*.json` → `app/src/offline/chant/tones.json` — otherwise content rots.

**Rough effort (working days, single agent).** Wave 0: 0.5 d. Wave 1: 2–3 d. Wave 2: 3–5 d (pointer + fixtures). Wave 3: 1–2 d. Wave 4: 0.5 d. Wave 5: 1–2 d. Wave 6: 0.5 d. **Total: 8–13 working days.** Golden-fixture iteration on pointing (Ps 23, Ps 95) is the dominant variable.

---

## Design deltas vs CHANT_DESIGN.md

| Area | Design doc says | Research says | Phase 1 plan says | Reason |
|---|---|---|---|---|
| Exsurge fork | "most active fork; pin to SHA" (unnamed) | `bbloomf/exsurge`, **not** `frmatthew/exsurge` (dormant) nor npm `exsurge@0.0.0` (2016 artifact). Active fork shipped v1.21.1 on 22 Apr 2026. | Pin `"exsurge": "github:bbloomf/exsurge#<sha>"` in Phase 2. Vendor a mirror under `app/vendor/exsurge/` to mitigate bus factor 1. **Not installed in Phase 1** (no renderer yet). | Upstream is dead; fork is the only credible source; solo maintainer risk needs mitigation. |
| Font (Decision #18) | Caeciliae (Exsurge default) | Current Exsurge ships **`ExsurgeChar.otf`** (17 KB, MIT) bundled. Caeciliae has not released since 2013. | `ExsurgeChar.otf`. Caeciliae becomes an optional later alternative. | Smaller (17 KB vs ~250 KB), same author, already in dep tree, matches production use (Source & Summit, Breviarium Gregorianum). |
| Audio lib (Decision #22) | "raw WebAudio API" | episcopalchant.com runs Tone.js on raw OscillatorNode in production at scale; gives BPM/transpose/scheduling for free. | **Tone.js** in Phase 2. Phase 1 has no audio, but we will not architect away from Tone.js. | Future features (tempo ±, transpose ±, "chant from here") are ~free on Tone.js, ~days of work on raw WebAudio. |
| `PsalmTone.recitingNote` | `recitingNote: string` (singular) | Tonus Peregrinus uses **two** reciting notes (one per half-verse). | Use the orphan `/chant/dist/` shape: each `ToneVariant` has a `recitingTone: Pitch` and Peregrinus is modeled with a distinct `secondRecitingTone?: Pitch` (additive to the variant schema). Singular `recitingNote` string is discarded. | Correct encoding of Peregrinus; no schema sprawl. |
| Mediation / Termination | Flat `mediantCadenceGabc` + `finalCadenceGabc` strings | Sarum practice binds mediation to termination as **fixed pairs** (not independent axes). St Dunstan's table confirms: each mediation (A, B, C, S) has its own list of endings. | Adopt orphan's `Mediation` + `Differentia` (mediation wraps its `differentiae: Differentia[]`). Each `Differentia` carries the termination cadence. | Truer to the source material; preserves the constraint that "ending 1 of Tone I A" and "ending 1 of Tone I B" are different differentiae, not a shared `finalCadence`. |
| Abrupt mediation | No field | St Dunstan prints "Abrupt Mediation" for I B, III A, VII. Not a separate ending — a separate *mediation form*. | Add `mediationVariant?: 'standard' \| 'abrupt'` to `ToneVariant`. Abrupt mediations appear as separate variants (e.g. `tone-1-b-abrupt`). | Named in the source; affects rendering and selection. |
| Gospel-canticle intonations | `useFor?: string[]` on PsalmTone | Most modes have a distinct **intonation** for Benedictus/Magnificat; Tone III has a distinct **mediation**. | Add `intonations?: { standard: Pitch[]; solemn?: Pitch[]; gospelCanticle?: Pitch[] }` on `ToneVariant`. `useFor` stays as a supplementary hint. | Captures the structural distinction without flattening it into a tag. |
| `PsalmPointing` | `mediantAccent`, `finalAccent`, `flexAccent` word-from-end indices + `ending: 'dactylic'` flag | Need: caesura position, flex position, preparatory-syllable marks, `⁻` / `ˇ` flex-inflection marks, intonation span (Litton italicises first 2 syllables). | Extend: `caesura?: number`, `flex?: { wordFromEnd: number; inflected: boolean }`, `preparatorySyllables?: number[]`, `intonationWords?: number` (count from start). Retain `mediantAccent`, `finalAccent`. | One schema supports both St Dunstan and Litton rendering styles; leaves room for per-syllable overrides in Phase 2 corrections. |
| Recordings slot | Absent; Decision #22 says "no recordings ever" | singtheoffice.com launched synth-only and is fundraising to add recordings after user pushback. Schema slots are free pre-launch. | Add `PsalmTone.recordings?: { url: string; credit: string; license?: string }[]` (unused, optional). | Reversible schema decision is near-free now; adding the field post-launch means migrations. |
| Pointer implementation | "Write `point-psalm.ts` from scratch" | `bbloomf/jgabc` has a battle-tested `psalmtone.js` under the Unlicense (public domain). | **Vendor `psalmtone.js`** under `ldf/src/chant/vendor/psalmtone.js`, adapt/port to TypeScript in `ldf/src/chant/point-psalm.ts`, preserve attribution in a header comment + `ATTRIBUTIONS.md` row. | Saves 1–2 weeks and matches proven behavior. |
| Marian-antiphon language (Decision #14) | Latin only from GregoBase CC0; English deferred | St Dunstan ships English (Winfred Douglas adaptations); existing LDF text docs are English. **But** St Dunstan's Plainsong Psalter is copyrighted (Andrewes Press 2002), so its English settings are not shippable. | **Latin-only from GregoBase CC0** — original Design Decision #14 stands. Existing English LDF prayer text docs may remain as text layer; no pairing with St Dunstan melodies. Not a Phase 1 task (Phase 3). | Copyright-clean; matches design intent; GregoBase corpus (~19k CC0 chants) covers all four Marian antiphons. |
| **Copyright guardrail** (new row) | Not addressed | St Dunstan's Plainsong Psalter (Andrewes Press 2002), Litton's Plainsong Psalter (1988), Anglican Chant Psalter (1987), and Winfred Douglas's English adaptations are **under copyright**. Ancient Sarum melodic formulas and Latin chant texts are public domain. | **Reference only**: study rubrics, conventions, and structural decisions; do **not** reproduce typography, English translations, or editorial pointings. Pointings ship as our own editorial output, verified against but not copied from printed psalters. Tone JSON cherry-picked in W1.7 is medieval melodic formulas (PD), not St Dunstan's typographic rendering. | Prevents infringement; keeps corpus shippable. |
| Bundle-size claim | "~200 KB, lazy-loaded" | 222 KB raw / **52 KB gzip** (`bbloomf/exsurge@1.21.1 dist/exsurge.min.js`). | Phase 1 docs say "~52 KB gzip"; Phase 2 work budgets accordingly. Not load-bearing in Phase 1. | Accuracy; affects UX budget conversations. |
| Corpus size (GregoBase) | "~14,000 CC0 chants" | Public SQL dump (Jan 2024) has **18,762 chant rows**; live site higher. | Phase-3 docs say "~19,000 (2024 dump)". | Accuracy; affects ingest planning in Phase 3. |
| Commonprayer → app sync | Not specified | No existing script. `commonprayer/src/liturgy/psalter/bcp1979/psalm-23.json` edits do **not** propagate to `app/src/offline/psalter/psalms.json` without manual copy. | Phase 1 adds `scripts/sync-chant-offline.ts` (Node; plain-Node script, not Deno, to avoid forcing Deno on the agent). Script sources `commonprayer/src/chant/tones/*.json` → `app/src/offline/chant/tones.json` and `commonprayer/src/chant/pointing/*.json` → `app/src/offline/chant/pointing/*.json`. | Content drift is the #1 silent failure mode; script makes the author's workflow explicit. |
| Orphan `/chant/` removal | Not specified | The `/chant/dist/` directory is gitignored but real on disk; its `@venite/chant` import is referenced by a stale autogenerated `components/src/components.d.ts`. Next Stencil build will fail. | **Wave 0** deletes `/chant/` after cherry-picking its tone-JSON and pointing-algorithm ideas; regenerates `components.d.ts`. | Unblocks everything. Easy to forget. |
| `@venite/chant` packaging | Design implies new `ldf/src/chant/` subtree under `@venite/ldf` | Codebase has no npm workspaces; adding a new package is a large tax; `ldf/` already ships `Psalm`, `Refrain` etc. | **Chant lives in `ldf/src/chant/`** under `@venite/ldf`. No new npm package. No `@venite/chant`. | Fewer publishes to coordinate; matches existing convention. |
| Pre-existing bug | Not mentioned | `commonprayer/src/services/compile-service.ts:57–69` builds `prefs = defaultPrefs` and has a `// TODO user prefs` — user preferences are ignored in the compile service. Phase 4 tone-tradition cascade silently depends on this being fixed. | Not a Phase 1 blocker. Flagged as a dependency for Phase 4. | Don't let it leak into Phase 1; don't forget it for Phase 4. |
| DisplaySettings additions | `chantNotation`, `chantTradition` only | singtheoffice's `psalmsBold: none \| alternate \| all` is the right tri-state for pointing typography regardless of notation. | Add three fields in Phase 1: `chantNotation`, `chantTradition`, `psalmsBold`. Drop-cap on first verse (CSS only, no settings field — always-on; controlled by existing `DisplaySettings.dropcaps`). | Cheap typography win; teaches the rendering pipeline. |

---

## Open questions

Decisions the user should confirm before or during execution. The plan's current position is in **Recommended default**; no Phase 1 task changes if defaults stand.

### Q1: Marian antiphon language — Latin-only vs English-first? [RESOLVED 2026-04-22]
- **Resolution:** Latin-only from GregoBase CC0 per original Design Decision #14. Owner confirmed: St Dunstan's Plainsong Psalter (including Winfred Douglas's English adaptations) is **copyrighted** (Andrewes Press 2002) and cannot ship. GregoBase is fully CC0 and provides all four Marian antiphons in Latin. Existing English LDF prayer-text docs may remain as the text layer for English-language prayer pages — they are not paired with St Dunstan melodies.
- **Implications:** Phase 3 content ingest pulls Latin Marian antiphons + their GABC from GregoBase. `language: 'la'` on the chant metadata. English text docs stay separate.
- **No further blocks.**

### Q2: Audio library — Tone.js vs raw WebAudio (Decision #22)?
- **Recommended default:** Tone.js.
- **Rationale:** episcopalchant.com ships it in production. Tempo, transpose, scheduling, "chant from here", and polyphony (if Anglican chant ever arrives) are ~free. Size cost is ~30 KB gzip on a lazy-loaded Phase 2 module.
- **Reversibility:** Moderate. Swapping once audio service code exists is a day's refactor.
- **Blocks:** No Phase 1 tasks (audio is Phase 2). Phase 1 schema must not assume either; `PsalmTone.playback.Note` stays as-is.

### Q3: Exsurge fork pin + vendored mirror?
- **Recommended default:** Yes — pin `bbloomf/exsurge` at a specific SHA (Phase 2 task); mirror to a Venite-controlled repo (e.g. `venite-app/exsurge`) and install from the mirror.
- **Rationale:** Upstream `frmatthew` is dormant; `bbloomf` is bus-factor 1; mirror protects against repo deletion/privation.
- **Reversibility:** Cheap. Dep pin + mirror URL change.
- **Blocks:** Nothing in Phase 1. Actioned in Phase 2, Wave 1.

### Q4: Font — ExsurgeChar (bundled) vs Caeciliae (Decision #18)?
- **Recommended default:** ExsurgeChar.otf (bundled with Exsurge, MIT, 17 KB).
- **Rationale:** Smaller, same author, already in the dep tree, matches production-deployed apps. Caeciliae hasn't released since 2013.
- **Reversibility:** Cheap. Font-face swap.
- **Blocks:** Nothing in Phase 1 (no renderer). Documented for Phase 2.

### Q5: Cherry-pick orphan `/chant/dist/` tone JSON data before deletion?
- **Recommended default:** Yes — copy `tone-1.json` … `tone-8.json`, `tone-p.json` into a scratch location before `rm -rf chant/`, then re-home into `commonprayer/src/chant/tones/` during Wave 1 with minor ID-format adjustments.
- **Rationale:** ~500 lines of hand-transcribed St Dunstan data verified 2026-02-15. Re-typing is 1–2 days of work we don't have to repeat.
- **Reversibility:** One-shot. If we delete `/chant/` without cherry-picking, recreating requires another manual transcription pass.
- **Blocks:** Wave 1 tone-library tasks. If "no," re-transcribe from `resources/St dunstan/table of Sarum tones.pdf` (budget +2 d for Wave 1).

### Q6: Harvest `bbloomf/jgabc` `psalmtone.js` as base for `point-psalm.ts`?
- **Recommended default:** Yes. Vendor under `ldf/src/chant/vendor/psalmtone.js` with a header banner preserving the `bbloomf/jgabc` attribution ("Unlicense / public domain — https://github.com/bbloomf/jgabc/blob/master/psalmtone.js"), then adapt/port to `ldf/src/chant/point-psalm.ts`.
- **Rationale:** Saves 1–2 weeks. Proven behavior. Clean license (Unlicense = public domain).
- **Reversibility:** Moderate. Writing from scratch remains possible if the vendor's algorithm doesn't fit our `PsalmPointing` shape.
- **Blocks:** Wave 2 pointer task. If "no," Wave 2 pointer task grows from M to L/XL.

### Q7: Add `PsalmTone.recordings?` slot now (unused in Phase 1)?
- **Recommended default:** Yes.
- **Rationale:** singtheoffice.com demonstrates "no recordings" is expensive to reverse post-launch. Adding an optional array slot to the schema is near-zero cost now, schema migration cost later.
- **Reversibility:** Expensive once populated.
- **Blocks:** Wave 1 tone-schema task. Small field addition.

### Q8: Phase 1 includes `psalmsBold` tri-state + drop-cap CSS?
- **Recommended default:** Yes.
- **Rationale:** singtheoffice.com validates the tri-state pattern (`none | alternate | all`). Drop-cap CSS is ~20 lines. Both teach the rendering pipeline before the harder Wave 5 work begins. Neither blocks anything if deferred.
- **Reversibility:** Cheap.
- **Blocks:** Wave 1 DisplaySettings task (adds `psalmsBold`); Wave 3 component task (reads `psalmsBold`).

### Q9: Chant types live in `@venite/ldf` (not a new `@venite/chant` package)?
- **Recommended default:** Yes — live in `ldf/src/chant/`. No new npm package.
- **Rationale:** No npm workspaces. Every new package adds a publish/link cycle to every downstream package. `ldf/` already holds document types and is the correct semantic home.
- **Reversibility:** Moderate. Extracting to a separate package later is a mechanical refactor.
- **Blocks:** All Wave 1 type tasks.

---

## Wave-based task breakdown

Waves are gated; tasks within a wave are parallel-safe unless `Depends on` says otherwise.

### Wave 0 — Cleanup / precondition

**Gate:** Wave 1 cannot start until Wave 0 lands on `master` (or an agreed feature branch) and the repo builds.

#### W0.1 — Cherry-pick orphan tone JSON and pointer ideas into scratch
- **Depends on:** none
- **Files touched:**
  - Copy (read-only snapshot) `/Users/cameronlewis/Dev/venite/chant/dist/tones/tone-1.json` … `tone-8.json`, `tone-p.json` → `/Users/cameronlewis/Dev/venite/.planning/scratch/chant-tones/` (new dir; add `.gitignore` if needed, or commit as reference data).
  - Copy `/Users/cameronlewis/Dev/venite/chant/dist/types/tone.d.ts` → `/Users/cameronlewis/Dev/venite/.planning/scratch/chant-types/tone.d.ts` (reference for Wave 1 schema port).
  - Copy `/Users/cameronlewis/Dev/venite/chant/dist/pointing/*.js` → `.planning/scratch/chant-pointing/` (reference for Wave 2 pointer algorithm).
- **Action:** `mkdir -p /Users/cameronlewis/Dev/venite/.planning/scratch/chant-{tones,types,pointing}` and copy. Commit as reference data under `.planning/scratch/`. These files are inputs to Waves 1–2; they do not ship.
- **Acceptance:** `ls /Users/cameronlewis/Dev/venite/.planning/scratch/chant-tones/` lists 9 JSON files.
- **Test:** N/A (data copy).
- **Risk:** Orphan dir is gitignored via `*/dist/` pattern; ensure `.planning/scratch/` is **not** gitignored (it is not — `.planning/` is tracked).
- **Est:** S

#### W0.2 — Delete orphan `/chant/` directory
- **Depends on:** W0.1
- **Files touched:** `rm -rf /Users/cameronlewis/Dev/venite/chant`
- **Action:** `rm -rf /Users/cameronlewis/Dev/venite/chant`. Verify no tracked files were in `chant/` (it's gitignored): `git status --ignored | grep -c '^!! chant/'` should be non-zero before, zero after.
- **Acceptance:** `ls /Users/cameronlewis/Dev/venite/chant 2>&1` returns "No such file or directory".
- **Test:** N/A.
- **Risk:** None — dir is gitignored; `.planning/scratch/` already holds the data.
- **Est:** S

#### W0.3 — Regenerate `components/src/components.d.ts`
- **Depends on:** W0.2
- **Files touched:** `components/src/components.d.ts` (gitignored — regeneration only affects local working tree)
- **Note:** `components/src/components.d.ts` is listed in `.gitignore` (line 4: `*/src/components.d.ts`), so it is **not a tracked file**. The stale file exists only in the local working tree from a prior build. Regenerating it is a **local** step, not a commit.
- **Action:** Run `cd components && npm install && npm run build`. Stencil regenerates `components.d.ts` from actual component sources — with `/chant/` deleted, there is no `@venite/chant` module to import, so the regenerated file will be chant-free. If `npm install` fails due to auth/network, as a temporary measure hand-edit the file to remove `LdfChantNotation` references (lines 9, 29–46, 806–810, 1030, 1085–1102, 1787, 1831 per `.planning/research/codebase-integration.md §A`); but note that the next successful Stencil build will re-author the file.
- **Acceptance:** `grep -c "@venite/chant\|LdfChantNotation" /Users/cameronlewis/Dev/venite/components/src/components.d.ts` returns `0`. `cd components && npm run build` succeeds.
- **Test:** Re-run `cd components && npm run build`. Must be green.
- **Risk:** `components/` may need `node_modules` installed; if network access is constrained, hand-edit is a temporary workaround.
- **Est:** S (if build works) / M (if install troubleshooting).

#### W0.4 — Verify repo builds with no chant references
- **Depends on:** W0.3
- **Files touched:** none (verification only)
- **Action:** Run `cd /Users/cameronlewis/Dev/venite/ldf && npm install && npm run build` (produces `ldf/dist/`). Run `cd ../components && npm run build`. If either has untracked install failures (missing node_modules, network-gated private packages), log them and mark this task blocked — do **not** paper over. Build success is Wave 0's exit criterion.
- **Acceptance:** Both packages build without errors. Committing Wave 0 changes then cloning fresh and rebuilding would produce green builds.
- **Test:** `cd ldf && npm test` (Jest runs on `ldf/tests/*.test.ts`; should pass with the unmodified test suite).
- **Risk:** If `npm install` for `components/` blocks on a private registry or missing peer dep that predates this work, **stop and surface it as a Checkpoint Gate 0 question**. Do not attempt to "fix" unrelated build issues in Wave 0.
- **Est:** S–M (depending on install time).

**Commit message for Wave 0:** `chore(chant): W0 — remove orphan chant/ dir and regenerate components.d.ts`

---

### Wave 1 — Types + static data

All tasks parallel-safe once W0 is done. W1 outputs: `@venite/ldf` with new chant types, the nine tone JSON files in `commonprayer/`, the sync script, and three new `DisplaySettings` fields.

#### W1.1 — Create `ldf/src/chant/` type modules
- **Depends on:** W0.4
- **Files touched (all new):**
  - `ldf/src/chant/pitch.ts` — `export interface Pitch { note: 'C'|'D'|'E'|'F'|'G'|'A'|'B'; octave: number; accidental?: 'b'; }`
  - `ldf/src/chant/neume-group.ts` — `export interface NeumeGroup { notes: Pitch[]; role: 'intonation'|'reciting'|'preparation'|'accent'|'post-accent'; }`
  - `ldf/src/chant/mediation.ts` — `export interface Mediation { cadence: NeumeGroup[]; }`
  - `ldf/src/chant/differentia.ts` — `export interface Differentia { id: string; label: string; termination: { cadence: NeumeGroup[] }; }`
  - `ldf/src/chant/tone-variant.ts` — `export interface ToneVariant { id: string; label: string; isDefault: boolean; intonation: Pitch[]; recitingTone: Pitch; secondRecitingTone?: Pitch; mediation: Mediation; mediationVariant?: 'standard'|'abrupt'; differentiae: Differentia[]; intonations?: { standard: Pitch[]; solemn?: Pitch[]; gospelCanticle?: Pitch[] }; useFor?: string[]; recordings?: { url: string; credit: string; license?: string }[]; }`
  - `ldf/src/chant/tone-file.ts` — `export interface ToneFile { id: string; mode: number | 'peregrinus'; name: string; variants: ToneVariant[]; _comment?: string; }`
  - `ldf/src/chant/chant-data.ts` — `export interface ChantData { toneId?: string; tradition?: string; mode?: number | string; gabc?: string; source?: string; }`
  - `ldf/src/chant/pointing.ts` — `export interface VersePointing { mediantAccent?: number; finalAccent?: number; caesura?: number; flex?: { wordFromEnd: number; inflected: boolean }; preparatorySyllables?: number[]; intonationWords?: number; ending?: 'dactylic'; } export interface PsalmPointing { verses: { [verseNumber: string]: VersePointing }; }`
  - `ldf/src/chant/psalm-tone-assignment.ts` — `export interface PsalmToneAssignment { source: string; psalm: string; toneId: string; season?: string; day?: string; weekday?: string; evening?: boolean; partNumber?: number; }`
  - `ldf/src/chant/format-tone-id.ts` — pure function: `formatToneId(id: string): string`. Maps `"tone-1-a-4"` → `"I.A.4"`; `"tone-2-default-1"` → `"II.1"`; `"tone-peregrinus-a"` → `"P.A"`; `"tone-1-b-abrupt"` → `"I.B (abrupt)"`. Kebab-case slugs in, human-readable out.
  - `ldf/src/chant/index.ts` — local barrel re-exporting all of the above.
- **Action:** Create each file. **Prefer plain interfaces over zod** at this stage — ldf is published TS types, and zod would introduce a new runtime dep across ldf consumers. If runtime validation is needed (W1.4 tests benefit), add zod as a devDependency only and validate in tests.
- **Acceptance:** `cd ldf && npm run build` succeeds; `cat ldf/dist/chant/index.d.ts` shows exported types.
- **Test:** W1.4 covers. For this task alone, `cd ldf && npx tsc --noEmit` (type-check only) passes.
- **Risk:** `Pitch` is a new commonly-used type name; confirm no collision in `ldf/src/` (grep shows none as of 2026-04-21).
- **Est:** M (~2–3 h).

#### W1.2 — Widen metadata on Psalm / Refrain / Text / ResponsivePrayer
- **Depends on:** W1.1
- **Files touched:**
  - `ldf/src/psalm.ts` (edit `metadata` inline type): add `chant?: ChantData; pointing?: PsalmPointing;`. Import both at top of file.
  - `ldf/src/refrain.ts`: change `metadata` from required to optional **or** add `chant?: ChantData` to the existing required shape. Preference: add `chant?: ChantData` to the existing shape, keep metadata required. Import `ChantData`.
  - `ldf/src/text.ts`: to the optional `metadata?` shape add `chant?: ChantData`.
  - `ldf/src/responsive-prayer.ts`: to the optional `metadata?` shape add `chant?: ChantData`.
- **Action:** Additive edits only. Do not reorder existing fields. Do not change required-vs-optional on any existing field.
- **Acceptance:** `cd ldf && npx tsc --noEmit` passes. `cd ldf && npm test` — existing tests in `psalm.test.ts` still pass unmodified.
- **Test:** W1.4 covers (adds a test constructing a `Psalm` with `metadata.chant` and `metadata.pointing`).
- **Risk:** `Refrain.metadata` is *required* (not optional) today (`ldf/src/refrain.ts:10`). Keep it required. Just add `chant?: ChantData`.
- **Est:** S

#### W1.3 — Extend `ldf/src/index.ts` barrel
- **Depends on:** W1.1
- **Files touched:** `ldf/src/index.ts`
- **Action:** Append: `export * from './chant';` (single line if W1.1 created `ldf/src/chant/index.ts`).
- **Acceptance:** `cd ldf && npm run build && node -e "console.log(Object.keys(require('./dist')))"` lists `Pitch`, `NeumeGroup`, `Mediation`, `Differentia`, `ToneVariant`, `ToneFile`, `ChantData`, `PsalmPointing`, `VersePointing`, `PsalmToneAssignment`, `formatToneId`.
- **Test:** W1.4 covers.
- **Risk:** None.
- **Est:** S

#### W1.4 — LDF chant tests (Jest)
- **Depends on:** W1.1, W1.2, W1.3
- **Files touched (all new):**
  - `ldf/tests/chant.test.ts` — smoke test: construct `new Psalm({ type: 'psalm', metadata: { chant: { toneId: 'tone-1-a-4' }, pointing: { verses: { '1': { mediantAccent: 2, finalAccent: 1 } } } } })`, assert round-trip equality.
  - `ldf/tests/format-tone-id.test.ts` — table-driven: `[['tone-1-a-4', 'I.A.4'], ['tone-2-default-1', 'II.1'], ['tone-peregrinus-a', 'P.A'], ['tone-1-b-abrupt', 'I.B (abrupt)'], ['tone-3-s-6', 'III.S.6']]`. Each row: `expect(formatToneId(slug)).toBe(human)`.
  - `ldf/tests/chant-types.test.ts` — type-level smoke: assign a literal matching Peregrinus shape (two reciting notes via `secondRecitingTone`) and assert the object constructs.
- **Action:** Copy the Jest idiom from `ldf/tests/psalm.test.ts:1–50`. No `.spec.ts`; use `.test.ts`.
- **Acceptance:** `cd ldf && npm test -- --testPathPattern=chant` — all tests pass.
- **Test:** Self.
- **Risk:** None.
- **Est:** S–M

#### W1.5 — Append three fields to `DisplaySettings` constructor
- **Depends on:** W0.4
- **Files touched:** `ldf/src/display-settings.ts`
- **Action:** Append **at the END** of the positional constructor (new fields go last to avoid breaking `combineLatest` assembly):
  ```ts
  public chantNotation: 'off' | 'collapsed' | 'always' | 'tablet-only' = 'off',
  public chantTradition: 'sarum' | 'roman' | 'pmms' | 'st-dunstan' | 'none' = 'none',
  public psalmsBold: 'none' | 'alternate' | 'all' = 'none',
  ```
  Do **not** reorder any existing fields. The existing constructor ends at `audioRecordings`; new three go immediately after, still inside `constructor(...) {}`.
- **Acceptance:** `cd ldf && npm run build` succeeds. `new DisplaySettings()` still works with zero args. `new DisplaySettings('plain','bold','bracket','m','garamond','',0.85,'silence',0.5,false,false,'singing-bowl','auto','both',1000,false,false,'off','none','none')` constructs.
- **Test:** Extend `ldf/tests/chant.test.ts` with a DisplaySettings construction assertion.
- **Risk:** **High** — this field must be paired with W1.6 in the same commit or positional construction in `preferences.service.ts` silently breaks. Paired W1.5+W1.6 below.
- **Est:** S

#### W1.6 — Update `preferences.service.ts` to pass new fields positionally
- **Depends on:** W1.5
- **Files touched:** `app/src/app/preferences/preferences.service.ts` (lines 387–403 area)
- **Action:** In the `combineLatest([...])` call that feeds `new DisplaySettings(...settings)` (currently lines 387–402), **append three entries at the end** matching the constructor order:
  ```ts
  this.grabPreference('chantNotation'),
  this.grabPreference('chantTradition'),
  this.grabPreference('psalmsBold'),
  ```
  Result: the array has 18 entries (was 15). The `map((settings) => new DisplaySettings(...settings))` call is unchanged.
- **Acceptance:** `cd app && npm run build` (or `ng build`) succeeds. Runtime: `preferencesService.displaySettings()` subscribed in a test should emit `DisplaySettings` with `chantNotation === 'off'` when no preference is set.
- **Test:** Karma/Jasmine spec at `app/src/app/preferences/preferences.service.spec.ts` if it exists — extend; else add a focused test.
- **Risk:** App package may require `@venite/ldf` rebuild + `npm link` or publish (see cross-package hazard in §M of codebase-integration research). **Mitigation:** execute Wave 1 in this order: W1.1–W1.4 (ldf only) → `cd ldf && npm run build` → `cd app && npm link @venite/ldf` (local dev) → W1.5+W1.6 together in one commit.
- **Est:** S

#### W1.7 — Create `commonprayer/src/chant/tones/*.json`
- **Depends on:** W0.1, W1.1
- **Files touched (all new):**
  - `commonprayer/src/chant/tones/tone-1.json`
  - `commonprayer/src/chant/tones/tone-2.json`
  - `commonprayer/src/chant/tones/tone-3.json`
  - `commonprayer/src/chant/tones/tone-4.json`
  - `commonprayer/src/chant/tones/tone-5.json`
  - `commonprayer/src/chant/tones/tone-6.json`
  - `commonprayer/src/chant/tones/tone-7.json`
  - `commonprayer/src/chant/tones/tone-8.json`
  - `commonprayer/src/chant/tones/tone-peregrinus.json`
- **Action:** Copy the nine JSON files from `.planning/scratch/chant-tones/tone-*.json` (staged in W0.1) into the new directory. Rename `tone-p.json` → `tone-peregrinus.json` for clarity and to match the `formatToneId` helper. Validate each file parses as `ToneFile` (W1.1 schema). Required shape adjustments:
  - `id` stays `tone-1`, `tone-2`, … `tone-peregrinus`. Variants keep their IDs as-is (e.g. `tone-1-a`, `tone-1-b`).
  - Add `mediationVariant: 'standard'` to existing variants (orphan data doesn't have it).
  - Add `secondRecitingTone` to the Peregrinus variant if the orphan data conflates the two reciting notes; inspect `tone-p.json` and split if needed.
  - Replace the orphan's `_comment` header with: "Melodic formulas from the Sarum chant tradition (public domain, medieval). St Dunstan's Plainsong Psalter served only as a verification reference — no typography, pointings, or editorial choices from that copyrighted work have been reproduced. Adapted to ldf/chant schema YYYY-MM-DD." This must be stated explicitly because the orphan was built with St Dunstan as a cross-reference; downstream reviewers need to see the PD provenance.
- **Acceptance:** `node -e "const t = require('./commonprayer/src/chant/tones/tone-1.json'); console.log(t.variants.length)"` runs. Peregrinus file has a variant with both `recitingTone` and `secondRecitingTone` set. All nine files validate against the `ToneFile` interface (W1.10 test covers this).
- **Test:** W1.10 (validation test) + W1.4 (`chant-types.test.ts` can import and assert on one tone file).
- **Risk:** Orphan data may be incomplete or use subtly different role names. If mismatch, fix the data to match the schema, **not the other way round**.
- **Est:** M (~2–3 h, mostly inspection + minor edits).

#### W1.8 — Create `scripts/sync-chant-offline.ts`
- **Depends on:** W1.7
- **Files touched (all new):**
  - `scripts/sync-chant-offline.ts` (new top-level `scripts/` dir)
  - `scripts/package.json` (minimal `{ "name": "venite-scripts", "type": "module", "scripts": { "sync-chant": "node --loader ts-node/esm sync-chant-offline.ts" } }` or equivalent; alternative: ship as `.js` if agent prefers not to add ts-node).
- **Action:** Node script, **not Deno** (Deno is used by `commonprayer/` SSG but this script should run on the agent's default Node). Behavior:
  1. Read every `commonprayer/src/chant/tones/*.json` file.
  2. Validate each against the `ToneFile` shape (best-effort; fail with a human-readable error if a field is missing).
  3. Aggregate into `{ tones: { 'tone-1': { ... }, 'tone-peregrinus': { ... } } }` or `{ tones: [...] }` — match the shape expected by the future `ChantToneService` (Phase 2); for Phase 1, use `{ tones: <array of ToneFile> }`.
  4. Write to `app/src/offline/chant/tones.json`.
  5. Read every `commonprayer/src/chant/pointing/*.json` (created in W2.3), aggregate, write to `app/src/offline/chant/pointing/<basename>.json`.
  6. Log lines written.
- **Acceptance:** `node scripts/sync-chant-offline.ts` completes with no errors; `cat app/src/offline/chant/tones.json | jq '.tones | length'` returns `9`.
- **Test:** Add `scripts/sync-chant-offline.test.ts` (Jest) covering: read → validate → write. Use a tmp dir as destination.
- **Risk:** `app/angular.json` `architect.build.options.assets` must include `src/offline/chant/**` (likely already included via `src/offline/` glob — verify; if not, add). Skipping the assets update silently breaks runtime fetches.
- **Est:** M (~3–4 h).

#### W1.9 — Verify `app/angular.json` assets glob covers `src/offline/chant/`
- **Depends on:** W1.8
- **Files touched:** `app/angular.json` (conditional)
- **Action:** `grep -A 20 '"assets"' app/angular.json | head -40`. If the existing glob (likely `"src/offline"` or `{ "glob": "**/*", "input": "src/offline", "output": "offline" }`) is recursive, new `src/offline/chant/*` files will be picked up automatically. If glob is non-recursive or pinned to specific subdirs, extend.
- **Acceptance:** After `cd app && ng build` (or equivalent), `dist/app/offline/chant/tones.json` exists. If the agent cannot run the Angular build due to environment constraints, verify by inspection: confirm the JSON `assets` entry covers `src/offline/**` recursively.
- **Test:** N/A (build verification).
- **Risk:** If assets are misconfigured, the app can run in dev but break in prod.
- **Est:** S

#### W1.10 — Tone-library validation test
- **Depends on:** W1.7
- **Files touched (new):** `ldf/tests/tone-library.test.ts`
- **Action:** Import one sample JSON (can use Node `require` in Jest) and assert it satisfies the `ToneFile` interface structurally. Iterate all 9 files if practical; assert invariants: `variants.length >= 1`, exactly one variant has `isDefault: true`, every `differentia.termination.cadence[n].role` is in the allowed enum, Peregrinus has `secondRecitingTone` on at least one variant.
- **Acceptance:** `cd ldf && npm test -- --testPathPattern=tone-library` passes.
- **Test:** Self.
- **Risk:** `require` of files outside `ldf/src` needs relative path `../../commonprayer/src/chant/tones/tone-1.json` — ensure Jest `moduleDirectories` or explicit relative paths resolve.
- **Est:** S

**Commit messages for Wave 1:**
- W1.1–W1.3: `feat(ldf): W1.1-3 — add chant types (Pitch, ToneFile, ChantData, PsalmPointing)`
- W1.4, W1.10: `test(ldf): W1.4+10 — chant type tests + tone library validation`
- W1.5+W1.6 (**atomic**): `feat(ldf,app): W1.5-6 — add chantNotation/chantTradition/psalmsBold to DisplaySettings`
- W1.7: `feat(commonprayer): W1.7 — add smoke-test tone library (8 Sarum tones + Peregrinus)`
- W1.8: `build(scripts): W1.8 — add sync-chant-offline.ts`
- W1.9: `build(app): W1.9 — verify/extend assets glob for offline/chant/`

---

### Wave 2 — Generators + pointer + fixtures

Gate: Wave 1 complete. Within this wave, W2.1 (generator) and W2.2 (pointer) can run in parallel. W2.3 (fixtures) depends on both.

#### W2.1 — `generate-gabc.ts` — pure GABC string generator
- **Depends on:** W1.1
- **Files touched (new):** `ldf/src/chant/generate-gabc.ts`
- **Action:** Pure function: `generateGabc(input: { tone: ToneVariant; differentia: Differentia; pointedVerse: VersePointing; text: string }): string`. Emits a single GABC fragment like `"(c4) Hap-(f)py(g) are(g) they(g) who (g) fear(h) the(h) Lord,(h) *(:) and(h) have(h) great(h) de-(g)light(g) in(f) his(f) com-(e)mand(e)ments.(d) (::)"`. Algorithm: intonation on first N syllables → reciting tone for bulk → mediation cadence on last M syllables before `*` → reciting tone → termination cadence on last K syllables before `::`. Map each `Pitch` (e.g. `{ note: 'A', octave: 3 }`) to a GABC letter (`a`–`m`) per standard Exsurge mapping (the orphan's `gabc/gabc-pitch-map.js` is the reference; adapt to a lookup table inline).
- **Acceptance:** Given a golden fixture (Tone I A ending 4 applied to "The Lord is my shepherd; I shall not be in want."), `generateGabc(...)` returns an exact string matching a hand-authored golden.
- **Test:** `ldf/tests/generate-gabc.test.ts`. Start with three cases: (1) normal Tone I A 4 on Ps 23 v1. (2) Peregrinus on Ps 114 v1 (tests two-reciting-note handling). (3) Flex applied to a long verse.
- **Risk:** GABC pitch-letter mapping depends on clef (`c1`–`c4`, `f1`–`f4`). For Phase 1, hardcode `c4` clef. Document in code.
- **Est:** M–L (~4–6 h).

#### W2.2 — `point-psalm.ts` — algorithmic pointer (vendor jgabc)
- **Depends on:** W0.1, W1.1
- **Files touched (new):**
  - `ldf/src/chant/vendor/psalmtone.js` — copy of `bbloomf/jgabc/psalmtone.js` with a header comment preserving public-domain attribution. URL: https://github.com/bbloomf/jgabc/blob/master/psalmtone.js.
  - `ldf/src/chant/vendor/ATTRIBUTIONS.md` — explicit Unlicense preservation note + upstream URL + SHA pinned.
  - `ldf/src/chant/point-psalm.ts` — adapted TypeScript entry point. Signature: `pointVerse(text: string, tone: ToneVariant, options?: { language?: 'en' | 'la' }): VersePointing`. Calls into the vendored algorithm (wrap in a module if needed).
- **Action:** Vendor the JS; write a thin TS wrapper that produces `VersePointing` in Venite's schema shape. Do **not** port the algorithm line-by-line — wrap it. If jgabc exports TeX/HTML/GABC output, parse the output back into accent-position indices, or intercept at an earlier pipeline stage.
- **Acceptance:** `pointVerse("The Lord is my shepherd; I shall not be in want.", toneIA4)` returns `VersePointing` with `mediantAccent: 1` (or whatever the golden is) and `finalAccent: 2`.
- **Test:** `ldf/tests/point-psalm.test.ts`. **Golden fixtures from BCP 1979 Ps 23 verse-by-verse + Ps 95 verse-by-verse.** Iteratively: run pointer, compare to hand-pointed reference (W2.3), adjust until match.
- **Risk:** jgabc's `psalmtone.js` may depend on Hypher for syllabification (episcopalchant dossier notes this). If so, vendor Hypher too (MIT) — `npm install hypher` and include it as a dev dep.
- **Est:** L (~6–8 h including test iteration).

#### W2.3 — Hand-point Ps 23 + Ps 95 as golden fixtures
- **Depends on:** W1.1 (for schema)
- **Files touched (all new):**
  - `commonprayer/src/chant/pointing/psalm-23.json` — shape: `{ psalm: '23', source: 'st-dunstan', verses: { '1': VersePointing, '2': VersePointing, ... } }`. One entry per verse in BCP 1979.
  - `commonprayer/src/chant/pointing/psalm-95.json` — same shape.
  - `commonprayer/src/chant/pointing/psalms-bcp1979.json` — aggregator: `{ '23': { ... }, '95': { ... } }`, populated from the per-psalm files.
- **Action:** Read `commonprayer/src/liturgy/psalter/bcp1979/psalm-23.json` and `psalm-95.json` to confirm verse splits. For each verse, hand-determine:
  - `mediantAccent` (word index from end of first half-verse, 0-based on last word)
  - `finalAccent` (word index from end of second half-verse)
  - `flex?` where the verse is long enough (St Dunstan rubric: only on long verses)
  - `intonationWords: 2` on verse 1 only (St Dunstan convention)
  - Any `ending: 'dactylic'` exceptions (~8% per design doc)
- Use the jgabc algorithmic pointer (W2.2) as a first pass, then verify against St Dunstan's structural conventions (dot for cadence start, asterisk for caesura, ~8% dactylic endings) — **do not reproduce St Dunstan's specific pointing choices**; the output must be our own editorial judgment. The printed Ps 14 example is reference for the *conventions*, not a template to copy. This is a copyright constraint, not a style preference.
- **Acceptance:** Both files parse as `{ psalm, source, verses: { ...VersePointing } }`. A hand-authored golden test case (`ldf/tests/point-psalm.test.ts`) compares algorithmic output vs the fixture and passes at Ps 23 full.
- **Test:** See W2.2 test.
- **Risk:** Pointing is editorial; first-pass output may diverge from St Dunstan's printed forms. Accept that **W2 Checkpoint Gate** requires user eyeball.
- **Est:** M–L (~3–5 h; the time is in careful hand-review, not code).

#### W2.4 — Sync pointing data via Wave-1 script
- **Depends on:** W1.8, W2.3
- **Files touched:** `app/src/offline/chant/pointing/psalms-bcp1979.json` (generated)
- **Action:** Run `node scripts/sync-chant-offline.ts`. Verify output. Commit the generated file.
- **Acceptance:** `cat app/src/offline/chant/pointing/psalms-bcp1979.json | jq 'keys'` returns `["23", "95"]`.
- **Test:** N/A.
- **Risk:** Sync script must handle a pointing directory (W1.8 was written to handle this).
- **Est:** S

**Commit messages for Wave 2:**
- W2.1: `feat(ldf): W2.1 — add generate-gabc pure function`
- W2.2: `feat(ldf): W2.2 — vendor jgabc psalmtone.js and wrap as point-psalm.ts`
- W2.3: `feat(commonprayer): W2.3 — hand-point Ps 23 and Ps 95 as golden fixtures`
- W2.4: `build: W2.4 — sync chant pointing data to app offline`

---

### Wave 3 — Component scaffolding

Can run in parallel with W2 once W1 types are published and ldf is rebuilt/linked. Strictly requires W1.1–W1.4 to be done.

#### W3.1 — `ldf-chant-pointing` Stencil component
- **Depends on:** W1.1, W1.2
- **Files touched (all new):**
  - `components/src/components/chant-pointing/chant-pointing.tsx`
  - `components/src/components/chant-pointing/chant-pointing.scss`
  - `components/src/components/chant-pointing/chant-pointing.e2e.ts`
- **Action:** Stencil component. Tag `ldf-chant-pointing`. Props: `@Prop() text: string` (the verse/half-verse text); `@Prop() pointing: VersePointing | string` (JSON-parseable); `@Prop() psalmsBold: 'none' | 'alternate' | 'all' = 'none'`; `@Prop() verseIndex: number = 0` (for alternate-line bolding). Render: span-wrap accented syllables with a class (`.accent-mediant`, `.accent-final`, `.flex-mark`), emit U+2020 (†) as the flex marker and U+002A (`*`) as the caesura — **real Unicode**, per accessibility guidance in prior-art landscape §F. Bolding logic: `psalmsBold === 'all'` → all accents bold; `'alternate'` → even-indexed verses bold; `'none'` → no bold overlay (still show caesura/flex marks). SCSS is ~30 lines.
- **Acceptance:** Stencil e2e test at `chant-pointing.e2e.ts` renders `<ldf-chant-pointing text="..." pointing='{"mediantAccent":2,"finalAccent":1}' psalmsBold="all"></ldf-chant-pointing>` and asserts: (a) last word of first half-verse has `.accent-final` class, (b) `*` appears between halves, (c) bold style applied when `psalmsBold="all"`.
- **Test:** Self.
- **Risk:** Accent-index → syllable math reuses the pointer logic. If possible, import the same syllabify helper from `@venite/ldf` (part of W2.2's vendoring). Otherwise, duplicate a small vowel-heuristic.
- **Est:** M (~3–4 h).

#### W3.2 — Drop-cap first-verse CSS (global)
- **Depends on:** none (can run parallel with all of W3)
- **Files touched:**
  - `components/src/components/psalm/psalm.scss` — append `.verse:first-of-type::first-letter { float: left; font-size: 3em; line-height: 0.9; padding-right: 0.1em; font-family: var(--ldf-dropcap-font, serif); }` (pattern from singtheoffice.com). Wrap in `:host([psalms-dropcap="yes"])` or gate off the existing `DisplaySettings.dropcaps` value already threaded into the Psalm component.
  - If a dedicated dropcap font is desired, add a webfont declaration; otherwise reuse the page's serif.
- **Action:** Minimal CSS. Inspect `components/src/components/psalm/psalm.tsx` to confirm the existing `dropcaps` prop handling — existing `DisplaySettings.dropcaps` has values `'decorated' | 'plain' | 'none'`. Use `'decorated'` to gate the first-verse drop-cap.
- **Acceptance:** In a dev build of `www/` via `cd commonprayer && ./run.sh` (or Angular dev), Ps 23 verse 1 starts with a large drop-cap when `dropcaps === 'decorated'`.
- **Test:** Extend existing `components/src/components/psalm/psalm.e2e.ts` with a single assertion on the presence of the drop-cap style.
- **Risk:** CSS specificity; first-of-type matching depends on DOM shape. Verify against current `psalm.tsx` output.
- **Est:** S

#### W3.3 — Component registration
- **Depends on:** W3.1
- **Files touched:** none (Stencil auto-discovers new components). Verify that `components/src/index.ts` (if used as manual barrel) does not need additions — normally Stencil's `dist` + `loader` output target handles this.
- **Action:** Rebuild components: `cd components && npm run build`. Confirm `components/src/components.d.ts` gets regenerated to include `LdfChantPointing` — this is the **correct** regeneration (replaces the stale `LdfChantNotation` block we removed in W0.3).
- **Acceptance:** `grep -c LdfChantPointing components/src/components.d.ts` > 0. `grep -c LdfChantNotation components/src/components.d.ts` === 0 (still no chant-notation; that's Phase 2).
- **Test:** Full `cd components && npm test` green (runs Stencil e2e tests).
- **Risk:** None.
- **Est:** S

**Commit messages for Wave 3:**
- W3.1: `feat(components): W3.1 — add ldf-chant-pointing CSS overlay component`
- W3.2: `feat(components): W3.2 — drop-cap first verse of psalms/canticles`
- W3.3: `build(components): W3.3 — regenerate components.d.ts for chant-pointing`

---

### Wave 4 — `/chant-pointing` skill + iterative correction

Parallel with W3.

#### W4.1 — Add `/chant-pointing` Claude Code skill
- **Depends on:** W2.3 (fixtures exist to correct against)
- **Files touched (new):**
  - `~/.claude/skills/chant-pointing/chant-pointing/SKILL.md` (per user's skill layout convention; confirm via `ls ~/.claude/skills/` that this path matches existing skills like `meal-planner`). Alternative local location: `.planning/skills/chant-pointing.md` in the repo itself if the skill is project-scoped.
- **Action:** Skill definition: "given a verse of a psalm and a proposed `VersePointing`, critique the pointing against St Dunstan's conventions (dot marks start of cadence; `⁻` for strong flex syllables, `ˇ` for weak; intonation only on verse 1; ~8% dactylic exceptions) and emit a corrected `VersePointing` JSON block that the user can paste into `commonprayer/src/chant/pointing/<psalm>.json`." Include reference to `resources/St dunstan/concerning the psalter.pdf` for rubrics.
- **Acceptance:** Skill is discoverable via `/chant-pointing` in an interactive Claude Code session. Running it on a verse returns a JSON block.
- **Test:** Manual.
- **Risk:** Skill location is user-config-dependent. If the user prefers a project-local skill, adjust path. Either way, skill must be present for Phase 2+ pointing correction work to be efficient.
- **Est:** S

---

### Wave 5 — Wire up to pray page

Gate: W1, W2, W3 complete.

#### W5.1 — Integrate `ldf-chant-pointing` in `ldf-psalm` component
- **Depends on:** W3.1, W3.3
- **Files touched:**
  - `components/src/components/psalm/psalm.tsx` (lines ~288–392, the verse-rendering loop per codebase-integration §D)
- **Action:** Around line 320 (`<ldf-string text={verse.verse}>`) and line 343 (`<ldf-string text={verse.halfverse}>`), gate on `this.obj.metadata?.pointing?.verses?.[verse.number]`. If present **and** `displaySettings.chantNotation !== 'off'`, render `<ldf-chant-pointing text={verse.verse} pointing={this.obj.metadata.pointing.verses[verse.number]} psalmsBold={displaySettings.psalmsBold} verseIndex={verseIdx}></ldf-chant-pointing>` instead of (or wrapping) the `<ldf-string>` call. Same for `halfverse` (pass half-verse-specific subset of `VersePointing`).
- **Acceptance:** In the dev build, serving a psalm with `metadata.pointing` set, the verse text shows caesura `*` and bolded accents on Ps 23 per the golden fixture. When `chantNotation === 'off'`, behavior is unchanged (existing `<ldf-string>` path).
- **Test:** Extend `components/src/components/psalm/psalm.e2e.ts` with a scenario: inject a Psalm JSON that includes `metadata.pointing`, assert the DOM contains `<ldf-chant-pointing>`.
- **Risk:** Existing `<ldf-string>` handles features the new component might not (highlighting, selection). For Phase 1, keep `<ldf-string>` as a fallback when no pointing data exists; wrap (don't replace) when pointing present. Verify TTS continues to read the text correctly — screen readers and `speechSynthesis` should see the plain text (use `aria-label` on `<ldf-chant-pointing>` carrying the un-marked text).
- **Est:** M (~2–3 h).

#### W5.2 — Add `psalmsBold` toggle to pray page footer (or Display Settings modal)
- **Depends on:** W1.5, W1.6
- **Files touched:**
  - `app/src/app/pray/display-settings/display-settings-config.ts` — add a picker for `psalmsBold` with options `none | alternate | all` and label "Bolded accents".
  - `app/src/app/pray/display-settings/display-settings.component.html` — if `display-settings-config.ts` doesn't drive it automatically, add an `<ion-select>` with three options.
- **Action:** Extend the settings modal, not the pray-page footer (footer `<ion-footer>` is reserved for TTS controls per codebase research §J). Verify the settings modal is the correct home by inspecting `display-settings-config.ts` — if it's a declarative config array of settings, add an entry.
- **Acceptance:** Open display settings in the running app, see a "Bolded accents" picker. Selecting "all" and closing the modal causes a psalm with `metadata.pointing` to re-render with all accents bold. Setting persisted in localStorage.
- **Test:** Karma/Jasmine spec on `display-settings.component.spec.ts` (if exists) asserting the select has three options.
- **Risk:** Settings modal changes are UI-heavy; keep the form minimal. Do **not** add `chantNotation` or `chantTradition` UI in Phase 1 — those are Phase 2 surface. For Phase 1 we want `psalmsBold` only, because it's the one field that visibly affects a psalm with hand-pointed data.
- **Est:** M (~2 h).

#### W5.3 — Karma smoke test: pray page displays pointed Ps 23
- **Depends on:** W5.1, W5.2, W1.9 (asset glob)
- **Files touched (new):** `app/src/app/pray/pray.page.chant.spec.ts` — or extend existing `pray.page.spec.ts` if present.
- **Action:** Spec: construct a `PrayPage` test bed with a mock `DocumentService` returning a Ps 23 whose `metadata.pointing` references the golden fixture. Assert that the rendered DOM includes `<ldf-chant-pointing>`. If `PrayPage` spec infrastructure is thin (per CONCERNS.md §TESTING), a minimal existence assertion is acceptable.
- **Acceptance:** `cd app && npm test` runs the new spec green.
- **Test:** Self.
- **Risk:** `PrayPage` has ~1705 lines and may be hard to stand up in TestBed. Keep the spec narrow; test only the render integration, not the compile pipeline.
- **Est:** M (~2 h).

#### W5.4 — Manual UAT checklist
- **Depends on:** W5.1–W5.3
- **Files touched:** none (checklist in plan; executor runs).
- **Action:** Execute:
  1. `cd app && ng serve` (or equivalent dev server).
  2. Navigate to Pray → Morning Prayer (any day that uses Ps 23 or Ps 95). If calendar resolution is a pain, use the psalter page.
  3. Confirm: Ps 23 v1 displays intonation-italic on first 2 words, caesura `*` in the middle, bolded accented syllable on the mediant and final.
  4. Toggle `psalmsBold` in display settings; verify bold/no-bold. Toggle `dropcaps` to `decorated`; verify drop-cap on v1.
  5. Toggle `chantNotation` to `'off'`; verify pointing disappears, existing TTS still works.
  6. Mobile layout sanity: resize to iPhone width; no layout break.
- **Acceptance:** All six items behave as expected.
- **Test:** Manual.
- **Risk:** This is the Phase 1 smell test.
- **Est:** S

**Commit messages for Wave 5:**
- W5.1: `feat(components): W5.1 — render chant-pointing inline in ldf-psalm when pointing data present`
- W5.2: `feat(app): W5.2 — add psalmsBold picker to display settings`
- W5.3: `test(app): W5.3 — smoke test chant pointing renders in pray page`
- W5.4: (manual; no commit)

---

### Wave 6 — Checkpoint + documentation

#### W6.1 — Update `CHANT_DESIGN.md` with Phase-1-confirmed decisions
- **Depends on:** W5.4
- **Files touched:** `/Users/cameronlewis/Dev/venite/resources/CHANT_DESIGN.md`
- **Action:** Amend:
  - Decision #18: replace "Caeciliae" with "ExsurgeChar.otf (bundled with Exsurge)."
  - Decision #22: "Tone.js for audio synthesis (Phase 2); no recordings shipped, but `PsalmTone.recordings?` slot exists."
  - Data model §: replace flat `PsalmTone` block with a pointer to `ldf/src/chant/tone-file.ts` + the new `ToneFile`/`ToneVariant`/`Differentia` shape.
  - Corpus size: "~19,000 CC0 chants in GregoBase (2024 dump); ~52 KB gzip for Exsurge."
  - Data model: document the `secondRecitingTone`, `mediationVariant`, `intonations`, `recordings?`, expanded `PsalmPointing` fields.
  - Marian-antiphon decision: note Design Decision #14 (Latin-only from GregoBase) stands, confirmed 2026-04-22. Add a "Copyright guardrail" subsection referencing St Dunstan / Litton / Anglican Chant Psalter as reference-only.
  - Add a new "Phase 1 shipped" subsection listing what actually landed.
- **Acceptance:** Doc is internally consistent; deltas in this plan match the doc.
- **Test:** Readability review.
- **Risk:** None.
- **Est:** S

#### W6.2 — Write `.planning/PHASE-1-SUMMARY.md`
- **Depends on:** W6.1
- **Files touched (new):** `/Users/cameronlewis/Dev/venite/.planning/PHASE-1-SUMMARY.md`
- **Action:** One page. Sections: Shipped (types + tones + 2 golden psalms + component + CSS + 3 settings fields + sync script + skill). Known gaps (no rendering; no audio; only 9 tones; 2 psalms; compile-service user-pref bug). Phase 2 entry conditions (Exsurge fork SHA pinned; Tone.js added; `chantNotation` picker surfaced in UI; expand to 20 psalms).
- **Acceptance:** Exists, readable, < 200 lines.
- **Test:** N/A.
- **Risk:** None.
- **Est:** S

---

## Test strategy

- **ldf types (Jest, `ldf/tests/*.test.ts`).** In scope: type-level smoke tests (constructors), `formatToneId` table-driven test, `generate-gabc` golden-fixture test (3 cases), `point-psalm` golden-fixture tests (Ps 23 + Ps 95 verse-by-verse), tone-library structural validation (all 9 tone files conform to `ToneFile`). Out of scope: property-based testing, differential testing vs jgabc output (Phase 2 once we can visually compare SVGs).
- **Component snapshot (Stencil e2e, `components/src/components/chant-pointing/chant-pointing.e2e.ts`).** In scope: render-with-props, accent-class assertions, bold-mode toggles. Out of scope: screenshot/visual regression (no baseline infrastructure in `components/` today).
- **Pray page smoke (Karma/Jasmine, `app/src/app/pray/pray.page.chant.spec.ts`).** In scope: the `<ldf-chant-pointing>` custom element appears when `metadata.pointing` is present. Out of scope: a full `PrayPage` lifecycle test (too much mock surface).
- **Manual UAT (W5.4).** In scope: one ministry-eye pass through Ps 23 with all three settings toggles. Out of scope: systematic cross-browser matrix (budget for Phase 2, especially iOS Safari once audio lands).

Coverage target: no hard percentage. Pointing fixtures for Ps 23 and Ps 95 must implement St Dunstan's structural conventions (dot for cadence start, asterisk for caesura, flex on long verses only, ~8% dactylic exceptions) convincingly before Wave 2 exits — **without reproducing St Dunstan's specific editorial pointings** (copyright constraint). The Ps 14 printed example informs conventions; it is not a template to copy.

---

## Checkpoint gates

Execution **halts** at each gate for user review.

- **Gate 0 (after W0.4).** "Orphan `chant/` deleted; `components.d.ts` regenerated; `ldf/` and `components/` both build clean." User eyeballs the build output, confirms nothing unrelated broke, then authorizes Wave 1.
- **Gate 2 (after W2.3 + W2.4).** "Pointing fixtures for Ps 23 and Ps 95 exist and match my ear." User opens `commonprayer/src/chant/pointing/psalm-23.json` and walks through 2–3 verses. This is the hardest gate. Expect 1–2 rounds of adjustments via `/chant-pointing` skill.
- **Gate 5 (after W5.4).** "End-to-end: pray Morning Prayer with Ps 23 and the pointing renders." Executor demos in the running app; user confirms visual. Authorizes W6 documentation sweep.

No Wave 6 gate — W6 is housekeeping.

---

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Exsurge (`bbloomf/exsurge`) fork bus factor 1 → repo disappears | Low | High (Phase 2+ blocked) | Vendor to `app/vendor/exsurge/` during Phase 2 W1; mirror to `venite-app/exsurge` on GitHub. **No Phase 1 impact.** |
| iOS Safari AudioContext not unlocked | N/A in Phase 1 | High in Phase 2 | Documented; Phase 2 budgets an iOS test day. |
| commonprayer → app content drift | **High** if Phase 1 skips sync script | Silent content rot (pointing edits don't reach runtime) | **W1.8 sync script is mandatory in Phase 1.** |
| Angular 12 / modern-dep incompatibility | Low in Phase 1 (no new runtime deps) | High in Phase 2 (Exsurge ESM) | Phase 2 W1 includes a sandbox import test before wiring. |
| Pointing algorithm wrong on non-standard psalms | **High** | Moderate (requires manual correction) | Golden fixtures for Ps 23 and Ps 95 in Wave 2; `/chant-pointing` skill (W4.1) for ongoing corrections; per-verse `VersePointing` override is the escape hatch. |
| St Dunstan tone table covers more than 9 smoke-test tones | **High** (there are ~99 cells in the full table) | None in Phase 1 (scope held to 9); large in Phase 2 transcription | Phase 2 scope document should call out the transcription burden explicitly (~99 entries; see `.planning/research/chant-pdfs.md §11`). |
| `DisplaySettings` positional constructor breaks silently if W1.5 + W1.6 land separately | Moderate | High | Atomic commit for W1.5+W1.6 per the commit-message plan above. Test with a full `DisplaySettings` spec. |
| `components.d.ts` stale autogen keeps regenerating `LdfChantNotation` | Low (we control source) | Low | Verified in W0.3 that no chant-notation component exists; Stencil will omit it. If it reappears, there's a leftover tsx or metadata file — find and remove. |
| Vendored jgabc `psalmtone.js` depends on Hypher or other libraries not in the dep tree | Moderate | Moderate | Read the vendored file before declaring W2.2 complete; add required deps explicitly. All involved deps (Hypher, Unlicense/MIT) are license-safe. |
| Cross-package changes require `npm link` or publish | **High** | Moderate (slows dev) | Document the `npm link` workflow in Wave 1 commit message. Executor uses `cd ldf && npm run build && cd ../app && npm link @venite/ldf` between W1.5 and W1.6. |
| `commonprayer/src/services/compile-service.ts:68` ignores user preferences | N/A in Phase 1 | High in Phase 4 (tone-tradition cascade silently broken) | Flagged in deltas table; add a Phase 4 prerequisite task to fix. **Not a Phase 1 blocker.** |
| Worker reproduces St Dunstan / Litton / Anglican-Chant-Psalter typography or pointings verbatim despite guardrail | Moderate (copyright guardrail is verbal, not mechanically enforced) | **High** (infringement; cannot ship content) | Every worker brief includes the copyright clause; Gate 2 user review explicitly diff-checks pointings against any printed reference the worker consulted. If in doubt at review, re-point the verse. |

---

## Explicit non-goals for Phase 1

- GABC rendering (`ldf-chant-notation` component) → Phase 2
- Audio playback / synthesis (`ldf-chant-player`) → Phase 2
- Exsurge integration → Phase 2
- Tone.js integration → Phase 2
- Full Sarum tone corpus (~99 entries) → Phase 2
- Marian antiphons, hymns, collect tones, lesson tones → Phase 3
- Seasonal tone engine / `PsalmToneAssignment` resolution → Phase 4
- Anglican chant (4-part SATB) → **never** per project decisions
- Reproduction of copyrighted materials — St Dunstan's Plainsong Psalter (Andrewes Press 2002), Litton's Plainsong Psalter (1988), Anglican Chant Psalter (1987), Winfred Douglas's English Marian-antiphon adaptations → **never**. These are reference only; all shipped pointings, translations, and settings are our own editorial output or drawn from public-domain sources (Sarum-tradition melodic formulas, GregoBase CC0 Latin texts + GABC).
- Recording playback — the `recordings?` slot is schema-only; no playback wiring in Phase 1 or 2
- PDF export of pointed psalms → Phase 5 backlog
- Click-a-neume to play from there → Phase 2
- Per-mode persistent transposition map → Phase 2
- `chantTradition` picker UI in display settings → Phase 2 (field exists; no UI in Phase 1)
- `chantNotation` picker UI in display settings → Phase 2 (field exists; no UI in Phase 1 — `off` default is the only state used)
- Fixing `compile-service.ts:68` user-prefs bug → Phase 4 prerequisite
- Sync from `commonprayer/src/liturgy/psalter/` to `app/src/offline/psalter/` for psalm *text* (only *chant data* sync is in scope)
- English-language Marian antiphon schema work → Phase 3
- GregoBase import pipeline → Phase 3

---

## Execution instructions for the orchestrator

This plan is executed by an **orchestrator agent** that dispatches parallel **worker agents**, not by a single agent working serially. See `PHASE-1-AGENT-EXECUTION.md` for the dispatch pattern, per-wave agent manifest, branch strategy, and self-contained brief template.

High-level flow:
1. **Read `PHASE-1-AGENT-EXECUTION.md` first.** It tells you how many workers to launch per wave, which task IDs each worker owns, and what branch each worker uses.
2. **Work waves sequentially: W0 → W1 → W2 → W3 → W4 → W5 → W6.** Within each wave, dispatch the specified worker agents **in parallel** in a single message (multiple `Agent` tool calls).
3. **At each Checkpoint Gate** (after W0.4, W2.4, W5.4), **halt and wait for user confirmation** before advancing. Post a short summary of what shipped and ask for sign-off.
4. **Commit discipline per worker**: each worker commits its own tasks atomically using the suggested commit messages in this plan, task-ID-prefixed. Atomic pairs (W1.5+W1.6) are one worker, one commit.
5. **Orchestrator glue between workers**: cross-package propagation (ldf build → npm link @venite/ldf in app) is the orchestrator's job between waves, not the worker's. See `PHASE-1-AGENT-EXECUTION.md` § Orchestrator runbook.
6. **Open Questions:** defaults are the plan. If a worker hits a case not covered by defaults, it must STOP and report to the orchestrator — no guessing.
7. **Copyright guardrail**: all workers must respect it. Do not reproduce typography, translations, or editorial pointings from St Dunstan / Litton / Anglican Chant Psalter. Structural conventions are studied, not copied.
8. **If a worker discovers a hazard** not listed in the Risks table, it stops and reports. The orchestrator decides whether to re-dispatch, redirect, or escalate to user.
9. **All file paths in this plan are absolute.** Workers use them verbatim.
10. **When finished**, post a single message summarizing Wave 6 outputs and tag the user for final review.

---

**End of plan.** Reread before executing: if any task has ambiguity you cannot resolve from the file paths + research docs listed above, surface it as a new Open Question in the next Checkpoint Gate before writing code.
