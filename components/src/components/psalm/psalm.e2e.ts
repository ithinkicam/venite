import { newE2EPage } from '@stencil/core/testing';
import { Psalm } from '@venite/ldf';

const PSALM_80 = {
  api: '',
  slug: 'psalm_80',
  label: 'Psalm 80',
  language: 'en',
  version: 'bcp1979',
  type: 'psalm' as 'psalm',
  style: 'psalm' as 'psalm',
  citation: 'Psalm 80',
  value: [
    [
      {
        number: '1',
        verse: 'Hear, O Shepherd of Israel, leading Joseph like a flock; * ',
        halfverse: 'shine forth, you that are enthroned upon the cherubim.'
      },
      {
        number: '2',
        verse: 'In the presence of Ephraim, Benjamin, and Manasseh, *',
        halfverse: 'stir up your strength and come to help us.'
      },
      {
        number: '3',
        verse: 'Restore us, O God of hosts; *',
        halfverse: 'show the light of your countenance, and we shall be saved.'
      }
    ]
  ]
};

const PSALM_23_POINTED = {
  api: '',
  slug: 'psalm_23_pointed',
  label: 'Psalm 23',
  language: 'en',
  version: 'bcp1979',
  type: 'psalm' as 'psalm',
  style: 'psalm' as 'psalm',
  citation: 'Psalm 23',
  metadata: {
    number: 23,
    pointing: {
      verses: {
        '1': { mediantAccent: 0, finalAccent: 0, intonationWords: 2 },
        '2': { mediantAccent: 0, finalAccent: 0 }
      }
    }
  },
  value: [
    [
      {
        number: '1',
        verse: 'The Lord is my shepherd; *',
        halfverse: 'I shall not be in want.'
      },
      {
        number: '2',
        verse: 'He makes me lie down in green pastures *',
        halfverse: 'and leads me beside still waters.'
      }
    ]
  ]
};

// Same doc as PSALM_23_POINTED but without inline `metadata.pointing` — used
// to exercise the render-time lookup path against the offline JSON.
const PSALM_23_UNPOINTED = {
  api: '',
  slug: 'psalm_23_unpointed',
  label: 'Psalm 23',
  language: 'en',
  version: 'bcp1979',
  type: 'psalm' as 'psalm',
  style: 'psalm' as 'psalm',
  citation: 'Psalm 23',
  metadata: {
    number: 23
  },
  value: [
    [
      {
        number: '1',
        verse: 'The Lord is my shepherd; *',
        halfverse: 'I shall not be in want.'
      },
      {
        number: '2',
        verse: 'He makes me lie down in green pastures *',
        halfverse: 'and leads me beside still waters.'
      }
    ]
  ]
};

describe('ldf-psalm', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    const psalm = new Psalm(PSALM_80);

    await page.setContent(`<ldf-psalm json="${JSON.stringify(psalm)}"></ldf-psalm>`);
    const element = await page.find('ldf-psalm');
    expect(element).toHaveClass('hydrated');
  });

  it('falls back to <ldf-string> when metadata.pointing is absent', async () => {
    const page = await newE2EPage();
    const psalm = new Psalm(PSALM_80);

    await page.setContent(`<ldf-psalm json="${JSON.stringify(psalm)}"></ldf-psalm>`);
    await page.waitForChanges();

    const pointing = await page.find('ldf-psalm ldf-chant-pointing');
    expect(pointing).toBeFalsy();
  });

  it('renders <ldf-chant-pointing> when metadata.pointing is present and chantNotation is "always"', async () => {
    const page = await newE2EPage();
    const psalm = new Psalm(PSALM_23_POINTED);
    const displaySettings = { chantNotation: 'always', psalmsBold: 'none' };

    await page.setContent(
      `<ldf-psalm json='${JSON.stringify(psalm)}'></ldf-psalm>`
    );
    const el = await page.find('ldf-psalm');
    // Pass displaySettings as a property (Stencil supports prop assignment
    // over complex objects via setProperty on the element).
    await el.setProperty('displaySettings', displaySettings);
    await page.waitForChanges();

    const pointing = await page.find('ldf-psalm ldf-chant-pointing');
    expect(pointing).toBeTruthy();
  });

  it('suppresses <ldf-chant-pointing> when chantNotation is "off"', async () => {
    const page = await newE2EPage();
    const psalm = new Psalm(PSALM_23_POINTED);
    const displaySettings = { chantNotation: 'off', psalmsBold: 'none' };

    await page.setContent(
      `<ldf-psalm json='${JSON.stringify(psalm)}'></ldf-psalm>`
    );
    const el = await page.find('ldf-psalm');
    await el.setProperty('displaySettings', displaySettings);
    await page.waitForChanges();

    const pointing = await page.find('ldf-psalm ldf-chant-pointing');
    expect(pointing).toBeFalsy();
  });

  // --- Render-time pointing-table lookup (Phase 1 W5.pointing-lookup) -------
  //
  // These tests cover the module-level `loadPointingTable()` path. We intercept
  // Puppeteer requests to the offline JSON endpoint and serve a test double,
  // so we don't depend on app/src/offline layout or network state.

  it('renders <ldf-chant-pointing> via the lookup table when inline pointing is absent', async () => {
    const page = await newE2EPage();

    // Serve a known pointing table for /offline/chant/pointing/psalms-bcp1979.json.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.url().includes('/offline/chant/pointing/psalms-bcp1979.json')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            psalter: 'bcp1979',
            psalms: {
              '23': {
                verses: {
                  '1': { mediantAccent: 0, finalAccent: 0 },
                  '2': { mediantAccent: 0, finalAccent: 0 }
                }
              }
            }
          })
        });
      } else {
        req.continue();
      }
    });

    const psalm = new Psalm(PSALM_23_UNPOINTED);
    const displaySettings = { chantNotation: 'always', psalmsBold: 'none' };

    await page.setContent(
      `<ldf-psalm json='${JSON.stringify(psalm)}'></ldf-psalm>`
    );
    const el = await page.find('ldf-psalm');
    await el.setProperty('displaySettings', displaySettings);
    await page.waitForChanges();

    const pointing = await page.find('ldf-psalm ldf-chant-pointing');
    expect(pointing).toBeTruthy();
  });

  it('falls through to plain text when the pointing-table fetch fails (404)', async () => {
    const page = await newE2EPage();

    // 404 the offline JSON endpoint — component should render without crashing
    // and without any <ldf-chant-pointing> nodes.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.url().includes('/offline/chant/pointing/psalms-bcp1979.json')) {
        req.respond({ status: 404, contentType: 'application/json', body: '{}' });
      } else {
        req.continue();
      }
    });

    const psalm = new Psalm(PSALM_23_UNPOINTED);
    const displaySettings = { chantNotation: 'always', psalmsBold: 'none' };

    await page.setContent(
      `<ldf-psalm json='${JSON.stringify(psalm)}'></ldf-psalm>`
    );
    const el = await page.find('ldf-psalm');
    await el.setProperty('displaySettings', displaySettings);
    await page.waitForChanges();

    const pointing = await page.find('ldf-psalm ldf-chant-pointing');
    expect(pointing).toBeFalsy();
    // Component still hydrated — no broken state from the failed fetch.
    expect(el).toHaveClass('hydrated');
  });
});
