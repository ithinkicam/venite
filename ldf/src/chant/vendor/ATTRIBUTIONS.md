# Vendored third-party sources

## psalmtone.js
- Upstream: https://github.com/bbloomf/jgabc
- File: https://raw.githubusercontent.com/bbloomf/jgabc/master/psalmtone.js
- License: The Unlicense (public domain)
- Vendored: 2026-04-22
- SHA at vendoring: 4e5a738475955f2e977e2d44a7b5cbba224c6828

Used as the algorithmic basis for `ldf/src/chant/point-psalm.ts`, which wraps the vendored algorithm and adapts the output to Venite's `VersePointing` schema.

### Notes on usage at Phase 1

At vendoring time the file was inspected but not directly invoked by the TypeScript wrapper. Reasons:

- The file assumes a browser DOM context — it references `window`, `localStorage`, and `location.search` at module scope, which throws under a Node/Jest (`testEnvironment: 'node'`) runtime.
- Its English syllabifier (`Syl.syllabify`) depends on an optional `Hypher` global plus a remote syllable-lookup endpoint; adding those to the test runtime is out of scope for Phase 1.
- The main `applyPsalmTone` entry point emits formatted output (HTML / TeX / GABC with `<b>`/`<i>` markup) rather than a structured `{ mediantAccent, finalAccent, flex }` object, so we would still have to parse its output to recover our schema.

The vendored source remains a valuable **reference** for:
- Regex patterns (`regexLatin`, `regexWords`, `regexVowel`, `regexAccent`) that define jgabc's syllabification model — useful for a future richer in-house port.
- Accent-placement heuristics (`addBoldItalic`, `lastAccentI`) that inform the Phase-2 pointer upgrade.
- End-to-end behaviour when we eventually render to GABC via jgabc (Phase 3+).

Phase 1's `point-psalm.ts` therefore implements a minimal in-house heuristic using the existing `syllabifyText` helper from `generate-gabc.ts`. See the file header comment there for algorithm details.
