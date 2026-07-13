// iOS home-screen apps: after the keyboard closes (or a rubber-band drag),
// WebKit sometimes leaves the whole layout viewport scrolled upward and never
// restores it — a dead strip appears under the bottom nav and grows over the
// session. Snapping the window scroll back to the origin whenever the visual
// viewport settles removes the strip. The app never scrolls at the window
// level by design (body is overflow-hidden; scrolling happens in inner
// containers), so snapping to 0 is always safe outside text editing.
const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isTyping = (): boolean => {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    (active instanceof HTMLElement && active.isContentEditable)
  );
};

const snapBack = (): void => {
  if (isTyping()) return; // the keyboard legitimately shifts the view while editing
  if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
  const viewport = window.visualViewport;
  if (viewport && (viewport.offsetTop > 0 || viewport.pageTop > 0)) window.scrollTo(0, 0);
};

export const startViewportLock = (): void => {
  if (!isStandalone()) return;
  window.visualViewport?.addEventListener('resize', () => setTimeout(snapBack, 50));
  document.addEventListener('focusout', () => setTimeout(snapBack, 120));
  window.addEventListener('scroll', () => setTimeout(snapBack, 50));
};
