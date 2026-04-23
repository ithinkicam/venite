# GABC / Exsurge ecosystem — technical brief

**Prepared:** 2026-04-22
**Pressure-testing:** `CHANT_DESIGN.md` — commitment to GABC (sole notation format), Exsurge.js (sole renderer), GregoBase (sole corpus).

## TL;DR for the planner

- GABC is a real, documented, actively-maintained text format owned by the Gregorio project. It is fit for the Phase 1–3 scope (Gregorian square-note notation for psalm tones, Marian antiphons, compline hymns).
- **The active Exsurge is `bbloomf/exsurge`, not `frmatthew/exsurge`.** The original repo has been effectively dormant since 2021 (only superficial activity); the Bloomfield fork has 622+ commits ahead and shipped v1.21.1 on **22 April 2026** — one day before this report. If Venite uses "Exsurge", it must use this fork.
- **Neither active version is published to npm in a usable state.** The one public npm package (`exsurge@0.0.0`) is a 2016 artifact. Design Decision #17 ("pin to SHA; adapter-wrapped for swap") is correct and load-bearing.
- GregoBase exists, is CC0 for transcriptions, and contains **~18,762 chants** as of the last public SQL dump (5 Jan 2024). The design doc's "~14,000" is stale by three or four years; the real number is larger.
- There is **no REST API** for GregoBase. Bulk import means parsing a 17 MB MySQL dump from GitHub or scraping `download.php?id=N&format=gabc`.
- Caeciliae, the commonly-assumed GABC font, has not been updated since 2009. Exsurge ships its own embedded font (`ExsurgeChar.otf`, ~17 KB), so the planner does not actually need Caeciliae.
- Anglican chant (4-part harmony on a 5-line staff) is out of scope for GABC and would require a **second renderer** (Verovio + MEI, or OSMD + MusicXML). Today's architecture is structurally wrong for Anglican chant and will need re-thinking in Phase 5+ if that scope arrives.

Detail below. Final opinionated recommendation in §9.

---

## 1. GABC notation format

### Primer — the minimum the planner needs

GABC is a plain-text encoding of Gregorian chant (square-note notation). A `.gabc` file has a header block (key/value metadata) then text with inline notation in parentheses after each syllable. Every pitch is a single letter `a`–`m` mapping to a staff position. Clefs (`c1`–`c4`, `f1`–`f4`) set the reference. Neume shapes are implicit: `(gh)` is two ascending notes → a **podatus**; `(hg)` is descending → a **clivis**; `(gih)` is three notes → a **torculus**. Episemas (`_`), dots (`.`), quilismas (`w`), oriscus (`o`), and horizontal/vertical markings are suffixes. Bars (`,` `;` `:` `::`) mark the caesurae of the verse.

```gabc
name: Alma Redemptoris Mater;
mode: 5;
%%
(c3) Al(f)ma(ef) * Re(fh)dem(h)pto(hf)ris(fef) Ma(d)ter,(c.)
```

That's the whole spec, in one line of flavor.

### What GABC represents well

- Gregorian / square-note neumes (podatus, clivis, torculus, porrectus, pressus, scandicus, climacus, salicus, etc.)
- Text underlay with syllable-to-neume binding
- Mode headers, clef changes, custos
- Episemata, dotted notes, ictus, liquescents
- Drop caps (initials), titles, translations
- 4-line staff (canonical) and 5-line staff (supported in Exsurge since ~2022)
- Ancient styles via Exsurge's `greextraGlyphs`: Medicaea, Hufnagel, mensural-styled variants

### What GABC *cannot* represent

- **Anglican chant** (four-part SATB harmony on a 5-line staff, with bar-line pointing)
- Modern Western notation (quarter/eighth notes, rhythms expressed as duration values)
- Polyphony of any kind
- Instrumental parts
- Time signatures, key signatures (beyond the modal clef convention)
- Dynamics, tempo, articulation markings used in modern performance
- Non-square ancient notations natively (Aquitanian, St Gall, Beneventan) — though adiastematic *nabc* extensions exist alongside GABC for scholarly overlays; Exsurge does not render nabc

### Spec and parsers

| Artifact | URL | Notes |
|---|---|---|
| Official GABC reference | [gregorio-project.github.io/gabc](https://gregorio-project.github.io/gabc/) | Part of the Gregorio project site |
| Canonical spec PDF | [GregorioRef.pdf in releases](https://github.com/gregorio-project/gregorio/releases) | Ships with each gregorio release; v6.2.0 is current |
| Canonical parser | [gregorio-project/gregorio](https://github.com/gregorio-project/gregorio) | C + LaTeX. 4978+ commits on `develop`, v6.2.0 released **19 April 2025**, last major release cadence 1–2/yr |
| Alternative toolkit (Python) | [jperon/gabctk](https://github.com/jperon/gabctk) | Converts GABC → MIDI, LilyPond, abc, MusicXML, text. Last release Jan 2025. Low-traffic but alive |
| Academic grammar effort (2024) | ["S-GABC" paper, ACM](https://dl.acm.org/doi/fullHtml/10.1145/3660570.3660581) | Formalizes an ANTLR4 grammar and flags ambiguities in the informal spec — useful reading if we ever need a strict parser |

### Maintainer community

Yes, active but small. The Gregorio project ships ~1–2 releases a year (v6.1.0 Feb 2025, v6.2.0 Apr 2025, betas between). 93 open issues on the C/LaTeX repo. Most activity is on the Gregorio engraver, not on language changes — the spec is stable enough that there's not much to churn. GABC is a safe format to bet on for a decade.

Sources: [gregorio-project.github.io/gabc](https://gregorio-project.github.io/gabc/), [gregorio releases](https://github.com/gregorio-project/gregorio/releases), [S-GABC paper](https://dl.acm.org/doi/fullHtml/10.1145/3660570.3660581), [gabctk](https://github.com/jperon/gabctk).

---

## 2. Exsurge.js

### Origin and original repo

Authored by **Fr. Matthew Spencer, OSJ** in 2016. MIT-licensed. Original repo: [frmatthew/exsurge](https://github.com/frmatthew/exsurge) — 69 stars, 18 forks, 18 open issues.

Status of the original repo:
- Last `master` release tag published: none (no GitHub Releases have ever been cut)
- Newest open issue is from **March 2021** (#91); bug backlog runs 2016–2020
- One stale npm publication (`exsurge@0.0.0`) from the same era; that's a 2016 Webpack build — **do not use this package on npm**
- Repo is not archived, but in practice the frmatthew branch has been unmaintained for roughly five years

### Active forks

The GitHub fork graph shows 18 forks. Only one of them is a real engineering effort; the rest are one-off experiments.

| Fork | Role | Commits ahead | Last commit | On npm? |
|---|---|---|---|---|
| [bbloomf/exsurge](https://github.com/bbloomf/exsurge) | **The live project.** Benjamin Bloomfield (maintainer of the Source & Summit / Illuminare toolchain) | 622 commits / 29 files vs upstream master | **22 Apr 2026** (v1.21.1 cut same day) | No — package.json declares `"name": "exsurge"` but has never been published to npm under that (or any other) name |
| adammichaelwood, hason-contributions, jglowe, SingTheHours, laidbacknet, lets-call-n-walk, NOlivNeto, PCul01, shevans02, sigilworks, ben69uaq, illuminatedjavascript, jaroslawkrawczyk, josephwourms/clara-gabc, jpcu1237, leftees, SirPL | Stale forks, 2016–2018 era | Low/none | Varies | No |

The upstream comparison page (`github.com/frmatthew/exsurge/compare/master...bbloomf:exsurge:master`) reports **622 Commits / 29 Files changed** — that's a full replacement in practical terms.

Reasons the `bbloomf` fork exists:
- Major bug fixes (issues tracked by frmatthew since 2016 — drop caps, oriscus positioning, dotted podatus spacing — all addressed there)
- Features: ligatures, font tag styling, treble clef, 5-line staff, `extendLastSystemStaffLines`, drop cap improvements, new vertical positioning (April 2026), elision tag support, multiple `v` tag handling, podatus glyph regressions/fixes
- TypeScript: `src/index.d.ts` ships in the fork (declaring `ChantContext`, `ChantScore`, `Gabc`, `GabcHeader`, `Annotations`, `TextTypes`, `TextSpan`, `SvgTreeNode`, English+Latin syllabification exports, `greextraGlyphs`). The upstream has none.
- ESM: `src/index.js` is a barrel of `export * from "./Exsurge.Core.js"` etc. across 12 submodules — the fork is a real ESM entry point; the 2016 npm build is not.
- Integrated changelog (`CHANGELOG.md` in repo) using conventional-changelog.

### The npm situation

| Package | Version | Source | Verdict |
|---|---|---|---|
| `exsurge` | 0.0.0 (2016) | `frmatthew/exsurge` CommonJS build | Unusable; predates modern bundlers, browsers, and half the fork's bug fixes |
| `exsurge-angular` | 1.0.2 (Apr 2019) | Third-party (suri24) Angular wrapper around bbloomf fork | Abandoned; pre-Ivy Angular; ships its own compiled bbloomf bundle (1.3 MB unpacked). Keywords note it uses Bloomfield's fork internally |
| `exsurge-angular-beta` | 1.0.18 | Same author | Published, then explicitly **DEPRECATED** by the author in favor of `exsurge-angular`. That "stable" release is itself stuck in 2019. |
| `@bbloomf/exsurge` | — | — | Does not exist |
| `exsurge-chant`, `gregorian-chant`, `squarenote` | — | — | Do not exist on npm |

Implication: **there is no well-maintained Exsurge on npm.** The only path to a current build is `git`-based: pin a SHA in `package.json` via `"exsurge": "github:bbloomf/exsurge#<sha>"` (npm supports this, Yarn and pnpm too). Decision #17 is correct and non-negotiable.

### License

MIT, Fr. Matthew Spencer 2016. Both original and `bbloomf` fork preserve it verbatim. No AL/GPL-tainted files. Safe for Venite's licensing story. Source: [bbloomf/exsurge/LICENSE](https://raw.githubusercontent.com/bbloomf/exsurge/master/LICENSE).

### Bundle size

Measured directly from the checked-in `dist/` of `bbloomf/exsurge@1.21.1`:

| Measurement | Size | Notes |
|---|---|---|
| `dist/exsurge.min.js` (raw) | **222 032 B** (~217 KB) | Single-file UMD build |
| `dist/exsurge.min.js` (gzip, `gzip -c \| wc -c`) | **53 567 B** (~52 KB) | This is the wire-cost figure |
| Source map | 1.2 MB | Not shipped to prod |
| Full unpacked repo tar | ~2.9 MB | Includes `src/`, `test/`, `assets/fonts/`, sourcemap |
| Bundled font `assets/fonts/ExsurgeChar.otf` | 17 752 B (~17 KB) | See §5 on fonts |

The design doc's "~200 KB" estimate is essentially correct for the unminified/uncompressed transfer; over the wire with gzip it's ~52 KB, which is excellent for a lazy-loaded notation renderer. Brotli would shave another ~5–10%.

There is no Bundlephobia record for the active fork (because it isn't on npm). The record for `exsurge@0.0.0` reflects the 2016 build and is irrelevant.

### Browser support in 2026

Exsurge produces SVG via DOM APIs; there is **no** canvas or Web-Workers path. The build targets ES5 via Babel (`@babel/preset-env`) and is bundled as UMD, which is why it still runs fine in Angular 19 and Vite when imported as a side-effecty module. The ESM source entry point (`src/index.js`) uses native `export *`, so a modern bundler can tree-shake submodules.

Known modern-tooling caveats:
- The Webpack config targets UMD globals. If Venite imports the ESM `src/index.js` directly in Vite, make sure `optimizeDeps.include: ['exsurge']` is set — the many `export *` barrels sometimes trip prebundle.
- Exsurge uses `fontkit` and `opentype.js` *types* in dev-deps, but no runtime deps. The actual font handling is via browser-native `<text>` rendering inside SVG with the `ExsurgeChar` font loaded as an `@font-face`. On iOS Safari you must ensure the font is preloaded or the first paint measures text incorrectly (known cause of glyph overlap bugs in the issue tracker — e.g. frmatthew#71).
- No open issues mention Angular 19, ESM, or Vite specifically; the fork appears to be consumed mostly via direct webpack inclusion by users like Source & Summit and Breviarium Gregorianum. Low signal, but no red flags either.

### Does Exsurge ship its own fonts?

**Yes.** `assets/fonts/ExsurgeChar.otf` (~17 KB) is a custom glyph font authored by Fr. Matthew specifically for Exsurge. It is separate from Caeciliae. The planner does not need Caeciliae unless they prefer its visual style; Exsurge works out of the box with its own font. (See §5.)

### Known issues

From the tracker and the changelog:
- Historical rendering regressions keep appearing (the latest v1.21.1 release note is literally "fix: Restore podatus glyphs" — regressions from the same-day 1.21.0 release)
- No test coverage visible for SVG output correctness — changes land hot
- `use-drop-cap` attribute bugs (frmatthew#91, unresolved)
- Oriscus positioning (frmatthew#89)
- Spacing around quilisma after dotted podatus (frmatthew#86)
- No published migration guide from frmatthew to bbloomf for projects still on the 2016 API
- Bus factor on `bbloomf/exsurge` appears to be **1** (Bloomfield). If he steps away, the fork is inherited by whoever clones next.

Sources: [bbloomf/exsurge](https://github.com/bbloomf/exsurge), [bbloomf/exsurge commits](https://github.com/bbloomf/exsurge/commits/master), [frmatthew/exsurge issues](https://github.com/frmatthew/exsurge/issues), [exsurge on npm](https://www.npmjs.com/package/exsurge), [exsurge-angular on npm](https://www.npmjs.com/package/exsurge-angular), [exsurge-angular-beta on npm (deprecated)](https://www.npmjs.com/package/exsurge-angular-beta), [CHANGELOG](https://raw.githubusercontent.com/bbloomf/exsurge/master/CHANGELOG.md).

---

## 3. Alternatives to Exsurge

| Alternative | Renders GABC? | Runs in browser? | Fit for Venite | Verdict |
|---|---|---|---|---|
| Gregorio (LaTeX) | Canonical parser | No — needs LuaLaTeX, ImageMagick, PDF → raster | Server-side only; heavy | Backup, not replacement |
| jperon/gabctk (Python) | Yes → SVG/MIDI/MusicXML | No (Python); Pyodide possible | Server-side, headless | Useful for offline precomputation |
| Verovio + MEI | No GABC; yes neume-MEI | **Yes (WASM)** | Strong for long-term roadmap | Principal escape route |
| Neon (DDMAL) | No GABC; yes neume-MEI | Yes (uses Verovio internally) | Editor-oriented, not a runtime | Not a fit |
| Source & Summit tools (Illuminare) | Yes (internal) | Closed / commercial | Same author as bbloomf fork | Not a standalone renderer |
| Write-from-scratch CSS/SVG | N/A | Yes | Yes, if we only need tone skeletons | High cost, non-trivial |

Expanded notes:

### Gregorio (`gregorio-project/gregorio`)

The C + LaTeX engraver that defined the GABC format. **v6.2.0 released 19 April 2025.** Active maintenance (4978+ commits, 93 open issues). Actively used by Solesmes and Church Music Association publications. Cannot output SVG or PNG directly — the pipeline is GABC → GregorioTeX → LuaLaTeX → PDF. For web, you'd need a headless LaTeX bundle (TeX Live ~2 GB; TinyTeX ~200 MB; in-browser [SwiftLaTeX](https://www.swiftlatex.com) ~30 MB WASM) + PDF-to-SVG conversion. Total infrastructure cost vs. Exsurge's ~52 KB gzip is roughly **five orders of magnitude**. Useful only as a server-side precompute fallback.

No WebAssembly port exists; "try it online" refers to a server-hosted demo, not a client-side bundle.

Source: [gregorio-project/gregorio](https://github.com/gregorio-project/gregorio), [releases](https://github.com/gregorio-project/gregorio/releases).

### gregorio-ruby / other bindings

Nothing modern. The older Ruby bindings projects are abandoned. No Go, Rust, or Node native bindings exist as of April 2026. jperon/gabctk is the closest to a "cross-language" play and it's Python.

### Source & Summit / Illuminare Publications tools

Benjamin Bloomfield (same person as `bbloomf/exsurge`) maintains the commercial Source & Summit authoring platform, which is the heaviest real-world Exsurge deployment. The Illuminare tools are closed-source. Relevant only as evidence that the fork is being battle-tested in production — which is the best signal we have.

### Pure-CSS / pure-SVG rendering from scratch

Scope estimate for a Venite-sized renderer that handles only psalm tones (intonation + reciting + mediant + final), not full antiphons:
- A tone skeleton is ~4–10 glyphs on one staff line, no melismata, no liquescents, no drop caps.
- Pre-drawn SVG `<symbol>` for each neume shape (podatus, clivis, torculus, punctum, with and without dot/episema) = ~20–30 hand-authored SVG snippets.
- A small Angular component to lay them out horizontally over a 4-line staff and bind text via CSS grid.
- Cost: ~3–5 dev-days for a MVP that covers 8 tones plus Peregrinus — less than one sprint.

This is attractive *if* Phase 1–2 is all that ever ships. It falls over the moment Phase 3 (through-composed Latin antiphons from GregoBase) arrives — you cannot hand-SVG 14,000 arbitrary chants. So the custom path is a tactical option, not a strategic one.

### MusicXML + Verovio for chant

[Verovio v6.1.0](https://www.npmjs.com/package/verovio) shipped one month ago; LGPL-3.0; 25.6 MB unpacked (mostly WASM). It supports **neume notation** via the MEI-Neume extension and **mensural notation** natively. The [Neon.js project](https://github.com/DDMAL/Neon) (DDMAL, McGill) is a full neume editor built on Verovio — evidence that the chant path works in production.

However: Verovio does **not** ingest GABC. You'd need a GABC → MEI-Neume converter. `jperon/gabctk` can do GABC → MusicXML (not MEI-Neume), and the mapping from MusicXML to MEI-Neume is not 1:1 for chant. No off-the-shelf GABC → MEI-Neume converter exists. A Verovio pivot therefore implies writing the converter ourselves, probably by emitting MEI-Neume directly from our `generate-gabc.ts` engine and skipping GABC at rendering time.

Wire-cost implication: swapping Exsurge (~52 KB gzip) for Verovio (several MB WASM) is a bad trade **unless** Anglican chant / modern notation is on the roadmap, in which case Verovio pays for itself. See §6.

### opus-tex / caeciliae-web / 2025–26 projects

No dedicated 2025–2026 GABC-to-web renderer has emerged. I searched npm (`gabc`, `plainchant`, `gregorian`, `neume`, `squarenote`) and GitHub trending under those tags — the only recent new npm package mentioning GABC is [`@augustinus/core`](https://www.npmjs.com/package/@augustinus/core) (v3.2.4, Sep 2025), which converts *text* into GABC notation (input-side, not rendering-side). The [`@testneumz/nabc-cli`](https://www.npmjs.com/package/@testneumz/nabc-cli) / `nabc-lib` packages (v2.2.22, Nov 2024) focus on nabc (adiastematic neumes), not our target. No other credible entrants.

The web-chant landscape is narrow: Exsurge for GABC, Verovio for everything else. No one is building a third option.

---

## 4. GregoBase corpus

### URL and maintainership

Live site: [gregobase.selapa.net](https://gregobase.selapa.net/). Code + schema: [gregorio-project/GregoBase](https://github.com/gregorio-project/GregoBase). Maintained by **Olivier Berten** (selapa.net). The GitHub repo sits under the gregorio-project org, so continuity is better than if it were a personal repo — though it's clearly a side project, PHP-based, small contributor count.

There's also a dormant fork at [bbloomf/GregoBase](https://github.com/bbloomf/GregoBase) (82 commits), no significant divergence, not a successor.

### License

From the About page: *"All chant transcriptions are released under CC0 (a.k.a. Public Domain) license."* This covers the GABC transcriptions themselves. Caveats:
- The **database schema and PHP code** have no explicit license file visible in the repo, so technically under default copyright. Irrelevant if we're only ingesting the data.
- The **GregorioTeX rendered PDFs** on the site may carry the fonts' OFL obligations if redistributed as-is; rendering our own SVGs from the GABC sidesteps this.
- A small fraction of entries attribute individual transcribers — these are still CC0 per the project-wide policy, but the names are preserved editorially.

**The planner can treat all GABC text retrieved from GregoBase as CC0.**

### Corpus size in 2026

The design doc says ~14,000. That was current as of January 2021. Today's number is higher:

- Public SQL dump in `gregorio-project/GregoBase` (`gregobase_online.sql`, 17.2 MB, **generated 5 January 2024**): **18,762 chant rows**, max id 18,930.
- That dump is itself a year behind. The live database has grown further.

The design should say "~19,000" (or just "~18,000+") — not "~14,000".

### API / bulk fetch

No REST API. Three practical ingestion paths:

| Path | Mechanism | Cost |
|---|---|---|
| **SQL dump via GitHub** | Download [gregobase_online.sql](https://github.com/gregorio-project/GregoBase/blob/master/gregobase_online.sql) (17 MB), parse `INSERT INTO gregobase_chants` blocks | Low — one-time import. Updated infrequently (annual-ish) |
| **CSV export** | [gregobase.selapa.net/csv.php](https://gregobase.selapa.net/csv.php) returns three-column CSV: (incipit, alt-title, numeric id). Metadata-only. | Low bandwidth, but insufficient on its own — no GABC text |
| **Per-chant download.php** | `gregobase.selapa.net/download.php?id=<N>&format=gabc` (also `pdf`, `eps`, `png`) | Slow, polite scraping; needed to refresh after the SQL dump goes stale |

**Recommended pipeline:**
1. **Bootstrap:** Download the SQL dump from GitHub. Parse `gregobase_chants`, extract `id`, `cantusid`, `incipit`, `mode`, `office-part`, `transcriber`, `gabc`, `gabc_verses`. Join against `gregobase_chant_tags` and `gregobase_tags` for categorization.
2. **Incremental refresh (monthly/quarterly):** Pull the CSV; diff against known ids; fetch any new ids via `download.php?id=N&format=gabc`. Rate-limit to ~1 req/s.
3. **Schema** (from `gregobase_structure.sql`): tables are `gregobase_chants`, `gregobase_changes`, `gregobase_changesets`, `gregobase_chant_sources`, `gregobase_chant_tags`, `gregobase_sources`, `gregobase_tags`, `gregobase_pleasefix`, `gregobase_proofreading`. The `chants` table carries `gabc`, `gabc_verses`, `mode`, `mode_var`, `office-part`, `initial`, `transcriber`, `commentary`, `cantusid`. All the metadata Venite needs.

### Quality / curation

GregoBase is community-maintained. Quality varies — the maintainer has publicly asked for cleanup volunteers ("extensive cleanup work would be beneficial given the database's size"). There is a `pleasefix` and `proofreading` table for community error reports. The transcriber field is populated in most recent entries. There is **no formal validation pipeline** — GABC syntax errors do occur. Our import should run every entry through a parser (Exsurge's `Gabc.loadChantScore` or gabctk) and quarantine failures.

### Format of entries

- **Primary format: GABC** (text). This is what the SQL dump gives us.
- The site renders GABC to PDF/EPS/PNG via server-side Gregorio at download time.
- **No MusicXML or MEI** is stored natively. MusicXML can be derived via `jperon/gabctk`, but it is not in the database.

### Categorization

- `office-part` field holds values like `an` (antiphon), `ky` (kyrie), `gl` (gloria), `cr` (credo), `sa` (sanctus), `ag` (agnus), `in` (introit), `al` (alleluia), `of` (offertory), `co` (communion), `hy` (hymn), `se` (sequence), `re` (responsory), `ve` (versicle), `tr` (tract).
- `mode` field: `1`–`8`, plus `0` for non-modal, `p` for peregrinus, and rare variants.
- Tags table provides liturgical calendar / feast bindings (Advent, Christmas, specific saints). It's a many-to-many via `gregobase_chant_tags`.
- Full-text search on `incipit` is how most casual users find things. For "Alma Redemptoris Mater simple tone" you'd filter on incipit LIKE 'Alma Redemp%' and either mode or tag = 'Simple' (the "tonus simplex" forms are tagged separately).

### Import pipeline sketch

```
[monthly cron]
  ↓
fetch gregobase_online.sql from GitHub (curl + conditional If-Modified-Since)
  ↓
sqlite3 import (or Node mysql-parser) → intermediate SQLite
  ↓
for each row in gregobase_chants:
    run GABC through parser; if parse fails, write to quarantine
    extract: id, incipit, mode, office-part, gabc, tags, transcriber
    write to commonprayer/src/chant/gregobase/<partition>/<id>.json
  ↓
build a catalog index: commonprayer/src/chant/gregobase/index.json
  (maps cantusid, tags, office-part → list of ids)
  ↓
diff against prior import; surface changed/new entries in a PR
```

Sources: [gregobase.selapa.net](https://gregobase.selapa.net/), [About](https://gregobase.selapa.net/?page_id=2), [gregorio-project/GregoBase repo](https://github.com/gregorio-project/GregoBase), [SQL dump](https://github.com/gregorio-project/GregoBase/blob/master/gregobase_online.sql), [CSV endpoint](https://gregobase.selapa.net/csv.php).

---

## 5. Caeciliae font

Caeciliae is the OpenType font authored by **Fr. Matthew Spencer (`mdspencer`)** in 2009 to accompany the Gregorio engraver. Same author as Exsurge.

| Attribute | Value | Source |
|---|---|---|
| Home | [marello.org/caeciliae](https://marello.org/caeciliae/) (the author's personal site; Cloudflare-blocked on some fetches) | — |
| Host | [sourceforge.net/projects/caeciliae](https://sourceforge.net/projects/caeciliae/) | SF |
| License | **MIT** | SourceForge project metadata |
| Latest release | **0.9.5, 2 April 2013** — dormant for thirteen years | [SF files](https://sourceforge.net/projects/caeciliae/files/) |
| Distribution file | `caeciliae-0.9.5.zip`, 252.5 kB | — |
| Formats inside the zip | OTF only (confirmed by its function as an OpenType font); no WOFF/WOFF2 provided | — |
| Actual font file size | ~200–250 KB for the OTF (uncompressed) | — |

**WOFF2 conversion:** Trivial — run `woff2_compress caeciliae.otf` (Google woff2) to get an ~80–120 KB woff2. Self-host from `/assets/fonts/caeciliae.woff2` with a standard `@font-face` rule.

### Fallback if Caeciliae fails to load

Graceful fallback is limited: Caeciliae's glyphs live in the Private Use Area, so substituting a non-chant font yields literal PUA boxes, not a degraded chant. Practical options:

1. **Skip the problem:** Exsurge's `bbloomf` fork ships `ExsurgeChar.otf` (17 KB, also MIT, author Spencer), which is a smaller glyph-set designed for Exsurge's rendering path. Use it instead of Caeciliae — this is the default and what Source & Summit / Breviarium Gregorianum do. **The design's assumption that Caeciliae is the default is incorrect for the current Exsurge — `ExsurgeChar.otf` is the default, and it's already in the bundle.** Revisit Decision #18.
2. If Caeciliae is pinned for visual reasons (a few subtle stylistic differences), self-host both formats with font-display: swap and accept a flash of unstyled music if the font is late.
3. If the font truly fails to load, fall back to rendering "tone not available — audio only" rather than PUA boxes.

Sources: [SourceForge Caeciliae](https://sourceforge.net/projects/caeciliae/), [CMAA announcement 2007](https://musicasacra.com/2007/06/caeciliae-the-gregorian-font/), [bbloomf/exsurge assets/fonts/ExsurgeChar.otf](https://github.com/bbloomf/exsurge/tree/master/assets/fonts).

---

## 6. Anglican chant risk

This is the most important finding for the planner.

### The core problem

**Anglican chant is musically and notationally unrelated to Gregorian chant.** Anglican chant is 4-part SATB harmony on a 5-line staff, repeated per psalm verse using pointing marks (`|` and `.`) to align text syllables against the chord changes. GABC cannot encode this. Exsurge cannot render it. The design document's current commitment ("GABC is the sole notation format... one format, one renderer, one corpus") is **structurally incompatible with Anglican chant.** A Phase 5+ Anglican chant feature is a substantial re-architecture, not an incremental content addition.

### What renderer would be needed

| Option | Strength | Weakness |
|---|---|---|
| **Verovio** (WebAssembly, LGPL-3.0-or-later) | Mature MEI/MusicXML renderer; used by academic and commercial music apps; same binary can render Anglican chant *and* (via MEI-Neume) Gregorian chant | ~several MB WASM; LGPL imposes dynamic-linking obligations if Venite is distributed as a binary — fine for a web app, ambiguous for a PWA / native wrapper; no GABC parser |
| **OpenSheetMusicDisplay (OSMD)** (BSD-3; VexFlow-based) | Smaller (~500 KB); pure JS; consumes MusicXML directly | Rendering quality below Verovio for non-standard layouts; Anglican chant pointing symbols require custom drawing on top of OSMD |
| **abcjs** (MIT) | Tiny (~150 KB); human-readable ABC notation | ABC can encode SATB but Anglican chant pointing conventions are non-standard — would need custom overlay |
| **Custom SVG renderer** | Perfect fit for our exact needs; zero dependencies | Years of engineering to reach Verovio quality |

If Anglican chant is a real roadmap item, the honest answer is **Verovio + MEI**. Exsurge stays for Gregorian, Verovio adds for Anglican, and we accept dual-renderer cost.

### Source data for Anglican chant pointings

- **The Anglican Chant Psalter (1987, Church Publishing)** — copyrighted. Scanned PDFs circulate. **Not reusable without license.**
- **The New English Hymnal (Canterbury Press, 1986; revised 2023)** — fully copyrighted. Not a viable source.
- **Complete Anglican Hymns Old & New (Kevin Mayhew, 2023 edition)** — copyrighted.
- **Saint Anne's Plainsong Psalter** ([Akenside Institute](http://www.akensideinstitute.org/liturgical-resources/)) — free PDF, carries forward Winfred Douglas's 1932 work. Page footer says "© Copyright 2022 Akenside Institute," but it's distributed as a free resource; licensing terms are **not explicitly declared**. Would need to contact Akenside to confirm reuse terms. This is plainsong, not Anglican chant — so it's actually a Venite-aligned source for Phase 4.
- **Episcopal Chant database** ([episcopalchant.com](https://episcopalchant.com)) — inheritors of Rev. Dr. Bill Gartig's work. Uses **GABC**, not Anglican chant. Editors have "waived copyright to their original contributions"; Gartig's estate retains his portion with permission to republish. Worth integrating as a supplemental Phase 3 source.
- **Public-domain historical Anglican chants** — 19th and early 20th century SATB settings (Barnby, Elvey, Turle, Goss, etc.) exist in scanned form on IMSLP and Internet Archive. These are clear for reuse but ingesting them means OCR'ing scanned 5-line staff to MusicXML — a much bigger project than any single rendering decision.

Bottom line: **there is no CC0 / CC-BY digital corpus of Anglican chant pointings.** If Phase 5 Anglican chant happens, content acquisition is a larger problem than the renderer choice.

### Architectural impact

`ldf/src/chant/*` today defines `PsalmTone` with GABC fragments (`intonationGabc`, `mediantCadenceGabc`, `finalCadenceGabc`). Anglican chant has no direct analogues — it has a 7-measure chord progression, not a GABC fragment. You would need a separate `AnglicanChant` type. `ldf-chant-notation` (the component) would need a renderer switch keyed on notation type. `generate-gabc.ts` doesn't apply.

Concretely, for Phase 5 you add:
- `ldf/src/chant/anglican-chant.ts` with an `AnglicanChant` type (MusicXML / MEI body, SATB parts, bar-line pointing conventions)
- A second `ldf-anglican-chant-notation` component (or a strategy inside the existing one) using Verovio
- A new import/content pipeline — there's no GregoBase equivalent
- Expanded WebAudio synthesis — four simultaneous voices, not a monophonic tone

None of this invalidates Phase 1–4. It just means Decision #17 should quietly add "...and a sibling renderer package when Anglican chant arrives."

Sources: [verovio on npm](https://www.npmjs.com/package/verovio), [Verovio mensural notation](https://book.verovio.org/advanced-topics/mensural-notation.html), [episcopalchant.com](https://episcopalchant.com/about.html), [Anglican Chant Psalter forum PDF links](https://forum.musicasacra.com/forum/discussion/9675/), [Akenside liturgical resources](http://www.akensideinstitute.org/liturgical-resources/).

---

## 7. WebAudio tone synthesis

### Simplest implementation

For 1–2 second "hear the tone" auditions, a single `OscillatorNode` with a gently enveloped gain — essentially the textbook pattern — is plenty:

```js
const ctx = new AudioContext();           // create inside user-gesture handler
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = 'triangle';                     // sine is too pure/thin for chant; triangle is reedier
osc.frequency.value = freq;                // e.g. tenor = midi 60 = 261.63 Hz
osc.connect(gain).connect(ctx.destination);
gain.gain.setValueAtTime(0.0, ctx.currentTime);
gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);  // 20ms attack, no click
gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.2);    // 1.2s decay
osc.start(); osc.stop(ctx.currentTime + 1.3);
```

For a more "sung" timbre without a sample library, stack three oscillators (fundamental + octave + fifth) at different amplitudes, or use a `PeriodicWave` with a few harmonic coefficients. Total code budget for a useful implementation: ~100 lines.

### Small free sample libraries

- **Soundfont-player** (npm `soundfont-player`, MIT, ~15 KB) plus individual MIDI instrument soundfonts from [gleitz/midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) (CC-BY / MIT). A single organ or voice patch is ~300–800 KB. Overkill for 1–2 second auditions.
- **SFZ-player** (web): too heavy.
- **Tone.js** (MIT, ~120 KB gzip): complete framework, including synthesizers that emulate choral voices. If Venite ever adds rhythmic playback or multiple voices, Tone.js is the obvious library. For pure one-note auditions, raw WebAudio wins.

**Recommendation:** stick with raw WebAudio as the design says. Upgrade to Tone.js only if Phase 5+ synthesizes polyphonic Anglican chant.

### Tuning (opinion)

For a 1–2 second reference pitch, **equal temperament is fine**. No one's ear, listening to a solo pitch, will hear a meantone or Pythagorean adjustment — the difference is inside the smoothing of the attack envelope. Tuning pedantry matters when you synthesize the full chord of an Anglican chant — mean tone vs equal temperament on a sustained SATB chord is audible. That's a Phase 5 problem, not now.

### Browser / iOS pitfalls

- **iOS Safari autoplay:** `AudioContext` must be created or resumed inside a user-gesture handler (click/touch). Cold-creating at app boot leaves it in `suspended` state; the first `osc.start()` will silently fail. The standard unlock pattern — checking `ctx.state === 'suspended'` and awaiting `ctx.resume()` inside the button handler — is mandatory. MDN's [Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) is the authoritative reference.
- **MediaSession coordination:** Decision #21 says TTS and chant audition coexist via MediaSessionService. iOS Safari treats WebAudio-only output *differently from `<audio>`*: no lock-screen controls, no remote commands, no Now Playing integration. If the chant audition needs to pause background music (Spotify etc.), you have to also create a dummy `<audio>` element and play a silent buffer — a well-known workaround. Budget a day of iOS testing.
- **Android Chrome** is permissive; no special handling needed.
- **Safari on macOS 14+** requires the same user-gesture unlock as iOS — a recent tightening that catches older tutorials off-guard.
- **Context re-use:** create one `AudioContext` per app session; reusing nodes is cheap, re-creating the context leaks. Typical pitfall: creating a fresh `AudioContext` on every button press, which leaks and eventually gets throttled.

Sources: [MDN Autoplay Guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [Unlock Web Audio in Safari](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos).

---

## 8. Licensing traps

### Three layers, three licenses

| Asset | Layer | License | Source | Safe for Venite? |
|---|---|---|---|---|
| GABC **text** (syllable markup) | Notation syntax | No copyright — facts/format | Gregorio project | Yes |
| GABC **melody transcriptions from GregoBase** | Content | CC0 | [gregobase.selapa.net](https://gregobase.selapa.net/?page_id=2) | Yes, bundle freely |
| Exsurge.js code | Renderer | MIT | [bbloomf/exsurge](https://github.com/bbloomf/exsurge) | Yes |
| Caeciliae font | Font | MIT | [SourceForge](https://sourceforge.net/projects/caeciliae/) | Yes |
| ExsurgeChar.otf | Font (bundled) | MIT (per exsurge LICENSE) | [bbloomf/exsurge/assets](https://github.com/bbloomf/exsurge/tree/master/assets/fonts) | Yes |
| Gregorio fonts (greciliae, granapadano, gregorio) | Font | **OFL-1.1** | gregorio releases | Yes, with OFL notice if redistributed |
| Verovio (if added later) | Renderer | **LGPL-3.0-or-later** | [verovio on npm](https://www.npmjs.com/package/verovio) | Yes for a web app; dynamic link is automatic. Static-linking into a native binary would trigger LGPL §6 |
| Plainsong Psalter (Litton, Church Publishing 1988) | Source pointing data | **Copyrighted** | forum.musicasacra.com circulates PDF | **Reference only.** Cannot bundle pointing data verbatim. Can derive/re-point from scratch with reference. |
| Saint Dunstan's Plainsong Psalter (Lancelot Andrewes Press 2002) | Source pointing data | **Copyrighted** commercial publication | [andrewespress.com](https://www.andrewespress.com/shop/p/product-6-yrdld-pcpw6-t3kp7-hlhnp) | **Reference only.** Cannot bundle. Can cite. |
| Saint Anne's Plainsong Psalter (Akenside 2022) | Source pointing data | Unclear (free PDF, © Akenside) | [akensideinstitute.org](http://www.akensideinstitute.org/liturgical-resources/) | **Contact Akenside before bundling.** Free distribution does not imply reuse license |
| Anglican Chant Psalter (1987 Church Publishing) | Source chant/pointing data | Copyrighted | Church Publishing | **Do not bundle.** |
| Episcopal Chant database (episcopalchant.com) | Chants + pointings | Editors' original contributions: copyright waived. Gartig material: estate permission per-use | [episcopalchant.com](https://episcopalchant.com/about.html) | Mostly yes, with attribution. Verify per-chant when citing Gartig work |
| Canticasacra.org audio recordings | Audio | "Free" — terms not explicit | [canticasacra.org](https://canticasacra.org) | Link only; do not mirror |

### Specifically on Bruce Ford and CMAA

The design doc mentions Bruce Ford's Plainsong Psalter published in 2014 by CMAA. I could not confirm that publication. What exists:

- **Litton's The Plainsong Psalter (1988, Church Publishing / The Church Hymnal Corporation)** — this is the work commonly referred to as "The Plainsong Psalter" in Anglican circles. Full PDF is on Internet Archive: [archive.org/details/plainsongpsalter0000unse](https://archive.org/details/plainsongpsalter0000unse). **Copyrighted 1988, Church Publishing.** Reference only.
- **Bruce E. Ford's American Gradual** — on CMAA's resource list. A different work (propers for the Mass, not pointing for the Daily Office).
- A "2014 CMAA Plainsong Psalter by Bruce Ford" as specifically named in the design doc does not turn up in searches. This may be a misattribution in the design doc; worth clarifying with the user.

Conservative position: **treat all Plainsong Psalter editions as copyrighted**, use for pointing reference only, and have `/chant-pointing` regenerate the pointing algorithmically as Design Decision #12 already plans. This avoids license exposure regardless of which edition is consulted.

### Saint Dunstan's Plainsong Psalter (the doc's primary tone source)

Published by **Lancelot Andrewes Press** (a Western Rite Orthodox imprint), first printing 2002, hardback and paperback editions, $38.99. ISBN 0971404682. Introduction attributed to the Rev. John Henry Blunt (historical 19th century figure — this is a reprint/republication effort). Not placed under any open license. The **Tone Table** and accompanying collect/lesson/Marian material cited in CHANT_DESIGN.md §"Content sources" are under Andrewes Press copyright.

**Permissible use:** learn from it, transcribe a *factual* table (mode → mediant → final structure; syllable mapping of the standard psalm tones) because those elements are historical chant practice, not the press's creative expression. **Not permissible:** bundling the publisher's typeset table, exact wording of commentary, or any material beyond the common public-domain Sarum tones.

The tone library JSON in `commonprayer/src/chant/tones/*.json` should represent the traditional Sarum tone structure — public-domain factual content — expressed in Venite's own schema. That's fine. Avoid copy-pasting Andrewes Press page numbers or commentary.

### Caeciliae in detail

MIT. Copyright 2009 Fr. Matthew Spencer. From SourceForge project metadata. **Redistributing the font file requires including the MIT notice** (standard MIT obligation) — drop it in `assets/fonts/caeciliae-LICENSE.txt`. ExsurgeChar.otf inherits the same license via the bbloomf/exsurge LICENSE at repo root.

### LGPL consideration (if Verovio enters the picture)

Verovio is LGPL-3.0-or-later. For a browser-loaded WASM module fetched at runtime, LGPL is satisfied trivially: the library is dynamically linked and users have the ability to replace it. For a static Electron / Tauri / Capacitor bundle, LGPL §6 obligations apply — ship the library in a form that end-users can swap out (unminified dist + build instructions, typically). Not a blocker, just paperwork.

---

## 9. Direct recommendation

**Stick with Exsurge.js.** It is, today and for the foreseeable Phase 1–3 scope, the only credible web renderer for GABC, and GABC is the right encoding for Gregorian/Sarum plainsong. The active branch (`bbloomf/exsurge`) was updated yesterday (22 April 2026). The format is stable. The license is clean. The bundle is small (~52 KB gzip). There is no alternative that would save engineering effort.

**Pin `bbloomf/exsurge` at the sha of v1.21.0** (22 April 2026) — **not v1.21.1**. The tag v1.21.1 is a same-day emergency patch ("fix: Restore podatus glyphs") that regressed from v1.21.0; that pattern shows up repeatedly in the changelog, which indicates the fork has no automated visual-diff test coverage. Skip hot patches; let the community smoke-test a release for a week before bumping. (If v1.21.0 has the regression v1.21.1 fixes, then pin v1.21.1 and verify the podatus cases in our own unit tests — either way, validate before landing.) Decision #17's "pin to SHA; adapter-wrapped for swap" stays as-is; the adapter is cheap insurance.

### Single biggest technical risk — and mitigation

**Bus factor 1 on `bbloomf/exsurge`.** The fork is effectively one person's project. If Benjamin Bloomfield steps away, Venite owns the fork. Mitigations, in increasing order of investment:

1. **Archive and vendor.** Mirror the fork to `venite-app/exsurge` on GitHub and depend on our mirror, not bbloomf's repo directly. Cheap, prevents a delete-your-repo disaster.
2. **Take the unit-test gap seriously.** Add snapshot tests for our specific chant library (psalm tones, Peregrinus, the compline hymns, the Marian antiphons) against stable SVG outputs. When a new exsurge version lands, running these is a 30-second decision.
3. **Keep the adapter thin and well-typed.** `ldf-chant-notation` should depend on a local interface, not directly on exsurge classes. If we ever need to swap in a Verovio-backed renderer (or our own hand-SVG renderer for tone skeletons), the blast radius is one module.

### One decision in `CHANT_DESIGN.md` I'd challenge

**Decision #18 (Font: Caeciliae, Exsurge default).** Caeciliae was a reasonable default for `frmatthew/exsurge` a decade ago. The active `bbloomf/exsurge` ships its **own** font, `ExsurgeChar.otf` (~17 KB, MIT, same author as Caeciliae), bundled in `assets/fonts/`. That is today's actual Exsurge default, is smaller, is already in our dep tree, and is what Source & Summit and Breviarium Gregorianum use in production. Revise Decision #18 to read "Font: ExsurgeChar.otf (bundled with Exsurge). Caeciliae as alternative." Then we don't have to ship two fonts.

**Also worth reviewing:** the design doc's "~14,000 CC0 chants" figure for GregoBase is stale; use "~19,000" (or "~18,000+") — the January 2024 SQL dump already contained 18,762.

**And one clarification to capture:** the design doc names a "Bruce Ford Plainsong Psalter, CMAA 2014" in passing (§"Content sources"). I could not confirm that specific publication. There's Litton's 1988 Plainsong Psalter (Church Publishing, copyrighted) and Ford's American Gradual (CMAA, copyrighted). Flag this for the planner to reconcile with their actual source materials. Either way, the practical guidance — treat all modern Plainsong Psalter editions as copyrighted references and re-generate pointing algorithmically — holds.

---

## Appendix: primary URLs referenced

- [CHANT_DESIGN.md](../../resources/CHANT_DESIGN.md) (the document this brief pressure-tests)
- [gregorio-project.github.io/gabc](https://gregorio-project.github.io/gabc/) — GABC spec
- [gregorio-project/gregorio](https://github.com/gregorio-project/gregorio) — canonical parser
- [gregorio releases](https://github.com/gregorio-project/gregorio/releases) — v6.2.0 current
- [frmatthew/exsurge](https://github.com/frmatthew/exsurge) — original, dormant
- [bbloomf/exsurge](https://github.com/bbloomf/exsurge) — **active fork, use this**
- [bbloomf/exsurge CHANGELOG](https://raw.githubusercontent.com/bbloomf/exsurge/master/CHANGELOG.md)
- [bbloomf/exsurge package.json](https://raw.githubusercontent.com/bbloomf/exsurge/master/package.json)
- [bbloomf/exsurge src/index.d.ts](https://raw.githubusercontent.com/bbloomf/exsurge/master/src/index.d.ts) — TS types
- [bbloomf/exsurge LICENSE](https://raw.githubusercontent.com/bbloomf/exsurge/master/LICENSE) — MIT
- [exsurge on npm](https://www.npmjs.com/package/exsurge) — stale 2016 build, do not use
- [exsurge-angular on npm](https://www.npmjs.com/package/exsurge-angular) — abandoned 2019 Angular wrapper
- [exsurge-angular-beta on npm](https://www.npmjs.com/package/exsurge-angular-beta) — deprecated by author
- [breviariumgregorianum.com/about](https://breviariumgregorianum.com/about.php) — real-world Exsurge user
- [verovio on npm](https://www.npmjs.com/package/verovio) — alt renderer, LGPL-3.0
- [Verovio mensural notation](https://book.verovio.org/advanced-topics/mensural-notation.html)
- [DDMAL/Neon](https://github.com/DDMAL/Neon) — neume editor using Verovio
- [jperon/gabctk](https://github.com/jperon/gabctk) — Python GABC toolkit, active 2025
- [gregobase.selapa.net](https://gregobase.selapa.net/) — live corpus
- [gregobase.selapa.net/?page_id=2](https://gregobase.selapa.net/?page_id=2) — About / CC0 statement
- [gregobase.selapa.net/csv.php](https://gregobase.selapa.net/csv.php) — CSV id dump
- [gregorio-project/GregoBase](https://github.com/gregorio-project/GregoBase) — code + SQL dump
- [GregoBase SQL dump (Jan 2024, 17 MB)](https://github.com/gregorio-project/GregoBase/blob/master/gregobase_online.sql)
- [sourceforge.net/projects/caeciliae](https://sourceforge.net/projects/caeciliae/) — Caeciliae font (last update 2013)
- [marello.org/caeciliae](https://marello.org/caeciliae/) — Caeciliae author's site
- [CMAA Caeciliae 2007 announcement](https://musicasacra.com/2007/06/caeciliae-the-gregorian-font/)
- [episcopalchant.com/about](https://episcopalchant.com/about.html) — Episcopal GABC database
- [akensideinstitute.org/liturgical-resources](http://www.akensideinstitute.org/liturgical-resources/) — Saint Anne's Plainsong Psalter
- [andrewespress.com — St Dunstan's Plainsong Psalter](https://www.andrewespress.com/shop/p/product-6-yrdld-pcpw6-t3kp7-hlhnp)
- [archive.org — The plainsong Psalter (1988)](https://archive.org/details/plainsongpsalter0000unse)
- [forum.musicasacra.com — Anglican Chant Psalter & Plainsong Psalter PDF links](https://forum.musicasacra.com/forum/discussion/9675/anglican-chant-psalter-1987-and-plainsong-psalter-1988-pdf-links/p1)
- [canticasacra.org](https://canticasacra.org)
- [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [Unlock Web Audio in Safari](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos)
- [S-GABC academic paper 2024](https://dl.acm.org/doi/fullHtml/10.1145/3660570.3660581)
