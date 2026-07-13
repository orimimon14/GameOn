// iOS standalone PWA: opening the on-screen keyboard scrolls the whole web
// view upward; dismissing it sometimes leaves that offset behind (WebKit
// bug), so a dead strip appears under the bottom nav — and it grows with
// every keyboard use, surviving app switches because iOS keeps the web view
// alive. The page itself is overflow-hidden, so the user can never scroll it
// back. Whenever the keyboard is gone but an offset remains, snap back to 0.
export const startIosViewportFix = (): void => {
  const viewport = window.visualViewport;
  if (!viewport) return;

  const snapBack = (): void => {
    const keyboardClosed = viewport.height >= window.innerHeight - 60;
    const offsetLeftBehind = window.scrollY > 0 || viewport.offsetTop > 0;
    if (keyboardClosed && offsetLeftBehind) window.scrollTo(0, 0);
  };

  viewport.addEventListener('resize', snapBack);
  viewport.addEventListener('scroll', snapBack);
  // keyboard dismissal fires focusout before the viewport settles
  window.addEventListener('focusout', () => setTimeout(snapBack, 250));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') snapBack();
  });
};
