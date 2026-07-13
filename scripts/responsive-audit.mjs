// Responsive audit — sweeps every key screen across real phone sizes and
// fails on layout regressions. Run AFTER any UI change, BEFORE deploying:
//   1. firebase emulators:start --project swish-game-dev   (+ npm run seed)
//   2. VITE_USE_EMULATORS=true npm run dev                  (port 3000)
//   3. node scripts/responsive-audit.mjs
// Signs in with the seeded demo user via the emulator-only test hook.
import { chromium } from 'playwright';

const BASE = process.env.AUDIT_BASE_URL ?? 'http://localhost:3000';

// The device matrix — smallest phone sold → large phones → tablet → desktop.
const VIEWPORTS = [
  { name: 'iPhone SE 1',      width: 320, height: 568 },
  { name: 'small Android',    width: 360, height: 640 },
  { name: 'iPhone 8',         width: 375, height: 667 },
  { name: 'iPhone X/11 Pro',  width: 375, height: 812 },
  { name: 'iPhone 14/15',     width: 390, height: 844 },
  { name: 'iPhone Plus/Max',  width: 428, height: 926 },
  { name: 'tablet',           width: 768, height: 1024 },
  { name: 'desktop',          width: 1280, height: 800 },
];

// Pages and the element that MUST be fully on-screen there.
const PAGES = [
  { path: '/discover', anchor: 'button[aria-label="like"]', label: 'discover: like button' },
  { path: '/games',    anchor: 'input[aria-label]',         label: 'games: search box' },
  { path: '/likes',    anchor: null,                        label: 'likes' },
  { path: '/chat',     anchor: null,                        label: 'chat list' },
  { path: '/profile',  anchor: null,                        label: 'profile' },
  { path: '/settings', anchor: null,                        label: 'settings' },
  { path: '/subscriptions', anchor: null,                   label: 'subscriptions' },
];

const AUDIT_SNIPPET = `(() => {
  const problems = [];
  // 1. the page must never scroll horizontally
  if (document.documentElement.scrollWidth > innerWidth + 1) {
    problems.push('horizontal page scroll (' + document.documentElement.scrollWidth + ' > ' + innerWidth + ')');
  }
  // 2. no visible element may bleed past the viewport edges
  for (const el of document.querySelectorAll('div,button,form,header,nav,input,h1,h2,h3')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.opacity === '0') continue;
    // horizontally scrollable strips may overflow on purpose
    if (el.closest('.overflow-x-auto, .snap-x')) continue;
    if (r.left < -4 || r.right > innerWidth + 4) {
      problems.push('bleeds horizontally: ' + (el.tagName + '.' + String(el.className).slice(0, 50)));
      if (problems.length > 4) break;
    }
  }
  // 3. the bottom nav must end exactly at the viewport bottom (mobile only)
  const nav = document.querySelector('nav');
  if (nav && innerWidth < 768) {
    const r = nav.getBoundingClientRect();
    if (Math.abs(r.bottom - innerHeight) > 2) problems.push('bottom nav not flush: bottom=' + Math.round(r.bottom) + ' vs ' + innerHeight);
  }
  // 4. header title must stay inside the viewport and not touch the side controls
  const title = document.querySelector('header h1');
  if (title) {
    const tr = title.getBoundingClientRect();
    if (tr.left < 0 || tr.right > innerWidth) problems.push('header title out of bounds');
    for (const btn of document.querySelectorAll('header button')) {
      const br = btn.getBoundingClientRect();
      if (br.width && !(tr.right < br.left || tr.left > br.right) && !(tr.bottom < br.top || tr.top > br.bottom)) {
        problems.push('header title overlaps a control');
        break;
      }
    }
  }
  return problems;
})()`;

const main = async () => {
  const browser = await chromium.launch();
  const failures = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // sign in through the emulator-only hook
    await page.waitForFunction('Boolean(window.__swishTestAuth)', null, { timeout: 15000 });
    await page.evaluate(`window.__swishTestAuth.signInWithEmailAndPassword(window.__swishTestAuth.auth, 'demo.yael@swish.test', 'demo123456')`);
    await page.waitForTimeout(2500);

    for (const p of PAGES) {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2200);

      const problems = await page.evaluate(AUDIT_SNIPPET);
      if (p.anchor) {
        const ok = await page.evaluate(`(() => {
          const el = document.querySelector('${p.anchor}');
          if (!el) return true; // page may legitimately be in an empty state
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= innerHeight && r.left >= -1 && r.right <= innerWidth + 1;
        })()`);
        if (!ok) problems.push(`anchor off-screen: ${p.anchor}`);
      }
      for (const problem of problems) {
        failures.push(`[${vp.name} ${vp.width}x${vp.height}] ${p.label}: ${problem}`);
      }
    }
    await context.close();
  }

  await browser.close();

  if (failures.length) {
    console.error(`\nRESPONSIVE AUDIT FAILED — ${failures.length} problem(s):`);
    for (const failure of failures) console.error('  ✗ ' + failure);
    process.exit(1);
  }
  console.log(`responsive audit passed — ${VIEWPORTS.length} sizes × ${PAGES.length} pages, 0 problems`);
};

main().catch((error) => {
  console.error('audit crashed:', error.message);
  process.exit(1);
});
