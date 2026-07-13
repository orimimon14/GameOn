// Self-updating client: installed PWAs (especially iOS) keep serving a stale
// bundle for days. Whenever the app becomes visible we compare our compiled
// __BUILD_ID__ with the freshly-deployed /version.json — a mismatch means a
// newer deploy exists, so we reload once to pick it up.
// sessionStorage survives the reload itself — guarantees at most ONE
// automatic reload per new build id, even if the fresh bundle fails to
// arrive (proxy/cache edge cases) — never a reload loop.
const RELOADED_KEY = 'swish_reloaded_for';

const checkForUpdate = async (): Promise<void> => {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' });
    if (!response.ok) return;
    const { buildId } = (await response.json()) as { buildId?: string };
    if (!buildId || buildId === __BUILD_ID__) return;
    if (sessionStorage.getItem(RELOADED_KEY) === buildId) return;
    sessionStorage.setItem(RELOADED_KEY, buildId);
    window.location.reload();
  } catch {
    // offline / dev server without version.json — never bother the user
  }
};

export const startUpdateWatcher = (): void => {
  if (import.meta.env.DEV) return; // vite dev has no version.json
  void checkForUpdate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkForUpdate();
  });
};
