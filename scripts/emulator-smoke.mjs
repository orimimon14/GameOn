// Emulator Suite smoke test — run via: firebase emulators:exec "node scripts/emulator-smoke.mjs"
// Verifies auth/firestore/storage emulators are reachable and the ping callable answers.
const check = async (name, fn) => {
  try {
    return { name, ok: await fn() };
  } catch (err) {
    return { name, ok: false, error: String(err) };
  }
};

const results = await Promise.all([
  check('auth', async () => (await fetch('http://127.0.0.1:9099/')).ok),
  check('firestore', async () => (await fetch('http://127.0.0.1:8080/')).status < 500),
  // Any HTTP response proves the storage emulator is listening (its root path returns 501).
  check('storage', async () => Boolean(await fetch('http://127.0.0.1:9199/'))),
  check('functions:ping', async () => {
    const res = await fetch('http://127.0.0.1:5001/swish-game-dev/us-central1/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: {} }),
    });
    const body = await res.json();
    return body?.result?.ok === true;
  }),
]);

for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.error ? ` — ${r.error}` : ''}`);
if (!results.every((r) => r.ok)) process.exit(1);
console.log('emulator-smoke — ALL PASS');
