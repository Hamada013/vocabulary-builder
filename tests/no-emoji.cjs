// No emoji anywhere in the app (buttons, text, messages, reports): drawn SVG icons only.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'vendor', 'recordings', 'docs', 'tests']);
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{23E9}-\u{23FA}\u{2122}\u{2139}\u{2194}-\u{21AA}\u{FE0F}]/u;
const ALLOWED = new Set(['★', '✓', '✔']); // plain text star and check marks
const found = [];
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP.has(entry.name)) continue;
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) { walk(file); continue; }
        if (!/\.(html|js|mjs|css|json|md|webmanifest)$/.test(entry.name) || /pwa-release|offline-assets|\.min\./.test(entry.name)) continue;
        fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
            for (const ch of line) if (EMOJI.test(ch) && !ALLOWED.has(ch)) { found.push(`${path.relative(root, file)}:${i + 1} ${ch}`); break; }
        });
    }
})(root);
assert.deepEqual(found, [], 'No emoji in the app');
console.log('PASS: no emoji in app files.');
