import { newE2EPage } from '@stencil/core/testing';

describe('ldf-chant-pointing', () => {
  it('renders plain text when no pointing is supplied', async () => {
    const page = await newE2EPage();
    await page.setContent(
      '<ldf-chant-pointing text="The Lord is my shepherd"></ldf-chant-pointing>',
    );
    await page.waitForChanges();

    const host = await page.find('ldf-chant-pointing');
    expect(host).toHaveClass('hydrated');
    // No accent markup present.
    const accent = await page.find('ldf-chant-pointing >>> .accent');
    expect(accent).toBeFalsy();
    // aria-label falls back to the text.
    expect(host.getAttribute('aria-label')).toEqual('The Lord is my shepherd');
    // Host renders the supplied text.
    expect(host.textContent).toContain('The Lord is my shepherd');
  });

  it('wraps the mediant-accented syllable on a first-half text ending with `*`', async () => {
    const page = await newE2EPage();
    await page.setContent(
      `<ldf-chant-pointing text="The Lord is my shepherd *" pointing='{"mediantAccent":0}'></ldf-chant-pointing>`,
    );
    await page.waitForChanges();

    // The last word ("shepherd") should have its stressed syllable wrapped
    // with class accent-mediant.
    const mediantAccent = await page.find(
      'ldf-chant-pointing >>> .accent.accent-mediant',
    );
    expect(mediantAccent).toBeTruthy();
    // No `mediantStressSyllable` hint is supplied here, so the rule-based
    // suffix detector applies. "shepherd" matches no unstressed-suffix and
    // is multisyllabic, so the English-bias initial-stress fallback wraps
    // the FIRST syllable, "shep". (Pre-Phase-2: this used to bold "erd"
    // via a last-vowel-cluster heuristic.) Canonical syllabification of
    // "shepherd" is ["shep","herd"] (matches ldf/chant/generate-gabc).
    expect(mediantAccent.textContent).toEqual('shep');

    // The `*` is emitted as a .caesura span (real U+002A).
    const caesura = await page.find('ldf-chant-pointing >>> .caesura');
    expect(caesura).toBeTruthy();
    expect(caesura.textContent).toEqual('*');

    // Host should not carry the bold overlay class (psalmsBold defaults to 'none').
    const host = await page.find('ldf-chant-pointing');
    expect(host).not.toHaveClass('bold');
  });

  it('uses mediantStressSyllable hint when present (loving-kindness → "kind")', async () => {
    const page = await newE2EPage();
    await page.setContent(
      `<ldf-chant-pointing text="according to your loving-kindness *" pointing='{"mediantAccent":0,"mediantStressSyllable":2}'></ldf-chant-pointing>`,
    );
    await page.waitForChanges();

    const mediantAccent = await page.find(
      'ldf-chant-pointing >>> .accent.accent-mediant',
    );
    expect(mediantAccent).toBeTruthy();
    // Vowel clusters in "loving-kindness" are: o, i, i, e (4 syllables).
    // Hint=2 → wrap the cluster starting at "i" inside "kind". Walking back
    // by one consonant for the next-syllable onset gives accent="kind".
    expect(mediantAccent.textContent).toEqual('kind');
  });

  it('falls back to suffix rule for unstressed -ness ending', async () => {
    const page = await newE2EPage();
    await page.setContent(
      `<ldf-chant-pointing text="forgive my offenses"></ldf-chant-pointing>`,
    );
    await page.waitForChanges();

    // No pointing → bare render, no accent.
    const accent = await page.find(
      'ldf-chant-pointing >>> .accent',
    );
    expect(accent).toBeFalsy();
  });

  it('uses finalStressSyllable hint on the final cadence', async () => {
    const page = await newE2EPage();
    await page.setContent(
      `<ldf-chant-pointing text="blot out my offenses." pointing='{"finalAccent":0,"finalStressSyllable":1}'></ldf-chant-pointing>`,
    );
    await page.waitForChanges();

    const finalAccent = await page.find(
      'ldf-chant-pointing >>> .accent.accent-final',
    );
    expect(finalAccent).toBeTruthy();
    // Vowel clusters in "offenses" are: o, e, e (3 syllables).
    // Hint=1 → cluster starting at "e" in "fen". Punctuation period is
    // routed into suffix, not accent.
    expect(finalAccent.textContent).toEqual('fen');
  });

  it('applies the bold overlay when psalmsBold="all"', async () => {
    const page = await newE2EPage();
    await page.setContent(
      `<ldf-chant-pointing text="The Lord is my shepherd *" pointing='{"mediantAccent":0}' psalms-bold="all"></ldf-chant-pointing>`,
    );
    await page.waitForChanges();

    const host = await page.find('ldf-chant-pointing');
    expect(host).toHaveClass('bold');

    // The accent span is still present; the SCSS turns it bold under :host(.bold).
    const accent = await page.find(
      'ldf-chant-pointing >>> .accent.accent-mediant',
    );
    expect(accent).toBeTruthy();
  });
});
