// Builds docs/pictures-to-regenerate.pdf: the app's words grouped by category, as plain copyable
// text (one word per line) for regenerating the pictures with an image generator.
//   node scripts/build-regenerate-list.cjs         every word
//   node scripts/build-regenerate-list.cjs --low   only words whose picture is 400px or smaller
// Words are listed in picture-number order, so returned pictures can be matched back by position.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), os = require('node:os');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/pictures-to-regenerate.pdf');
const onlyLow = process.argv.includes('--low');

const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const categories = vm.runInNewContext(`${source.slice(source.indexOf('const RAW_CATEGORIES ='), source.indexOf('const app ='))}; JSON.parse(JSON.stringify(CATEGORIES));`, {});
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

(async () => {
    let groups = categories.map(category => ({ category, items: category.items.filter(item => fs.existsSync(path.join(root, item.image))) }));
    if (onlyLow) {
        const sharp = require('sharp');
        for (const group of groups) {
            const low = [];
            for (const item of group.items) { const m = await sharp(path.join(root, item.image)).metadata(); if (Math.max(m.width, m.height) <= 400) low.push(item); }
            group.items = low;
        }
    }
    groups = groups.filter(group => group.items.length);
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="file://${encodeURI(path.join(root, 'assets/vendor/cairo.css'))}"><style>
body{font-family:Cairo,sans-serif;color:#1e293b;margin:0}
h1{font-size:20pt;margin:0 0 1mm;color:#0369a1}
.sub{margin:0 0 5mm;color:#64748b;font-size:10pt}
.groups{columns:3;column-gap:6mm}
section{margin:0 0 5mm}section.short{break-inside:avoid}h2{break-after:avoid}
h2{font-size:12.5pt;margin:0 0 1mm;color:#075985;border-bottom:1.5px solid #bae6fd}
h2 small{font-size:9pt;color:#94a3b8;font-weight:600}
.words{white-space:pre-line;font-size:11.5pt;line-height:1.55;font-weight:600}
</style></head><body>
<h1>${onlyLow ? 'كلمات الصور منخفضة الدقة' : 'كلمات صور التطبيق'}</h1>
<p class="sub">${total} كلمة في ${groups.length} مجموعة</p>
<div class="groups">${groups.map(({ category, items }) => `<section${items.length <= 30 ? ' class="short"' : ''}><h2>${category.id}. ${esc(category.name)} <small>(${items.length})</small></h2><div class="words">${items.map(item => esc(item.name)).join('\n')}</div></section>`).join('')}</div>
</body></html>`;
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'voc-words-'));
    try {
        const htmlFile = path.join(work, 'list.html'); fs.writeFileSync(htmlFile, html);
        const browser = await chromium.launch();
        const page = await browser.newPage(); await page.goto('file://' + htmlFile, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
        await page.pdf({ path: output, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });
        await browser.close();
    } finally { fs.rmSync(work, { recursive: true, force: true }); }
    console.log(`${path.relative(root, output)}: ${total} words in ${groups.length} groups.`);
})();
