// Bundle safety scan — fails the build if any forbidden string ships to the client.
// Canonical list: docs/quality/CI_CD.md / WORK_PLAN §3.2.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const FORBIDDEN = [
  'GEMINI_API_KEY',
  'PAYMENT_WEBHOOK_SECRET',
  'PAYMENT_API_SECRET',
  'PAYMENT_API_KEY',
  'process.env.API_KEY',
  'gemini-3-flash-preview',
  '@google/genai',
];

if (!existsSync(DIST)) {
  console.error(`scan:bundle — "${DIST}/" not found. Run "npm run build" first.`);
  process.exit(1);
}

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(full);
  }
};
walk(DIST);

const hits = [];
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const needle of FORBIDDEN) {
    if (content.includes(needle)) hits.push({ file, needle });
  }
}

if (hits.length > 0) {
  console.error('scan:bundle — FORBIDDEN STRINGS FOUND IN BUNDLE:');
  for (const { file, needle } of hits) console.error(`  ${file}: ${needle}`);
  process.exit(1);
}

console.log(`scan:bundle — PASS (${files.length} files clean)`);
