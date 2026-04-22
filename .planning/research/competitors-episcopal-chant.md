# Competitor dossier — episcopalchant.com

Research date: 2026-04-21. All URLs live at time of writing.

---

## TL;DR

episcopalchant.com is the closest analogue to Venite's planned chant feature we have found, and it validates nearly every core technical decision in `CHANT_DESIGN.md`. They ship **Exsurge.js + Tone.js + Hypher + GABC-in-hidden-div** — the exact stack Venite is planning, minus Hypher. They are **plainsong only, no Anglican chant**, and their stated editorial philosophy explicitly places them in the "Prayer Book Catholic / Gregorian" tradition. Their playback UX (tempo, transpose, step-forward, pitch display) is substantially richer than Venite's current "hear the tone" plan, and several of their data/tooling choices (bbloomf's `psalmtone.js`, `jgabc` corpus under the Unlicense) are directly importable. The biggest gap vs. Venite is that **episcopalchant.com does not cover Morning Prayer, Evening Prayer, or Noonday Prayer** — only Compline and the Great Litany from the Daily Office — and has **no calendar/"today" integration**. That is precisely Venite's existing strength.

Headline risks we did NOT find: no evidence that Episcopal users expect Anglican chant (4-part harmony) alongside plainsong on this type of site. Their FAQ explicitly sidesteps it by citing Altar Book copyright, not user demand.

---

## 1. Product surface

| Attribute | Finding | Source |
|---|---|---|
| Pitch | "Liturgical texts, ready to chant… We make it easy, so anyone can learn to chant the service." | https://episcopalchant.com/ |
| Audience | Episcopal clergy, lay leaders, cantors, choir directors; learners ("anyone can learn to chant") | https://episcopalchant.com/about.html |
| Tradition (prayer book) | **BCP 1979** exclusively; RCL lectionary; Book of Occasional Services; Enriching Our Worship 1 | https://episcopalchant.com/ |
| Musical tradition | **Plainsong / Gregorian only.** Self-described "Prayer Book Catholic tradition." No Anglican chant, no Coverdale/Grail distinction surfaced. | https://episcopalchant.com/about.html |
| Psalter version | **NRSV** (since Bruce Ford's *Gradual Psalms* was commissioned by Church Publishing for RCL, which uses NRSV). Coverdale/BCP psalter NOT on site — explicitly because Altar Book is not public domain. | https://episcopalchant.com/about.html , https://episcopalchant.com/gradual_psalms_ford.html |
| Origin / lineage | Built on Fr. Bill Gartig's (1952–2018+) *One Man's Offering*; rehosted and expanded by two unnamed editors (the "co-editors"). | https://episcopalchant.com/about.html |
| Funding / business model | None visible. No donate button, no ads, no paywall. "Made with love by Episcopalians; not an official publication of The Episcopal Church." | https://episcopalchant.com/ |
| Copyright | Editors place their work in public domain ("waived all copyright and related or neighboring rights"). Gartig's files remain his property, rehosted. | https://episcopalchant.com/about.html |

---

## 2. Content coverage

### 2.1 Daily Office

**Only Compline and the Great Litany.** Morning Prayer, Evening Prayer, and Noonday Prayer are **not present** on the Daily Office page.

| Office | Coverage | Source |
|---|---|---|
| Morning Prayer | None | https://episcopalchant.com/daily_office.html |
| Noonday Prayer | None | https://episcopalchant.com/daily_office.html |
| Evening Prayer | None | https://episcopalchant.com/daily_office.html |
| **Compline** | Beginning, Psalms (4 interactive + 31/91/134 PDF + Gloria), 4 Little Chapter readings, 2 Responsories, Kyrie, Lord's Prayer, 4 Collects, Nunc Dimittis with antiphon, Benedicamus closing | https://episcopalchant.com/daily_office.html |
| **Great Litany** | Full PDF, 6pp, Gregorian notation | https://episcopalchant.com/assets/pdf/daily_office/Great%20Litany%20(Gregorian%20notation%2C%206%20pages)%20110312.pdf |

Compline subpages with interactive playback:
- https://episcopalchant.com/daily_office/compline/beginning.html
- https://episcopalchant.com/daily_office/compline/psalm_4.html
- https://episcopalchant.com/daily_office/compline/nunc_dimittis.html
- https://episcopalchant.com/daily_office/compline/responsory_1.html (and _2)
- https://episcopalchant.com/daily_office/compline/gloria_psalm.html

### 2.2 Canticles

| Canticle | Coverage on episcopalchant.com |
|---|---|
| Te Deum | Not found |
| Benedictus | Not found (needed for MP, which is absent) |
| Magnificat | Not found (needed for EP, which is absent) |
| **Nunc Dimittis** | Yes (Compline) — interactive |
| Venite | Not found |
| Jubilate | Not found |
| Phos Hilaron | Not found |
| Canticles 2, 9, 13 | Referenced as Ford settings (in Vigil on Eve of Baptism) as PDFs | https://episcopalchant.com/other_pastoral_services.html |

### 2.3 Eucharist — the deepest content

| Section | Coverage | Format |
|---|---|---|
| Prayer A / B / C / D (BCP 1979 Rite II) | Chanted-throughout, simple tone | PDF + some interactive |
| Prayer II (Rite I) | Chanted-throughout, simple tone | PDF |
| Prayer D in **Mozarabic chant** | Through-set, full prayer | Interactive (pre- and post-Sanctus) |
| **Rite I in Rite II language** — Australian Use, English Use | Prefaces, preface conclusions, conclusions | Interactive |
| Enriching Our Worship 1 | Prefaces in solemn tone | PDF |

Source: https://episcopalchant.com/eucharist/eucharistic_prayers.html and e.g. https://episcopalchant.com/eucharist/eucharistic_prayers/prayer_d_pre_sanctus.html

### 2.4 Gradual Psalms (the flagship feature)

Bruce Ford's *Gradual Psalms*, commissioned by Church Publishing to update Richard Crocker's 1970s/80s RCL settings. PDFs only, organized by Year A/B/C × Liturgical Year / Holy Days / Common of Saints / Various Occasions / Other Services / Occasional Services.

- Index: https://episcopalchant.com/psalms/liturgical_year.html
- About Ford: https://episcopalchant.com/gradual_psalms_ford.html
- URL pattern: `/assets/pdf/ford_gradual_psalms/psalms_year_[a|b|c]/[Code].pdf`
- Example: https://episcopalchant.com/assets/pdf/ford_gradual_psalms/psalms_year_a/Adv1A.pdf (Advent 1A)

**Important limit**: these are gradual psalms for the Eucharist, not a full 150-psalm psalter. No Morning/Evening Prayer psalm cycle. No BCP 1979 psalter cycle. No Coverdale.

### 2.5 Readings

- **Epistles**: Full RCL cycle as PDFs. Pattern `/assets/pdf/epistles/Epistle_[Season]_[Number]_[Year].pdf`. Index: https://episcopalchant.com/epistles/liturgical_year.html
- **Gospels**: Same. Index: https://episcopalchant.com/gospels/liturgical_year.html
- An "Example: How to chant the Epistle" tutorial on the epistles index.
- Ferial/festal tone distinction: not explicitly surfaced in the index.

### 2.6 Hymns and Marian antiphons

- **No dedicated hymn section.** No hymnal shipped.
- **No Marian antiphons** discovered. This is fully consistent with their "liturgical texts approved by the Episcopal Church" scope — Marian antiphons are generally not in BCP 1979. Supports Venite's Decision 14 (Latin-only Marian antiphons, deferred English).

### 2.7 Seasonal / special

- Christmas: Proclamation of the Birth of Christ (interactive) + related
- Epiphany / Holy Week / After Pentecost: indexes
- Occasional Services: full vigils etc., chained together
- Other pastoral services

### 2.8 Other provinces

A page exists listing Anglican Church of Australia, Canada, Kenya — surfaces resources from other BCPs, but not deep content. https://episcopalchant.com/other_provinces.html

### 2.9 Calendar / "today" integration

**None.** There is no "what's today" page. The Service Composer lets you select a service/year/track manually but does not auto-resolve today's date. Source: https://episcopalchant.com/service_composer.html

---

## 3. Anglican chant vs plainsong

**Plainsong only.** Zero Anglican chant (4-part harmony, 5-line staff, SATB double/single chants).

Evidence:
- About page self-describes: "Gregorian/square-note chant" in "the Prayer Book Catholic tradition which is our heritage." https://episcopalchant.com/about.html
- All notation rendered via Exsurge.js is square-note on 4-line staff.
- FAQ deflects absence of Altar Book pointings on copyright grounds, but the *format* they would provide (if they could) is still plainsong.
- Bruce Ford's work is plainsong (English psalm tones, building on Canon Winfred Douglas's American Gradual).
- No Anglican-chant search on episcopalchant.com returned affirmative hits.

**Implication for Venite**: the closest comparable site in the Episcopal space made the same choice Venite made. This is strong prior art that "GABC-only / no Anglican chant" is a defensible scope for an Episcopal-facing product. Note: dedicated Anglican-chant sites do exist (anglican-chant-archive.org, etc.) — they are separate ecosystems with their own notation conventions and audience.

---

## 4. Notation approach

| Aspect | episcopalchant.com | Venite plan | Notes |
|---|---|---|---|
| Notation format | **GABC** | GABC | Same |
| Renderer | **Exsurge.js** (minified, self-hosted as `/js/exsurge.min.js`) | Exsurge.js (adapter-wrapped, lazy-loaded) | Same. Validates Decision 17. |
| Storage of GABC on page | Inline in a hidden `<div id="chantsource" style="display:none;">...</div>` | Same pattern likely | Very simple integration pattern |
| Output DOM target | `<div id="chant-preview">` replaced with SVG at runtime | `ldf-chant-notation` component | Same pattern |
| Staff lines | 4-line square note | 4-line square note | Same |
| Pointing marks in text | Italics on mediant-accent syllable, inside GABC source e.g. `<i>cause;</i>` | CSS overlay on verse text | **Differs**: they hard-code pointing into the GABC source; Venite plans algorithmic pointing + CSS overlay. See Section 10. |
| Explicit mediant/final/flex markers | Yes — `*` asterisk for mediant, `†` flex, `::` double bar for final — standard GABC | Same | Same |
| Font | Caeciliae (via Exsurge default); jgabc ships `Caeciliae-Staffless.ttf` and `Caeciliae-Staffless-print.ttf` variants | Caeciliae (Decision 18) | **Opportunity**: staffless Caeciliae variants exist. Relevant if Venite ever wants pointing-only text rendering that matches notation typography. |
| Static PDFs | Heavily used — most content is PDF-first, interactive pages are the minority | Not planned | **Opportunity**: PDF export is a clear user expectation in this space. `saveSvgAsPng.js` is loaded on every page. |

**Sample inline GABC** (from Compline Psalm 4):

```
(c4)An(g)swer(h) me(j) when(j) I(j) call,(j) O(j) God,(j) de(j)fen(j)der(j) of(j) my(j) <i>cause;</i>(k.) *(:) you(j) set(j) me(j) free(j) when(j) I(j) am(j) hard-(j)pressed;(j) (,) have(j) mer(j)cy(j) on(j) <i>me</i>(i) and(j) hear(h) my(g) prayer.(g) (::)%
```

Notice: they embed `<i>...</i>` *inside the GABC* to mark accented syllables visually. This is a concrete choice Venite must make — keep pointing in text and overlay, or push it into the GABC.

---

## 5. Audio approach

| Aspect | episcopalchant.com | Venite plan |
|---|---|---|
| Engine | **Tone.js** (`/js/Tone.min.js`) layered over a lower-level `bit101/tones` (see `/js/tones.js`, commented `// https://github.com/bit101/tones`) using raw WebAudio OscillatorNode + GainNode envelope | Raw WebAudio API (Decision 22) |
| Synthesis | Dynamic — no pre-recorded audio anywhere. `tones.js` creates `new OscillatorNode` at requested Hz, applies attack/release gain envelope. | Dynamic synthesis (Decision 22). Confirmed viable. |
| Controls shipped | **Play / Stop / Step-forward** buttons; **Tempo −/+** (BPM, default 165); **Pitch up / Pitch down** (transpose in semitones); **Starting pitch display** (e.g. "C♯ / D♭₄; Do: F♯ / G♭") | "Hear the tone" button |
| BPM default | 165 | Unspecified |
| "Chant from here" | A feature where user clicks a note in the SVG and playback resumes from that note ("select a note and click the 'Chant from here' button") | Not planned |
| Known issues (admitted by author) | "Coding this part of the site was tricky. You may need to 'clear out' the playback engine a few times by pressing play and stop" | — |

Sources: raw HTML of https://episcopalchant.com/eucharist/eucharistic_prayers/prayer_d_pre_sanctus.html , https://episcopalchant.com/js/tones.js , https://episcopalchant.com/about.html#playback

**Key insight**: Venite's Decision 22 (dynamic synthesis, no recordings) is exactly what episcopalchant.com does in production, at scale, across interactive through-composed chants (not just tone skeletons). It works. The UX they layer on top — tempo, transpose, step-through, "chant from here" — is **substantially richer** than Venite's current "hear the tone" button-only plan. These should be considered Phase 2+ enhancements, not MVP, but the tech stack is identical so they're cheap to add incrementally.

---

## 6. Tech stack (fully discovered)

From raw HTML of https://episcopalchant.com/eucharist/eucharistic_prayers/prayer_d_pre_sanctus.html :

| Category | Library | Version | Notes |
|---|---|---|---|
| Framework | None / static HTML | — | Plain multi-page static site. No React/Vue/Angular. |
| CSS | Bootstrap 5.3.0 (via jsDelivr CDN) | 5.3.0 | Plus Bootstrap Icons 1.10.5 |
| Custom CSS | `/css/style.css`, `/css/style_more.css`, `/css/dark-mode.css` | — | Dark mode toggle shipped |
| JS framework | jQuery | 3.x (via `/js/jquery.min.js`) + jQuery UI 1.10.3 | Legacy-feeling stack |
| **Notation** | **Exsurge.js** (`/js/exsurge.min.js`) | minified, self-hosted | Same as Venite plan |
| **Audio** | **Tone.js** (`/js/Tone.min.js`) + `bit101/tones` wrapper (`/js/tones.js`) | — | Tone.js is the headline dep |
| **Pointing** | **Hypher** (`/js/jquery.hypher.js`) + language patterns `en-us.js`, `pl.js` (Polish), `la-hypher.js` (Latin) | — | **Client-side hyphenation/syllabification**. Venite plan uses a vowel heuristic (Decision 6) — Hypher is an alternative |
| **Psalm tone application** | `/js/psalmtone.js` — directly derived from bbloomf/jgabc's `psalmtone.js` | — | **Open-source, Unlicense.** Contains regex-based Latin syllabification, mediant/flex/final logic, bi-format output (HTML/TeX/GABC) |
| SVG→PNG export | `/js/saveSvgAsPng.js` | — | Download-as-image feature |
| Bulk ZIP | `jszip.min.js` (3.10.1 CDN) + `FileSaver.min.js` | — | Bulk chant download |
| Analytics | Google gtag (GA4 id G-405SGQM4FQ) | — | — |
| Hosting | Cloudflare / Netlify-style static (`x-request-id` header, `vary: Origin`, ETag on static PDFs) | — | Simple static hosting |

**Source code availability**: Nothing on episcopalchant.com itself (no `<a>` tag links a public repo). However, their entire notation + pointing + audio engine is a fork/reuse of:

- https://github.com/bbloomf/jgabc — **137 stars, Unlicense (public domain)**, 36 MB corpus. Contains:
  - `psalmtone.js` — algorithmic psalm pointer
  - `exsurge.min.js` — their pinned Exsurge build
  - `cantica.js` — canticle texts
  - `collect-gregorian.js` — collect tones
  - `lectiones.js` — lesson tones
  - `psalmMap.json`, `canticumMap.json` — tone assignments
  - `Caeciliae-Staffless.ttf`, `Caeciliae-Staffless-print.ttf` — staffless Caeciliae variants
  - `English Psalm Tones. 2011.pdf` — reference document
  - `moment.easter.js` — liturgical calendar helper
- https://github.com/frmatthew/exsurge — the canonical Exsurge fork (Fr. Matthew)
- https://github.com/bit101/tones — the WebAudio oscillator wrapper

**Practical takeaway for Venite**: `bbloomf/jgabc` is an enormous, correctly-licensed (Unlicense) prior-art codebase implementing *exactly the Venite plan*. We should at minimum harvest their `psalmtone.js` algorithm and their English psalm tone reference data before writing our own.

---

## 7. UX patterns

| Pattern | episcopalchant.com | Venite equivalent |
|---|---|---|
| Navigation to "today" | **None**. Manual Service Composer (pick service + Year A/B/C + RCL Track 1/2) | Venite has proper calendar routing |
| Preferences / settings | **None surfaced.** No tradition preference, no psalter selector, no tone tradition. Just a dark-mode toggle. | Venite planned `chantTradition` preference is richer |
| Mobile layout | Responsive Bootstrap 5; `d-none d-md-block` hides some elements on mobile. `viewport` meta present. | — |
| Print / download | PDF download button on every interactive page; also SVG→PNG export capability; also ZIP bulk download | Not currently planned |
| Interactive features | Play / pause / stop / step-forward; tempo ±; pitch up/down (semitone transpose); "chant from here"; starting-pitch + Do display | Currently just "Hear the tone" button |
| Reverse lookup | By biblical book → all chant settings for that book | N/A (Venite is BCP-first, not scripture-first) |
| Service Composer | Assemble gradual psalm + epistle + gospel for a selected service | Venite's existing service compilation is broader |
| Dark mode | Yes, with toggle in nav | Venite already has theming |
| Chrome Web Store | A Chrome extension is linked (`mkhgaijffgijgkolifpoaijimncdakkd`) | N/A |

---

## 8. Business model / origin

- **Editors**: Two unnamed "co-editors" (site explicitly anonymous), citing Fr. Bill Gartig's *One Man's Offering* as foundation. Named contributors include John Wallace (Metrical Collects co-creator), Eliza Humphreys (poetic Collects), Rev. David Simmons (Julian Parish Missal), Kelly Puckett (Lectionary Page), Charles Wohlers (Anglican BCP archive).
- **Consulted**: Rev. Greg Johnston of Venite for advice (!). Source: https://episcopalchant.com/about.html
- **Tradition alignment**: "Prayer Book Catholic" — Anglo-Catholic wing of Episcopal Church. Explicitly Gregorian/plainsong.
- **Funding**: Unfunded, donation-free, ad-free. Volunteer labor.
- **Institutional status**: "not an official publication of The Episcopal Church."
- **Copyright posture**: Maximum openness — "waived all copyright and related or neighboring rights." Their editorial pointings are public domain.

**Implication for Venite**: episcopalchant.com explicitly acknowledges Venite ("Rev. Greg Johnston"), so they see Venite as a peer/cousin project, not a competitor. This is a potential collaboration axis — jointly-maintained tone libraries, shared pointing corrections — rather than a competitive one.

---

## 9. Comparison against Venite's CHANT_DESIGN.md decisions

| # | Venite decision | episcopalchant.com posture | Validation |
|---|---|---|---|
| Encoding | GABC as sole notation format | **Same.** Entire site is GABC + Exsurge. No MusicXML. No Anglican chant notation anywhere. | **Supports** |
| Renderer | Runtime Exsurge.js → SVG | **Same.** Self-hosted `exsurge.min.js`, renders inline SVG into `#chant-preview`. | **Supports** |
| Renderer — lazy load | Lazy-loaded, adapter-wrapped, SHA-pinned | Not lazy (loads on every page regardless); not SHA-pinned (minified blob). | **Silent** — they don't bother; Venite's approach is more conservative |
| Font (Dec. 18) | Caeciliae | Caeciliae (default from Exsurge). Also staffless variants exist in jgabc. | **Supports** |
| Dynamic audio synthesis (Dec. 22) | WebAudio synth, no recordings | **Same philosophy — validated in production.** They use Tone.js + `bit101/tones` on raw OscillatorNode. Dynamic, no recordings. | **Supports** |
| WebAudio library | Raw WebAudio API | They use Tone.js as an abstraction. Works but a dependency. | **Silent/differs** — Venite's "raw WebAudio" is more minimal; Tone.js would give `PsalmTone.playback.Note` arrays a higher-level scheduler for free |
| Pointing as typography on verse text | CSS overlay on verse text + algorithmic pointing | They embed `<i>accent</i>` *inside the GABC source* for the accented syllable; pointing for them is editorial-in-GABC rather than algorithmic. Their **`psalmtone.js` CAN do algorithmic pointing** but is not wired up here for through-composed chants. | **Partially supports** — validates the algorithmic idea (jgabc has it) but the site itself uses hand-pointing in source |
| Algorithmic first-pass pointer (Dec. 12) | `point-psalm.ts` algorithmic + `/chant-pointing` skill corrections | **Massive prior art**: bbloomf's `psalmtone.js` is exactly this. Regex-based vowel detection, Hypher for syllabification, mediant/flex/final resolution, multi-format output (HTML/TeX/GABC). | **Supports** — **harvest this code** |
| Tone skeleton at top + pointed text below (Dec. 8) | Tone skeleton + pointed verse text below | Their interactive pages show *only* the GABC chant score (tone melded with text). They do NOT render a skeleton separately from verses. | **Differs** — Venite's split is cleaner for long psalms; episcopalchant renders the whole thing |
| User preference — tradition (Sarum/Roman/PMMS/St Dunstan) | Cascading preference | **Absent.** They offer exactly one tone set and one psalter (Ford). No Sarum/Roman toggle. | **Silent** — Venite goes further; confirms no existing product does this, which is either novel value or unneeded complexity |
| Opt-in display (Dec. 20, off by default) | `chantNotation: 'off'` default | **Contradicts.** Notation is always on for interactive pages. No toggle. | **Contradicts** — but their audience is already chant-seeking, while Venite's is broader |
| Marian antiphons scope (Dec. 14, Latin only deferred English) | Latin only | **Not present.** Matches Venite's "defer English" posture. | **Supports by omission** |
| Full psalter coverage (Dec. 13, BCP 1979) | Full 150-psalm psalter pointed | **Absent.** They only have Bruce Ford's *gradual* psalms (RCL selections), not a full 150-psalm psalter, and they use NRSV, not BCP 1979. Altar Book copyright cited as blocker. | **Differs** — Venite's plan is materially broader. Altar Book copyright is a risk for Venite too if republishing pointings; check licensing on any Litton/Plainsong Psalter reference |
| Tone selection rules | Per-psalm tone assignments via preference-cascade from multiple sources (St Dunstan / Plainsong Psalter / user) | **Absent.** One tone per chant, hard-coded. | **Silent** — nothing to validate; Venite's approach is genuinely novel in this space |
| Full canticle coverage | Te Deum, Benedictus, Magnificat, Venite, Jubilate, Phos Hilaron, Nunc Dimittis | Only Nunc Dimittis (Compline). All others absent. | **Differs** — Venite's broader office coverage is a real differentiator |
| Collect tones (Dec. 15, ferial + festal) | Both | Collects shipped as PDFs, not interactive. "Solemn tone" explicitly appears on EOW1 prefaces. Ferial/festal distinction is present in editorial. | **Supports** |
| Compline hymns (Dec. 16) | Shipped | Compline shipped as a unit. Hymns (e.g. *Te lucis ante terminum*) on Compline beginning pages — worth checking the "beginning" interactive pages. | **Supports** |
| TTS coexistence (Dec. 21) | Both | N/A — episcopalchant has no TTS | **Silent** |

---

## 10. Specific question — does the GABC-only decision hold?

**Yes, strongly, for this audience.**

Evidence:
1. The closest comparable Episcopal-facing chant product on the open web made the same choice — GABC/plainsong only, no Anglican chant.
2. Their FAQ never fields a "where's Anglican chant?" question. The only absence they feel obligated to explain is *more plainsong settings* (Altar Book copyright) — not the absence of Anglican chant.
3. Anglican chant has its own ecosystem (anglican-chant-archive.org, Richard Bloomfield's blog, *Psalm Memories*). These communities do not overlap with plainsong audiences much.
4. Anglican chant's notation (5-line staff, SATB voice parts, double chants) is fundamentally different typography — SVG renderers for it exist separately (e.g. VexFlow, ABCjs with harmony) and cannot share GABC's typesetting primitives.

**Pressure scenarios to flag:**
- If Venite starts marketing explicitly to choir directors / parish musicians (not just individual pray-ers), Anglican chant demand rises.
- A "full chanted Evensong" feature would expose the Magnificat/Nunc Dimittis gap, where Anglican chant is *the* common idiom in real Episcopal parishes. Plainsong Mag/Nunc is rarer in US Episcopal practice than plainsong Office elsewhere.

**Cost of adding Anglican chant later given GABC-only architecture:**
- Schema already supports multi-format: `ChantData.gabc?` is optional. Adding `ChantData.anglicanChant?` or a polymorphic `notation: 'gabc' | 'anglican'` is additive, not a rewrite.
- Component layer: `ldf-chant-notation` would need a second renderer (e.g. VexFlow or a bespoke SVG renderer for double-chants). Current component is a thin wrapper — swap-friendly per Decision 17.
- Pointing engine: Anglican chant pointing (colons, asterisks, accent marks over ultimate-stressed syllables, bar lines) differs materially from plainsong mediant/flex/final. Not reusable. Would need a parallel algorithm.
- Audio: SATB playback requires at minimum 4-voice polyphonic synthesis. Tone.js scales to this trivially; raw WebAudio (Venite's current plan) also does but with more code.
- **Rough effort estimate if demanded later**: 2–4 weeks of engineering plus ~2 months of content/pointing work. Not a rewrite. Flag as a backlog candidate, not a blocker.

**Recommendation**: hold GABC-only for v1. Add a non-blocking backlog item: "Anglican chant support — schema already additive; defer unless parish-musician user interviews demand it."

---

## 11. Key takeaways for Venite (opinionated)

1. **Harvest `bbloomf/jgabc` before writing `point-psalm.ts`.** The Unlicense-public-domain repo already contains a working algorithmic psalm pointer (`psalmtone.js`) with multi-format output (HTML / TeX / GABC). Wrapping or porting this saves weeks vs. writing from scratch and will match episcopalchant.com's proven behavior. Decision 12's "algorithmic first pass + skill for corrections" — start with the adapter pattern around `psalmtone.js`.
2. **Adopt Tone.js — don't build raw WebAudio.** Decision 22 is right about dynamic synthesis; episcopalchant.com proves it works. But the 30kB of Tone.js gives us BPM scheduling, transpose, pitch-name display, and enables features ("tempo ±", "transpose ±", "chant from here") that raw-WebAudio would require substantial code for. Revise Decision 22 to specify Tone.js (still dynamic, still no recordings).
3. **Ship tempo and transpose controls from day one.** They are trivial atop Tone.js, they are the single most useful chant-learning UX (match your voice range, slow down hard tones), and every real chant product has them. Venite's "Hear the tone button" is table-stakes; tempo/transpose are what makes the feature actually get used.
4. **Include starting-pitch and "Do =" display.** episcopalchant.com shows `Starting Pitch: C♯ / D♭₄; Do: F♯ / G♭`. This is a clergy/cantor essential — it tells them where to start the congregation. Venite can compute this from `PsalmTone.playback` deterministically.
5. **Consider Hypher for syllabification.** episcopalchant.com uses Hypher with English, Latin, and Polish dictionaries. Venite's Decision 6 ("word-level from end; vowel heuristic for accented word") is lighter but less accurate on edge cases like "glo-ri-fy" vs "glo-ri-o". Evaluate Hypher as a 30 kB dependency against the correctness delta before committing to pure-heuristic.
6. **Our office breadth is the moat, not notation.** episcopalchant.com has zero Morning Prayer, Evening Prayer, or Noonday Prayer. They're a gradual-psalm + Compline + Eucharist product. Venite already covers the full Daily Office. The unique selling proposition is "full Daily Office with plainchant" — not "plainchant renderer," which is a solved component.
7. **Full 150-psalm psalter with BCP 1979 text is a real differentiator.** They gave up on it (Altar Book copyright). If Venite can ship a public-domain or user-pointed full psalter, that's unique in the market. But: review Altar Book copyright risk for any psalm tone assignments reused from the *Plainsong Psalter* (Litton) or *Gradual Psalms* — this is a real legal concern episcopalchant.com explicitly navigates around.
8. **PDF export is a user expectation in this space.** Every episcopalchant.com page has a PDF download. They also ship `saveSvgAsPng.js` for SVG→PNG and JSZip+FileSaver for bulk download. Venite's current plan has no export story. Phase 3+ should include "print-ready PDF of today's pointed psalms" — it will be asked for.
9. **Pointing-in-GABC is an alternative to pointing-as-CSS-overlay.** episcopalchant.com embeds `<i>accented-syllable</i>` directly inside GABC source. This is simpler and keeps pointing with the notation. Venite's CSS-overlay approach (Decision 8) is more flexible (allows notation-off + pointing-on), but slightly more complex. Validate this tradeoff concretely — is "pointing visible without notation" actually a user need? Decision 20 (off-by-default) implies yes.
10. **They do NOT split tone skeleton from pointed verses — they inline everything.** Venite's Decision 8 (skeleton at top, pointing inline below) is a cleaner long-psalm pattern. Keep it. But recognize this is a genuinely novel pattern not validated by prior art — budget design iteration time.
11. **The "Prayer Book Catholic / Sarum-tradition" identity is fuzzy in practice.** episcopalchant.com collapses Sarum/Roman/PMMS/St Dunstan's into one tone set without surfacing any preference. Our planned `chantTradition` preference (Decision from `DisplaySettings`) is either a genuinely novel UX (good) or unnecessary complexity (bad). Recommend: ship it, but default to "auto" and hide behind advanced settings. Real-world demand for per-user tradition selection is unvalidated.
12. **Dark mode is expected.** They ship it; Venite probably already has it. Noted for completeness.
13. **Collaboration, not competition.** episcopalchant.com cites Rev. Greg Johnston of Venite in their credits. This is an explicit peer-project relationship. Before building the tone library from St Dunstan's PDF, reach out — they may have better source data. Joint maintenance of a plainsong-tones JSON would be mutually beneficial and is architecturally compatible with Venite's content-as-data approach.
14. **"Chant from here" is a killer feature.** Click any note in the SVG, playback resumes from that point. This makes the player usable for rehearsal, not just audition. Put it on the Phase 2+ backlog — Exsurge emits clickable SVG elements already.
15. **Calendar/today integration is Venite's existing strength; leverage it.** episcopalchant.com's Service Composer is manual (pick service + year + track). Venite already routes to today's liturgy. The chant feature should auto-render today's pointed psalms without the user picking anything. This is the single biggest UX gap between the two products, and Venite wins for free if we just wire our existing calendar through.

---

## 12. URLs referenced

### episcopalchant.com pages
- Home: https://episcopalchant.com/
- About: https://episcopalchant.com/about.html
- Daily Office: https://episcopalchant.com/daily_office.html
- Gradual Psalms (Ford): https://episcopalchant.com/gradual_psalms_ford.html
- Psalms liturgical year: https://episcopalchant.com/psalms/liturgical_year.html
- Epistles liturgical year: https://episcopalchant.com/epistles/liturgical_year.html
- Eucharistic Prayers: https://episcopalchant.com/eucharist/eucharistic_prayers.html
- Prayer D Pre-Sanctus (interactive sample): https://episcopalchant.com/eucharist/eucharistic_prayers/prayer_d_pre_sanctus.html
- Compline Psalm 4 (interactive sample): https://episcopalchant.com/daily_office/compline/psalm_4.html
- Service Composer: https://episcopalchant.com/service_composer.html
- Reverse Lookup: https://episcopalchant.com/reverse_lookup.html
- Other Provinces: https://episcopalchant.com/other_provinces.html
- Other Pastoral Services: https://episcopalchant.com/other_pastoral_services.html
- Christmas seasonal: https://episcopalchant.com/seasonal/christmas.html

### Tech-stack assets (episcopalchant.com)
- Tones wrapper: https://episcopalchant.com/js/tones.js
- Psalm tone algorithm: https://episcopalchant.com/js/psalmtone.js

### External prior-art repos
- jgabc (main): https://github.com/bbloomf/jgabc  (Unlicense, 137 stars)
- jgabc live: https://bbloomf.github.io/jgabc/
- Exsurge: https://github.com/frmatthew/exsurge
- Tones (bit101, WebAudio oscillator wrapper): https://github.com/bit101/tones
- GABC spec: https://gregorio-project.github.io/gabc/index.html

### Context
- Anglican Chant (TEC glossary): https://www.episcopalchurch.org/glossary/anglican-chant/
- Plainsong (TEC glossary): https://www.episcopalchurch.org/glossary/plainsong/
- Venite's own CHANT_DESIGN.md: `/Users/cameronlewis/Dev/venite/resources/CHANT_DESIGN.md`
