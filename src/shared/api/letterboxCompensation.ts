// Some iOS versions (observed on an iPhone 16 Pro: screen 402×874, web view
// 812pt anchored at y=0, env insets 62/34) size the standalone web view as if
// the status bar were excluded but anchor it fullscreen — the view really
// ends ~status-bar-height above the screen bottom, iOS paints the remainder
// with the manifest background color, and nothing in-page can render there.
// The legacy apple-mobile-web-app-status-bar-style meta is ignored on those
// versions, so the bug cannot be avoided — only absorbed: when detected, the
// html element gets .ios-bottom-letterbox, which zeroes --safe-bottom (see
// index.css) so the bottom nav stops double-reserving space for a home
// indicator that sits in the dead strip anyway. The nav then lands flush on
// the view edge and the same-colored strip below it reads as the bar's own
// safe zone — a normal, slightly tall tab bar instead of a floating one.
const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const measureSafeTop = (): number => {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top)';
  document.body.appendChild(probe);
  const safeTop = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return safeTop;
};

const applyDetection = (): void => {
  const portrait = window.matchMedia('(orientation: portrait)').matches;
  const gap = window.screen.height - window.innerHeight;
  const safeTop = measureSafeTop();
  // The bug's signature: portrait standalone view that is shorter than the
  // screen by ~the status-bar height WHILE the page still gets fullscreen
  // safe-area insets. A healthy fullscreen view has gap 0; a healthy
  // below-the-bar view has safeTop 0.
  const letterboxed = portrait && gap >= 40 && safeTop >= 40 && Math.abs(gap - safeTop) <= 4;
  document.documentElement.classList.toggle('ios-bottom-letterbox', letterboxed);
};

export const startLetterboxCompensation = (): void => {
  if (!isStandalone()) return;
  applyDetection();
  window.addEventListener('resize', () => setTimeout(applyDetection, 100));
  window.addEventListener('orientationchange', () => setTimeout(applyDetection, 300));
};
