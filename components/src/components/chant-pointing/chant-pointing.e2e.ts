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

    // The last word ("shepherd") should have its last vowel cluster wrapped
    // with class accent-mediant.
    const mediantAccent = await page.find(
      'ldf-chant-pointing >>> .accent.accent-mediant',
    );
    expect(mediantAccent).toBeTruthy();
    // The stressed syllable of "shepherd" under our last-vowel-cluster
    // heuristic is the trailing "erd".
    expect(mediantAccent.textContent).toEqual('erd');

    // The `*` is emitted as a .caesura span (real U+002A).
    const caesura = await page.find('ldf-chant-pointing >>> .caesura');
    expect(caesura).toBeTruthy();
    expect(caesura.textContent).toEqual('*');

    // Host should not carry the bold overlay class (psalmsBold defaults to 'none').
    const host = await page.find('ldf-chant-pointing');
    expect(host).not.toHaveClass('bold');
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
