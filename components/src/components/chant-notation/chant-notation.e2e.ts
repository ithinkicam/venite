import { newE2EPage } from '@stencil/core/testing';

/**
 * Smoke tests for `ldf-chant-notation`.
 *
 * Notation rendering depends on Exsurge, which in turn depends on font
 * shaping (`document.fonts.ready` and OpenType measurement) — neither of
 * which jsdom can satisfy reliably. These tests therefore only assert that
 * the host element hydrates and that error states surface as the `.error`
 * host class. They do NOT inspect the SVG output.
 */
describe('ldf-chant-notation', () => {
  it('hydrates the host element', async () => {
    const page = await newE2EPage();
    await page.setContent('<ldf-chant-notation></ldf-chant-notation>');
    await page.waitForChanges();

    const host = await page.find('ldf-chant-notation');
    expect(host).toHaveClass('hydrated');
  });

  it('falls into the error state when required inputs are missing', async () => {
    const page = await newE2EPage();
    await page.setContent(
      '<ldf-chant-notation text="The Lord is my shepherd"></ldf-chant-notation>',
    );
    await page.waitForChanges();

    // Without `tone`, `differentia`, AND `pointing`, the component cannot
    // synthesize GABC and surfaces an `.error` host class so the host hides.
    const host = await page.find('ldf-chant-notation');
    expect(host).toHaveClass('error');
  });
});
