// Renders docs/operations/legal/PRIVACY_AND_TERMS.md into two static,
// self-contained RTL pages served by hosting: public/privacy.html (§2) and
// public/terms.html (§3). Static files beat the SPA rewrite in Firebase
// hosting, so the URLs are stable for App Store / Play Store review.
// Re-run after every edit to the legal doc:  node scripts/build-legal-pages.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE = 'docs/operations/legal/PRIVACY_AND_TERMS.md';
const raw = readFileSync(SOURCE, 'utf8');

const esc = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const inline = (s) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

const mdToHtml = (md) => {
  const out = [];
  const lines = md.split('\n');
  let list = false;
  let table = false;
  const closeBlocks = () => {
    if (list) {
      out.push('</ul>');
      list = false;
    }
    if (table) {
      out.push('</table>');
      table = false;
    }
  };
  for (const line of lines) {
    const t = line.trimEnd();
    if (/^\|[\s:-|]+\|$/.test(t)) continue; // table separator row
    if (t.startsWith('|')) {
      if (!table) {
        closeBlocks();
        out.push('<table>');
        table = true;
      }
      const cells = t.split('|').slice(1, -1).map((c) => inline(c.trim()));
      out.push(`<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`);
      continue;
    }
    if (/^[-*] /.test(t.trim())) {
      if (table) {
        out.push('</table>');
        table = false;
      }
      if (!list) {
        out.push('<ul>');
        list = true;
      }
      out.push(`<li>${inline(t.trim().slice(2))}</li>`);
      continue;
    }
    closeBlocks();
    if (t.startsWith('#### ')) out.push(`<h4>${inline(t.slice(5))}</h4>`);
    else if (t.startsWith('### ')) out.push(`<h3>${inline(t.slice(4))}</h3>`);
    else if (t.startsWith('## ')) out.push(`<h2>${inline(t.slice(3))}</h2>`);
    else if (t.startsWith('# ')) out.push(`<h1>${inline(t.slice(2))}</h1>`);
    else if (t.trim() === '---') out.push('<hr>');
    else if (t.trim()) out.push(`<p>${inline(t)}</p>`);
  }
  closeBlocks();
  return out.join('\n');
};

const page = (title, body) => `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Swish & Game</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Rubik, Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px 16px 64px; line-height: 1.7; }
  main { max-width: 760px; margin: 0 auto; }
  h1 { font-size: 1.6rem; color: #fff; } h2 { font-size: 1.25rem; color: #fff; margin-top: 2.2em; border-bottom: 1px solid #334155; padding-bottom: 6px; }
  h3 { font-size: 1.05rem; color: #f1f5f9; margin-top: 1.6em; } h4 { color: #f1f5f9; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 0.9rem; display: block; overflow-x: auto; }
  td { border: 1px solid #334155; padding: 6px 10px; vertical-align: top; }
  code { background: #1e293b; border-radius: 4px; padding: 1px 5px; font-size: 0.9em; }
  a { color: #93c5fd; } hr { border: 0; border-top: 1px solid #334155; margin: 28px 0; }
  .top { font-size: 0.85rem; margin-bottom: 24px; } .top a { margin-inline-end: 16px; }
</style>
</head>
<body>
<main>
<nav class="top"><a href="/">→ חזרה לאפליקציה</a><a href="/privacy.html">מדיניות פרטיות</a><a href="/terms.html">תנאי שימוש</a></nav>
${body}
</main>
</body>
</html>
`;

const section = (from, to) => {
  const start = raw.indexOf(from);
  const end = raw.indexOf(to);
  if (start < 0 || end < 0) throw new Error(`section markers not found: ${from} … ${to}`);
  return raw.slice(start, end);
};

writeFileSync(
  'public/privacy.html',
  page('מדיניות פרטיות', mdToHtml(section('# 2. Privacy Policy', '# 3. Terms of Service'))),
);
writeFileSync(
  'public/terms.html',
  page('תנאי שימוש', mdToHtml(section('# 3. Terms of Service', '# 4. Open Items'))),
);
console.log('legal pages built: public/privacy.html, public/terms.html');
