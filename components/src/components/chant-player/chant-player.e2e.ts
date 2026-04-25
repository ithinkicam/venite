import { newE2EPage } from '@stencil/core/testing';

/**
 * Smoke tests for `<ldf-chant-player>`.
 *
 * Audio synthesis depends on Tone.js + a real AudioContext, neither of
 * which jsdom provides. These tests assert only that the host hydrates
 * and the play button is in the DOM. Anything that touches Tone.start()
 * or oscillator scheduling is exercised in the browser, not here.
 */
describe('ldf-chant-player', () => {
  it('hydrates the host element', async () => {
    const page = await newE2EPage();
    await page.setContent('<ldf-chant-player></ldf-chant-player>');
    await page.waitForChanges();

    const host = await page.find('ldf-chant-player');
    expect(host).toHaveClass('hydrated');
  });

  it('renders a play button by default', async () => {
    const page = await newE2EPage();
    await page.setContent('<ldf-chant-player></ldf-chant-player>');
    await page.waitForChanges();

    // The host always renders an `<ion-button>` (Ionic web component is
    // not registered in this test env, so it stays as a plain custom
    // element — but it IS in the DOM, which is what we assert).
    const button = await page.find('ldf-chant-player >>> ion-button');
    expect(button).not.toBeNull();
  });
});
