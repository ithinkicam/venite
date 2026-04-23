# Prior art landscape — plainchant rendering & pointing tools

**Scope:** broader-field survey for Venite's chant feature. singtheoffice.com and episcopalchant.com are covered by other agents and are therefore intentionally thin here.

**Date:** April 2026.

---

## 1. Executive summary

- **The web corpus is GABC-or-nothing.** Every serious chant-rendering web/JS product since ~2015 uses GABC (input) and Exsurge.js or Gregorio/LaTeX (renderer). MEI + Verovio exists but serves academic manuscript work, not liturgical display. Venite's "GABC is the sole notation format" decision is already the consensus.
- **Exsurge.js is semi-abandoned but still the only viable web renderer.** `frmatthew/exsurge` (2017-era) hasn't released in years; `bbloomf/exsurge` fork is active (feeds `bbloomf/jgabc`, last release April 2026). Venite should pin to a bbloomf SHA.
- **Commercial competitors are converging on "switch between square and modern notation on the fly, transpose, synthesize audio, print."** Source & Summit is the high-water mark (Catholic, parish-facing, subscription). Neumz is the audio-first competitor (Solesmes, recordings not synthesis).
- **Catholic side is mature; Anglican/Episcopal side is text-only + PDF.** No Anglican app ships real-time chant rendering today. singtheoffice.com is the closest, and it is narrow. This is Venite's wedge.
- **Pointing UX is almost universally non-interactive.** Users either (a) look at pre-pointed text (most psalters), or (b) generate a pointed output from a text/tone form (jgabc). No production app lets you *drag* an accent onto a syllable. A `/chant-pointing` skill-based workflow is novel.
- **Dynamic tone synthesis (WebAudio from tone formulas) is rare.** Square Note and Neumz play pre-recorded audio. Universalis does not play. Source & Summit does limited playback. Venite's "no recordings, all synthesis from `PsalmTone.playback`" is a real differentiator and lowers ongoing cost.
- **Content licensing is the real constraint, not tech.** GregoBase (~14,000 GABC chants, CC0) is the only usable free corpus. Coverdale pointings live as PDFs behind small presses (Lancelot Andrewes, Anglican House Publishers). St Meinrad is CC-BY-NC-ND (no derivs — unusable for app rendering).
- **Venite already has a nontrivial chant module** (`/chant/dist/`, not in git) with pointing, tones 1–8+peregrinus, syllabify, score-layout, and Zod-validated tone schemas. This is prior iteration, not greenfield. The CHANT_DESIGN.md supersedes but also slightly redirects it (Exsurge vs. custom score-layout).
- **Academic projects (Neon, Cantus Database, Cantus Index, OMR-Plainchant) are useful for corpus enrichment and cross-reference, not rendering.** OMR of medieval neumes isn't going to auto-populate Anglican Coverdale pointings.
- **Dead/dying signals:** `frmatthew/exsurge` (2017 dormant), `bacor/gregobasecorpus` (2020 dormant — but snapshot is fine), `plainsong.org` ("launching soon" for years, now says "launching Lent 2026" — aspirational).

---

## 2. Ecosystem map

### A. Web apps & sites (user-facing)

| # | Product | URL | Summary |
|---|---|---|---|
| 1 | **Divinum Officium** | divinumofficium.com | Perl/CGI-era site of the traditional (pre-Vatican II) Roman Breviary. **No chant notation in core product** — text only. A 10+ year old Issue #1375 asks for GregoBase + Exsurge integration; still open. A third-party mashup exists ("new website … incorporates DivinumOfficium text, Gregobase scores, Exsurge") but it's not the canonical site. **Status: active text, static chant story.** MIT-licensed. **Lesson for Venite:** even a large, well-loved traditional prayer app can ship without integrated chant for 20+ years — the bar to leap over is low. |
| 2 | **iBreviary** | ibreviary.com + apps | Italian priest Paolo Padrini's Liturgy-of-the-Hours app, 10+ languages, iOS/Android/web. **No chant notation.** User reviews specifically ask for it; maker has declined. Proprietary, free. **Lesson: missing hymn-notation is the #1 feature request across the category.** |
| 3 | **Neumz** | neumz.com | Commercial app built on Solesmes's digitized archive. 7,000 hours of recordings of the Benedictine communities of Jouques. Freemium: live "radio" free, on-demand paid. Rendering is **images of Solesmes square-note plates** (not SVG). Added AI tools in 2024 for identifying uncatalogued chants. **Status: active, well-funded, adding v4 features in 2025.** Proprietary; content is Solesmes-licensed, not reusable. **Lesson: audio recording is orthogonal to notation — recordings let users chant along even when they can't read square note. Venite's "dynamic synthesis only" choice forgoes this, which is a real loss for learners.** |
| 4 | **GregoBase** | gregobase.selapa.net | The canonical GABC corpus. ~14,000 chants, CC0. UI is workmanlike — browse by source (Liber Usualis, Solesmes Graduale, Dominican Graduale etc.), get PDF + EPS + PNG + GABC text. No rendering beyond static PDFs. Adjacent project at `bacor/gregobasecorpus` (CC0, MIT code, last updated 2020) packages everything as a `.csv`+`.gabc` tarball for programmatic ingestion. **Status: active content, dormant packaging.** **Lesson: Venite should ingest the `bacor` snapshot as Phase-1 seed, then sync fresh from GregoBase via its API for updates.** |
| 5 | **Chabanel Psalms** | chabanelpsalms.org | Free PDF responsorial psalms for every Sunday + feast, three years, multiple composers. Has MP3s, PDFs, Vimeo videos. Not interactive; delivery is "download the PDF." **Status: active but content-wise basically frozen at 2014 second edition.** CC-ish (free distribution). **Lesson: pre-rendered PDFs scale infinitely and cost nothing to host. For content Venite can't render dynamically, PDF fallback is fine.** |
| 6 | **Source & Summit** | sourceandsummit.com | **The product to benchmark against.** Catholic parish missal+digital platform. Subscription. Interactive score library with: switch square↔modern, change key, add/remove verses, multi-language, point-or-notate psalms, audio playback for every item, print-to-PDF, share Ordo documents, custom booklets on demand. 2026 "Companion Edition" missal just launched. **Status: aggressively active, venture-backed feel.** Proprietary end-to-end. **Lesson: the bar for "polished Catholic chant app" is already set high. Venite's Anglican-first focus is both a moat (no comparable product exists) and a constraint (smaller market). The square↔modern toggle and key-transpose are UX patterns to copy.** |
| 7 | **CPDL / ChoralWiki** | cpdl.org | 54,130 choral+vocal works. Includes sacred music categories: Anglican chant, evening canticles. Scores delivered as PDFs + Finale/Sibelius/MusicXML. **Rendering = PDF images only; no interactive chant display.** Active. CC-BY / PD depending on work. **Lesson: good source for Anglican chant double-settings (the composer-written 2-phrase tunes), but content is offered as sheet music, not as a structured tone for pointing.** |
| 8 | **St Meinrad Archabbey** | saintmeinrad.org/the-monastery/liturgical-music | Home of the Saint Meinrad Psalm Tones (Fr Columba Kelly et al., 1970–71). PDFs of modal psalm tones + audio files. **License is CC-BY-NC-ND 3.0 — no derivative works.** Active. **Lesson: can be cited and linked, cannot be re-rendered inside Venite without permission. For a permissively-licensed alternative, St Dunstan's is the match.** |
| 9 | **Universalis** | universalis.com | Commercial Liturgy-of-the-Hours app, long-established. **Has "Show chant marks" setting** that displays pointed psalms inline with the Grail translation. The tone is user's choice — "any psalm tone fits any psalm" model. No notation rendered; text-based pointing only. Proprietary. **Lesson: a text-pointing-only feature (no SVG notation) can be production-quality and solves 80% of the learner's need. Venite's `ldf-chant-pointing` CSS-only component is aligned with this proven UX.** |
| 10 | **Chabanel → chantpsalter.com** | chantpsalter.com | Interactive Anglican-chant psalm viewer. **Actually renders chants as SVGs** (e.g. `/svg/50-1-Thomas_Purcell.svg`) with the pointed text inline + verticle bars for phrase divisions. Toggle settings for triplet markings and 1928 American Psalter. Built on Macpherson's English Psalter (1925) pointing. **Active, narrow, SVG-based, static-site-feeling.** No evident license/source. **Lesson: pre-generated SVG per psalm-tune pairing is an alternative to runtime Exsurge rendering — simpler, but loses the ability to re-point dynamically. Venite's decision to render on demand is richer but more expensive.** |
| 11 | **psalter.org** | psalter.org | Reformed (RP/ARP/Trinity) psalter apps — different tradition (metrical psalms, not plainsong). $9/year premium. Notable because of the "pitch pipe" and sheet-music-per-tune pattern. Active. **Lesson: a freemium model for chant UX works; metrical-psalm-tunes community pays for it.** |
| 12 | **Anglican Chant Index** | anglicanchant.nl | Academic catalog of Anglican double-chants. 20,000+ chants, 70+ chantbooks, searchable by composer/fingerprint/key/psalm. **MIDI files for every chant.** Active; research-backed (Meijer et al., 2018). No rendering of notation in UI, just the index. Free. **Lesson: MIDI generation from structural data is a well-trodden path — Venite's WebAudio synth can lean on this genre's proven patterns. Also a licensing-safe place to link out for Anglican-chant settings Venite can't itself render.** |
| 13 | **Mission St Clare** | missionstclare.com + iOS app | Free 1979 BCP Daily Office, bilingual English/Spanish. **Has optional music** — some hymns are audio, occasionally a chanted psalm (also audio). No notation. **Status: active but visually dated.** Proprietary. **Lesson: pre-recorded audio is the cheap path to "music in your daily office app." Venite's existing TTS audio system is already halfway there.** |
| 14 | **Forward Movement prayer.forwardmovement.org** | prayer.forwardmovement.org | Plain-vanilla 1979 office text. No music. Active. |
| 15 | **dailyoffice2019 / dailyoffice.app** | dailyoffice2019.com | Django/Vue BCP 2019 app, blocher. **Has some Anglican-chant Gloria Patri formatting logic** (devnotes.php mentions corrected double-chant format for Gloria). Otherwise text. Source: GitHub, recent commits. **Lesson: the Anglican competitor is edging toward chant but hasn't tackled pointing/notation. Venite can define the category.** |
| 16 | **Plainsong.org** | plainsong.org | Anglican Church of Canada Liturgical Psalter, pointed for Plainsong + Fauxbourdons. **"Launching Lent 2026" — still not shipped.** Signup form only. **Status: vaporware-adjacent as of April 2026.** **Lesson: there is genuine demand in the Anglican space for a modern pointed psalter; if plainsong.org slips, Venite can eat that lunch.** |
| 17 | **anglicanmusicresources.org** | anglicanmusicresources.org | New Coverdale Psalter in Gregorian / Simplified Anglican / Full Anglican chant, downloadable as editable MS Word .doc files per year. Active. Proprietary per-setting. **Lesson: "MS Word doc downloads" is the state of the art in Anglican-chant content distribution. Very low bar to beat.** |

### B. Javascript / rendering libraries

| Library | GH / URL | Maint. | License | Relevance |
|---|---|---|---|---|
| **Exsurge** | `frmatthew/exsurge` | Dormant (~2017 last real activity) | MIT | Original JS GABC-to-SVG renderer. Caeciliae font. Client-side only; server-side is "on the horizon" (never shipped). Venite should reference but pin to fork. |
| **Exsurge (bbloomf fork)** | `bbloomf/exsurge` | Active (powers jgabc) | MIT | 811+ commits vs upstream 191; feeds `bbloomf/jgabc` which had a release April 2026. **This is the fork to pin in Venite.** |
| **exsurge-angular / -beta** | `npmjs.com/package/exsurge-angular` | Low traffic; reflects one author's wrapper | MIT | Angular-specific component. Probably not needed if Venite wraps Exsurge directly in its own ldf-chant-notation component. |
| **jgabc** | `bbloomf/jgabc` | **Very active** (v1.10.2 Apr 2026, 2,089 commits) | Unlicense (public domain) | GABC Transcription Tool + Psalm Tone Tool + Propers + Readings + iOS Chant Tools app. Also Android + ChromeOS apps. Built around Exsurge. **The closest prior-art product to what Venite is building, but Catholic/propers-focused.** |
| **Gregorio / GregorioTeX** | gregorio-project.github.io | Active (6.1.0, Feb 2025) | GPL | LaTeX-based typesetting (non-web). Gold standard for printed output. Out of scope for runtime rendering, but useful for generating content PDFs. |
| **Verovio** | rism-digital/verovio | Very active (5.0 2025, improved neume) | LGPL | MEI-based, supports neume notation. Neon editor uses it. Overkill for Venite's use case (MEI is heavier than GABC and the chant-community corpus is in GABC). |
| **Neon / Neon2** | DDMAL/Neon | Active (SIMSSA/McGill) | MIT | Browser-based neume editor for MEI manuscripts. **Interesting UX reference for our `/chant-pointing` skill** — it lets scholars correct OMR output by clicking notes. Adapting its click-edit-commit pattern to pointing-mark editing could be powerful. |
| **canticasacra.org recordings** | canticasacra.org | Active (recording the Dunstan Psalter) | Free | Audio-only. Covers Coverdale text + Sarum tones = exactly Venite's target combo. **Link-out candidate for Phase 5.** |

### C. Academic projects & datasets

| Project | URL | Value to Venite |
|---|---|---|
| **Cantus Database / Cantus Index** | cantusdatabase.org, cantusindex.org | 100s of thousands of medieval-manuscript chant entries; Cantus IDs are a federated key across databases. IIIF image streaming + OMR integration in progress (2024–25). **Use as cross-reference for Venite Marian antiphons + office hymns — we can show "this is Cantus ID 008249, see N manuscripts" next to any chant.** |
| **GregoBaseCorpus (bacor)** | `github.com/bacor/gregobasecorpus` | CC0 snapshot (last updated 2020) of GregoBase in research-friendly CSV+GABC. MIT code. **Pragmatic Phase-1 seed — clone once, ship as offline data.** |
| **chant21** | `github.com/bacor/chant21` | Python library for working with plainchant in music21. Good for data-analysis scripts but not runtime. |
| **cantuscorpus (bacor)** | `github.com/bacor/cantuscorpus` | Scraped Cantus Database dump. Same caveats. |
| **MEI Neume schema** | music-encoding.org/guidelines/v5/content/neumes.html | The authoritative encoding for neume notation. Venite doesn't need it but should be aware: if we ever want to contribute back to scholarly world, MEI is the lingua franca. |
| **OMR-Plainchant (MEI project)** | music-encoding.org/projects/omr-plainchant.html | State-of-the-art research on reading medieval chant MSS. Not actionable for Anglican pointing. |
| **Universal singing-voice synthesis** (2024–25 research) | arxiv / aclanthology | MelodyLM, LAPS-Diff, STARS — text → MIDI → sung audio pipelines. **Too heavy for in-app runtime, but MIDI generation from pointed text is the bridge the research world has built. Venite's simpler WebAudio approach is the right level.** |

### D. Pointing tools (category 15 deep-dive)

**Finding: there is effectively no interactive GUI for pointing English psalms.** Every "pointed psalter" on the web delivers pre-pointed text; the pointing itself was done by hand in an editorial process (or by Fr. Samuel Weber / St. Dunstan's Fellowship / Macpherson / etc.) and frozen into the PDF.

The closest things:

- **jgabc Psalm Tone Tool** (bbloomf) — *generates* a pointed output from a text+tone form, but users don't click accents; they configure "mediant of accents with preparatory syllables" dropdowns and download a GABC file. Form-driven, not gestural.
- **Neon (DDMAL)** — click-to-edit for neume notation on MS images. Totally different use case, but the gesture pattern (click a note, drag, commit) is transferable to "click a syllable, toggle accent."
- **Mark-up-pencil UX** — all print psalters assume the user pencils marks onto their breviary. The digital gap is real.

**Implication for Venite:** the `/chant-pointing` skill (claude-assisted correction workflow) is genuinely novel. No competitor lets a user say "nah, the accent should be on 'mérciful' not 'mercíful' here" and have it persist.

### E. Singing synthesis / text-to-chant (category 16)

- Research-grade work is sophisticated (MelodyLM, STARS, LAPS-Diff, zero-shot multilingual SVS, 2024–25 papers) but model sizes and latencies are unsuitable for a prayer app.
- The in-church bridge has historically been **MIDI generation from tone + pointed text** (anglicanchant.nl does this for Anglican double-chants, has 20,000+ MIDI files). This is what Venite's "dynamic synthesis from `PsalmTone.playback`" will effectively do, but via WebAudio oscillators rather than MIDI+soundfont. Simpler, sufficient for audition.
- **No product in the market ships live TTS-sung chant in a prayer app.** Venite's decision to skip this and use WebAudio synth is correct.

### F. Accessibility (category 17)

- **Braille music is a separate, mature system** (BME, BrailleMuse, MuseScore 4+ has basic Braille export). None of the reviewed chant apps do anything special here.
- **Screen readers** read pointed-psalm text fine — the points are Unicode marks (acute accent, bullet, etc.) rendered inline. If Venite uses CSS `::before` decoration rather than Unicode, screen readers will miss it. **Hard requirement for Venite's `ldf-chant-pointing`: use real Unicode pointing marks with `aria-label` fallbacks, not decorative CSS.**
- **Talking Score project / MuseScore Braille output** are the ecosystem leaders. Venite is unlikely to compete here directly, but being non-hostile to screen readers is cheap.

### G. Venite itself — prior history

**Git log:**

```
git log --all --oneline | grep -i chant  →  30661aeb docs: add chant integration design document
git log --all --oneline | grep -i gabc   →  (none)
git log --all --oneline | grep -i pointing →  (none)
```

**Only the design doc exists in git.** No chant code has ever been merged to master.

**BUT** — an untracked `chant/` module exists in the working tree (`/Users/cameronlewis/Dev/venite/chant/dist/`) containing compiled output for:

- `chant/dist/types/` — `tone.d.ts` with full Zod schemas for `Pitch`, `NeumeGroup`, `Mediation`, `Termination`, `Differentia`, `ToneVariant`, `ToneFile`. Fully typed, Zod-validated. Scientific pitch notation (letter + octave + optional `b`).
- `chant/dist/pointing/` — `syllabify.js`, `parse-verse.js`, `point-half-verse.js`, `point-verse.js`, `flex.js`, plus a `PointedSyllable` / `PointedWord` / `PointedHalfVerse` / `PointedVerse` / `RawSyllable` schema set with role enums (`intonation | reciting | flex-reciting | flex-accent | flex-post | preparation | accent | post-accent`).
- `chant/dist/tones/` — JSON files for tones 1–8 and `tone-p` (Peregrinus). All nine.
- `chant/dist/notation/` — `clef-config`, `pitch-to-staff`, `score-layout` (widths: CLEF_WIDTH, NOTE_WIDTH, RECITING_WIDTH, BARLINE_WIDTH, MARKER_WIDTH, LIGATURE_WIDTH, GAP, STAFF_HEIGHT). **This is a custom SVG score-layout engine, not Exsurge.**
- `chant/dist/selection/` — tone selection logic.
- `chant/dist/validation/` — zod validators.

**This is a significant abandoned-or-paused implementation.** Modification dates: Feb 15–22, 2026. The `CHANT_DESIGN.md` (April 22, 2026) post-dates it and **explicitly reverses key choices** (Exsurge.js vs. custom layout; kebab-case `tone-1-a-4` IDs vs. the existing `tone-1` + variant model).

**Venite's prior-art reveals:** An engineer already built half of Phase 1 with a richer tone model (variants + differentiae = Mediation×Termination pairs, matching real Sarum practice) but using a custom score engine. The current design doc simplifies by outsourcing rendering to Exsurge. **The existing `chant/dist/` Zod schemas for tone data are probably better than what CHANT_DESIGN.md sketches** — they already encode the fixed-pair relationship between mediation and termination that the design doc lists only as an "open question" (#3 flex, #4 differentia). Consider merging.

**Other psalter history in the repo (from git log):**

- Coverdale psalter support: shipped
- Inclusive psalter: shipped (`0240b0f9`)
- Common Worship psalter: shipped (`172b3098`)
- Septuagint psalter: shipped (`e66b12e4`)
- Psalter page + per-liturgy preference: shipped

So the multi-version psalter infrastructure Phase 1 calls for ("architected for multi-version") is already there.

---

## 3. Techniques worth stealing

| # | Technique | Source | How to apply |
|---|---|---|---|
| 1 | **Square ↔ modern-notation toggle** | Source & Summit | Not Phase 1. But Phase 5 killer feature: users who can't read neumes still see 5-line staff. Cheap with Exsurge if we supply a parallel modern-notation renderer (or use MusicXML bridge). |
| 2 | **"Show chant marks" is a preference, not a mode** | Universalis | Already in design (DisplaySettings.chantNotation). Universalis validates the UX. |
| 3 | **Pre-rendered per-psalm SVG cache** | chantpsalter.com | For each (psalm × tone) pair, cache the first render to CDN. Only re-render on tradition/tone change. Saves 200KB Exsurge load for common cases. |
| 4 | **Tone-as-formula data, not sheet music** | St Meinrad "any tone fits any psalm" / Universalis Grail pointing | Already in design (`PsalmTone` reference data). The "apply any tone to any psalm" UX should be a first-class feature — a dropdown above each psalm, not buried in settings. |
| 5 | **Cantus ID cross-reference** | Cantus Index federated search | For every Latin chant we render (Marian antiphons, hymns), store a `cantusId` field. Link-out button: "see 47 manuscripts in Cantus Database." Free scholarly credibility. |
| 6 | **MIDI files as fallback audition** | anglicanchant.nl | If WebAudio synth is unavailable/off, emit a MIDI blob the user can download. Trivial once `PsalmTone.playback` data exists. |
| 7 | **Click-to-correct pointing UI** | Neon neume editor | For the `/chant-pointing` skill: the eventual GUI (non-agentic) should let users click a word to cycle through accent positions. Very feasible on top of the existing `PsalmPointing` schema. |
| 8 | **PDF fallback per-psalm per-tone** | Chabanel, anglicanmusicresources.org | For Coverdale users who want to print a psalm pointed for Sunday, generate a one-shot PDF server-side. Cheap via Gregorio+LaTeX batch, already our data. |
| 9 | **"Radio mode" audio** | Neumz | Free tier plays recordings of the whole daily office cycle. Out of scope for Phase 1–3 but think about canticasacra.org link-out in Phase 5 as the equivalent. |
| 10 | **Multiple tradition sources cascading** | Venite's own design decision #9 + PsalmToneAssignment | Confirmed as prior-art-correct — no one else has solved the "St Dunstan vs Plainsong Psalter disagree about which tone for Ps 23" problem. Opportunity to ship a settled cascade and let users choose. |

---

## 4. Traps to avoid

| # | Trap | Seen at | Why it kills a product |
|---|---|---|---|
| 1 | **Building a custom SVG score engine** | Venite `chant/dist/notation/` (already pivoted away from) | Exsurge is ~200KB and does 95% of what any hand-rolled engine does. Cam already learned this. |
| 2 | **Shipping "launching soon" forever** | plainsong.org | Pick Phase 1 and ship it, even if thin. Ps 23 + Ps 95 pointed is enough for launch. |
| 3 | **Recording audio first, notation second** | Mission St Clare, Neumz | Audio is expensive to produce and impossible to regenerate for text-variants (inclusive psalter, ESV). Synth-first scales. |
| 4 | **Pre-rendering everything as images** | Chabanel, CPDL | OK for archival content; terrible for a live app that needs per-user tradition preference, transposition, and pointing corrections. |
| 5 | **Depending on non-derivative licensed content** | St Meinrad (CC-BY-NC-ND) | Looks free, isn't re-renderable. Vet every source's license before ingest. |
| 6 | **Binding to `frmatthew/exsurge` upstream** | npm exsurge 0.x | Original repo is dormant. Pin to `bbloomf/exsurge` at a known SHA + document re-pin process. Design decision #17 already acknowledges this. |
| 7 | **Ignoring accessibility of pointing marks** | Every psalter app | CSS-only accents disappear for screen readers. Use Unicode + aria. |
| 8 | **Over-fitting to one tradition's tone table** | (implicit in St Dunstan-only or Plainsong-Psalter-only products) | Different traditions disagree. `PsalmToneAssignment.source` was designed for this — don't hardcode St Dunstan as "the" answer. |
| 9 | **Treating hymns and psalms as one rendering pipeline** | (nobody does this well) | Through-composed hymns ≠ formula-driven psalms. Two component modes (`ldf-chant-notation` for stored GABC; `generate-gabc.ts` for psalms) is correct. Keep them separate. |
| 10 | **Assuming users can read square notes** | Neumz default UX | Most Anglican users cannot. The text-pointing overlay + "Hear the tone" button has to carry the UX for the square-note-illiterate. This is in design decision #8 — protect it. |

---

## 5. Venite's prior chant history (the short version)

- **Git log: nothing merged.** Only `30661aeb` (the design doc itself) mentions chant.
- **Working tree: substantial prior work.** `/chant/dist/` contains a compiled `@venite/chant` module with pointing + syllabification + tones 1–8 + peregrinus + custom SVG layout + Zod validation. Built around Feb 15–22, 2026. This module was **never committed**, and the `CHANT_DESIGN.md` (April 22, 2026) supersedes it by switching notation back-end from custom to Exsurge and slightly simplifying the tone ID scheme.
- **Live `www.venite.app`:** no public chant features. App Store/Play listing does not mention pointing, notation, or plainsong.
- **Adjacent shipped features:** multi-version psalter (Coverdale / BCP 1979 / Inclusive / Common Worship / Septuagint), Latin Marian antiphons (text-only), per-liturgy psalter preference. Infrastructure is ready for chant overlay.
- **Resources directory:** St Dunstan's full PDF set (`resources/St dunstan/*`) and `resources/The Plainsong Psalter.pdf` are already checked in (commit `65a3f44b`, April 16, 2026). Transcription pipeline is the bottleneck, not input material.
- **Takeaway:** this is iteration 2 of a paused effort. The Feb 2026 effort went deeper on tone schema (differentiae, fixed mediation-termination pairs) than the current design doc. Phase 1 implementation should cherry-pick the Feb schema work.

---

## 6. Licensing matrix — corpus sources

| Source | URL | License | Content | Fetchable format | Alive 2026? |
|---|---|---|---|---|---|
| **GregoBase** | gregobase.selapa.net | **CC0** | ~14,000 Latin chants in GABC | `.gabc` + PDF + EPS + PNG per chant; bulk via `bacor/gregobasecorpus` tarball | **Yes, active** |
| **GregoBaseCorpus (bacor)** | github.com/bacor/gregobasecorpus | CC0 (data) + MIT (code) | Snapshot of GregoBase | CSV + GABC bundles | Data current to 2020; fine as seed |
| **St Dunstan's Plainsong Psalter** (Lancelot Andrewes Press) | andrewespress.com | **Copyrighted print** ($38.99). PDFs in `resources/` appear to be Cam's fair-use scans | Coverdale + Sarum tones + collects + lessons + Compline + Marian antiphons | PDF (manual transcription needed) | Press active, book in print |
| **The Plainsong Psalter (Litton)** | (`resources/The Plainsong Psalter.pdf`) | **Copyrighted print** — PDF in repo for reference only | Tone assignments for BCP 1979 | PDF | Reference-only per design |
| **Chabanel Psalms** | chabanelpsalms.org | Free distribution (not formally CC) — explicit "zero price, universal availability" commitment | English responsorial psalms w/ music | PDF + MP3 per psalm | Active (content frozen 2014) |
| **St Meinrad Psalm Tones** | saintmeinrad.org | **CC-BY-NC-ND 3.0** (no derivatives) | Modal psalm tones + audio | PDF + audio | Active |
| **CPDL / ChoralWiki** | cpdl.org | Per-work: CC-BY, CC-BY-SA, PD | Anglican chants, canticles, historical settings | PDF + MusicXML + Finale/Sibelius | Very active (54K works, Nov 2025) |
| **Cantus Database / Index** | cantusdatabase.org | Metadata CC-BY (varies) | Medieval manuscript chant metadata + Cantus IDs | JSON API, IIIF images | Active (2024–25 redevelopment) |
| **Anglican Chant Index** | anglicanchant.nl | Free use (attribution expected) | 20,000+ Anglican double-chants, MIDI | MIDI per chant | Active |
| **anglicanmusicresources.org** | anglicanmusicresources.org | Free download, proprietary per-setting | New Coverdale Psalter pointed (3 styles × 3 years) | MS Word .doc | Active |
| **canticasacra.org** | canticasacra.org | Free listening | Audio recordings of St Dunstan's Psalter | MP3 (via site) | Actively recording |
| **Mundelein Psalter** | usml.edu/mundelein-seminary/music | Book is copyrighted; tones themselves are published free (Fr Weber) | Grail psalm tones + audio | PDF + MP3 | Active; book in print |
| **Neumz content** | neumz.com | **Proprietary / Solesmes** — not reusable | Recordings of Jouques community | MP3 (app only) | Active, subscription |
| **Source & Summit content** | sourceandsummit.com | **Proprietary / subscription** | Catholic mass + office + hymns | Web+PDF (subscription) | Active |

---

## 7. Recommended corpus strategy

### Phase 1 (tone library + pointing + text overlay)
**Ingest nothing external yet.** Type the 9 Sarum tones by hand from St Dunstan's `table of Sarum tones.pdf` (already in `resources/`). The whole tone library is maybe 500 lines of JSON. This is exactly what the existing `chant/dist/tones/tone-1…tone-p` already did — **cherry-pick those 9 JSON files**, port to new kebab-case ID scheme, done.

### Phase 2 (Exsurge + audition)
Still no external corpus ingest. Exsurge library itself is the only external dep. Pin to `bbloomf/exsurge` SHA.

### Phase 3 (through-composed GABC)
**This is the first external ingest. Scope ruthlessly:**

1. **GregoBase CC0 chants** — import only the specific chants we need, not the 14,000. Target list:
   - 5 Marian antiphons (Alma Redemptoris, Ave Regina, Regina caeli, Salve Regina, Sub tuum praesidium) — Latin, simple + solemn forms
   - 1 Te lucis ante terminum + 5 seasonal Compline hymn variants
   - 1 set of ferial + festal collect tones
   - 1 set of lesson tones
   - = ~15 chants total. Pull by name from GregoBase via its existing API; stash the `.gabc` text in `commonprayer/src/chant/corpus/`. Attribute back to GregoBase per CC0 courtesy.

2. **`bacor/gregobasecorpus` snapshot** — use as the *index* for looking things up by name, but don't re-host the full corpus. It's stale (2020) but stable enough for name→GABC mapping.

### Phase 4 (seasonal tone engine)
Content source: **St Dunstan's PDFs (already in repo) transcribed manually.** Plus Cam's own tone-assignment spreadsheet (per resources/CHANT_DESIGN.md). No new external corpus needed.

### Phase 5 (expansion)
**Evaluate but probably don't ingest:**
- **St Meinrad** — CC-BY-NC-ND, can link out only. *Don't ingest.*
- **Chabanel** — free but English responsorial tradition mismatches Anglican BCP use. *Link out for Catholic-compatible parishes.*
- **anglicanmusicresources.org** — Coverdale pointings in .doc. Potential scraping target if licensing clarifies. *Ask first.*
- **canticasacra.org recordings** — audio only, link-out (as design already specifies).
- **CPDL Anglican chants** — 1,000s of double-chants; big potential for optional "change to Anglican chant for this psalm" feature. *Phase 6+ territory.*
- **Cantus Index IDs** — enrich existing corpus with cross-reference links. Cheap metadata win. *Phase 5.*

### Hard no (for content licensing reasons)
- Neumz recordings
- Source & Summit anything
- St Meinrad derivatives (link-out fine, no re-render)
- Litton Plainsong Psalter (copyrighted; reference only as design specifies)

---

## Sources

- [GitHub: DivinumOfficium/divinum-officium Issue #1375](https://github.com/DivinumOfficium/divinum-officium/issues/1375)
- [iBreviary on Google Play](https://play.google.com/store/apps/details?id=com.netguru.ibreviary)
- [Neumz – Gregorian Chant](https://neumz.com/)
- [GregoBase](https://gregobase.selapa.net/)
- [GregoBaseCorpus on GitHub (bacor)](https://github.com/bacor/gregobasecorpus)
- [Chabanel Psalms](https://www.chabanelpsalms.org/)
- [Source & Summit](https://www.sourceandsummit.com/)
- [Source & Summit Digital Platform docs](https://help.sourceandsummit.com/docs/digital-platform-introduction)
- [St Meinrad Archabbey Liturgical Music](https://www.saintmeinrad.org/the-monastery/liturgical-music/)
- [St Meinrad Psalm Tones PDF](https://www.saintmeinrad.edu/media/1478/meinrad_psalm_tones.pdf)
- [Exsurge (original) on GitHub](https://github.com/frmatthew/exsurge)
- [Exsurge (bbloomf fork) on GitHub](https://github.com/bbloomf/exsurge)
- [jgabc on GitHub](https://github.com/bbloomf/jgabc)
- [jgabc Psalm Tone Tool](https://bbloomf.github.io/jgabc/psalmtone.html)
- [Gregorio project](https://gregorio-project.github.io/)
- [Verovio](https://www.verovio.org/)
- [DDMAL Neon](https://github.com/DDMAL/Neon)
- [Cantus Index](https://cantusindex.org/)
- [Cantus Database](https://cantusdatabase.org/)
- [MEI Music Encoding Initiative](https://music-encoding.org/)
- [MEI Neumes guidelines](https://music-encoding.org/guidelines/v5/content/neumes.html)
- [OMR Plainchant MEI project](https://music-encoding.org/projects/omr-plainchant.html)
- [CPDL / ChoralWiki](https://www.cpdl.org/)
- [dailyoffice2019 on GitHub](https://github.com/blocher/dailyoffice2019)
- [The Daily Office app](https://dailyoffice.app/)
- [Mission of St Clare](https://www.missionstclare.com/)
- [Chant Psalter](https://chantpsalter.com/)
- [Anglican Chant Index](https://www.anglicanchant.nl/)
- [Universalis blog – Chanting the Psalms](https://blog.universalis.com/2018/07/19/chanting-the-psalms/)
- [The Liturgical Psalter, Plainsong Edition](https://www.plainsong.org/)
- [Music Resources for Anglicans – Psalter](https://anglicanmusicresources.org/psalter/)
- [Saint Dunstan's Plainsong Psalter – Lancelot Andrewes Press](https://www.andrewespress.com/shop/p/product-6-yrdld-pcpw6-t3kp7-hlhnp)
- [Cantica Sacra – St Dunstan's Plainsong Psalter recordings](https://canticasacra.org/st-dunstans-plainsong-psalter/)
- [Square Note: Gregorian Chant App](https://squarenote.co/)
- [Chant Tools App](https://apps.apple.com/us/app/chant-tools/id1225329409)
- [Mundelein Psalter Psalm Tones – USML](https://usml.edu/mundelein-seminary/music/mundelein-psalter-psalm-tones/)
- [Hallow App features](https://hallow.com/features/)
- [Venite.app on App Store](https://apps.apple.com/us/app/venite-app/id1502034358)
- [Neon editor DDMAL page](https://ddmal.ca/software/neon/)
- [Neon2: Verovio-based square-notation editor paper](https://music-encoding.org/conference/abstracts/abstracts_mec2019/Neon2.pdf)
