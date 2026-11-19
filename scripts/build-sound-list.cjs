// Builds docs/sound-recording-list.pdf: every word's picture, recording file and a checkbox,
// plus the spoken prompts the games use (assets/prompts.js). Run after changing words or sounds:
//   node scripts/build-sound-list.cjs
// Uses Playwright's Chromium (devDependency) to print, sharp for thumbnails, and macOS `afinfo`
// for recording lengths when available (lengths are left blank elsewhere).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), os = require('node:os');
const { execFileSync } = require('node:child_process');
const sharp = require('sharp');
const { chromium } = require('playwright');
const { TEXT } = require('../assets/prompts.js');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/sound-recording-list.pdf');

const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const categories = vm.runInNewContext(`${source.slice(source.indexOf('const RAW_CATEGORIES ='), source.indexOf('const app ='))}; JSON.parse(JSON.stringify(CATEGORIES));`, {});
// Positions left as null in index.html: words removed (repeats or no longer needed) so later words keep their numbers.
const removed = [];
for (const category of categories) {
    const max = Math.max(0, ...category.items.map(item => item.id));
    for (let id = 1; id <= max; id++) if (!category.items.some(item => item.id === id)) removed.push({ category, id });
}

function duration(file) {
    try { return Number(/estimated duration: ([\d.]+)/.exec(execFileSync('afinfo', [file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))[1]); }
    catch { return null; }
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

(async () => {
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'voc-sound-list-'));
    try {
        // Small JPEG thumbnails keep the PDF around 3 MB instead of ~50 MB.
        let total = 0;
        const rows = [], longOnes = [];
        for (const category of categories) {
            const trs = [];
            for (const item of category.items) {
                total++;
                const thumb = path.join(work, `${category.id}-${item.id}.jpg`);
                const picture = path.join(root, item.image);
                if (fs.existsSync(picture)) await sharp(picture).resize(110, 110, { fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).jpeg({ quality: 70 }).toFile(thumb);
                const audio = path.join(root, item.audio), seconds = fs.existsSync(audio) ? duration(audio) : undefined;
                const flags = [];
                if (seconds === undefined) flags.push('<span class="flag miss">ناقص</span>');
                if (seconds > 2.2) { flags.push('<span class="flag long">طويل</span>'); longOnes.push(`${esc(item.name)} — <bdi dir="ltr">${item.audio}</bdi> (${seconds.toFixed(1)}s)`); }
                trs.push(`<tr><td class="n">${item.id}</td><td class="pic">${fs.existsSync(thumb) ? `<img src="file://${encodeURI(thumb)}">` : '—'}</td><td class="w">${esc(item.name)}</td><td class="f" dir="ltr">${item.audio}</td><td class="d" dir="ltr">${seconds ? seconds.toFixed(1) + 's' : '—'}</td><td>${flags.join(' ')}</td><td class="box"></td></tr>`);
            }
            const gaps = removed.filter(entry => entry.category === category).map(entry => entry.id);
            rows.push(`<section class="cat"><h2><span class="num">${category.id}</span> ${esc(category.name)} <small>${category.items.length} كلمة · المجلد <bdi dir="ltr">sounds/${category.id}/</bdi></small></h2>${gaps.length ? `<p class="gap">الأرقام ${gaps.join('، ')} حُذفت (كلمات محذوفة) — لا تسجّلها.</p>` : ''}<table><thead><tr><th>#</th><th>الصورة</th><th>الكلمة</th><th>اسم الملف</th><th>المدة</th><th>ملاحظة</th><th>✓</th></tr></thead><tbody>${trs.join('')}</tbody></table></section>`);
        }
        // New prompts, grouped as the games use them.
        const use = { 'praise-2': 'للولد', 'praise-3': 'للبنت', 'praise-1': 'يُختار عشوائياً بعد كل إجابة صحيحة', 'retry-1': 'بعد الخطأ، بلطف', 'retry-3': 'بعد خطأين',
            'ask-where': 'تُقال قبل الكلمة: «وين … تفاحة»', 'ask-show': 'بديل لـ «وين»', 'ask-what': 'للتسمية في البطاقات السريعة', 'ask-say': 'نمذجة: «قول … تفاحة»',
            'ask-same': 'لعبة المطابقة', 'ask-listen': 'قبل «استمع واختر»', 'ask-turn': 'عندما ينتظر التطبيق الطفل', 'start-1': 'بداية كل لعبة', 'start-2': 'بداية الجلسة',
            'count-1': 'العدّ ١-٢-٣', 'done-1': 'نهاية اللعبة', 'stars-10': 'احتفال النجوم العشر', 'break-1': 'عند الاستراحة', 'hello': 'شاشة البداية' };
        const groups = [['التشجيع', /^praise/], ['المحاولة من جديد', /^retry/], ['التعليمات', /^ask/], ['بداية ونهاية النشاط', /^(start|count|done|stars|break|hello)/]];
        let n = 0;
        const prompts = groups.map(([title, pattern]) => `<h3>${title}</h3><table class="prompts"><thead><tr><th>#</th><th>الجملة المطلوب تسجيلها</th><th>اسم الملف</th><th>الاستخدام</th><th>✓</th></tr></thead><tbody>${Object.entries(TEXT).filter(([name]) => pattern.test(name)).map(([name, text]) => {
            const done = fs.existsSync(path.join(root, `sounds/prompts/${name}.m4a`));
            return `<tr><td class="n">${++n}</td><td class="w">${esc(text)}${done ? ' <span class="flag ok">مسجّل</span>' : ''}</td><td class="f" dir="ltr">sounds/prompts/${name}.m4a</td><td class="u">${use[name] || ''}</td><td class="box"></td></tr>`;
        }).join('')}</tbody></table>`).join('');
        const removedList = removed.map(({ category, id }) => `<li>${esc(category.name)}: الرقم ${id}</li>`).join('');
        const date = new Date().toISOString().slice(0, 10);
        const fileUrl = p => 'file://' + encodeURI(path.join(root, p));
        const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="${fileUrl('assets/vendor/cairo.css')}"><style>
body{font-family:Cairo,sans-serif;color:#1e293b;font-size:11pt;margin:0}
h1{font-size:26pt;margin:0 0 4mm;color:#0369a1}
h2{font-size:15pt;margin:0 0 3mm;padding:2mm 3mm;background:#e0f2fe;border-radius:3mm;color:#075985;break-after:avoid}
h2 small{font-size:9.5pt;color:#475569;font-weight:600;margin-inline-start:3mm}
h2 .num{display:inline-block;min-width:9mm;text-align:center;background:#0284c7;color:#fff;border-radius:2mm;margin-inline-end:2mm}
h3{font-size:12.5pt;margin:6mm 0 2mm;color:#047857}
.cover p,.cover li{line-height:1.75}
.box-note{border:1.5px solid #bae6fd;background:#f0f9ff;border-radius:3mm;padding:3mm 5mm;margin:4mm 0}
.stats{display:flex;gap:4mm;margin:5mm 0}.stats div{flex:1;border:1px solid #cbd5e1;border-radius:3mm;padding:3mm;text-align:center}.stats b{display:block;font-size:20pt;color:#0284c7}
table{width:100%;border-collapse:collapse;margin-bottom:6mm}thead{display:table-header-group}tr{break-inside:avoid}
th{background:#f1f5f9;font-size:9pt;padding:1.5mm;border-bottom:1.5px solid #94a3b8;text-align:right}
td{border-bottom:1px solid #e2e8f0;padding:1mm 1.5mm;vertical-align:middle}
td.n{width:8mm;text-align:center;color:#64748b;font-weight:700}
td.pic{width:15mm}td.pic img{width:13mm;height:13mm;object-fit:contain;display:block}
td.w{font-size:13.5pt;font-weight:800}
td.f{font-family:Menlo,monospace;font-size:8.5pt;color:#475569;width:34mm;text-align:left}
td.d{font-size:8.5pt;color:#64748b;width:11mm;text-align:left}td.u{font-size:9pt;color:#475569}
td.box{width:7mm}td.box:after{content:"";display:block;width:4.5mm;height:4.5mm;border:1.4px solid #64748b;border-radius:1mm;margin:auto}
.flag{font-size:8pt;padding:.3mm 2mm;border-radius:2mm;font-weight:700;white-space:nowrap}
.long{background:#fee2e2;color:#991b1b}.miss{background:#e2e8f0}.ok{background:#d1fae5;color:#065f46}
.gap{margin:0 0 2mm;font-size:9.5pt;color:#92400e;background:#fef3c7;border-radius:2mm;padding:1mm 3mm}
.cat{break-before:page}ul.small li{font-size:10pt}.prompts td.w{font-size:14pt}
</style></head><body>
<section class="cover"><h1>قائمة تسجيل الأصوات — تطبيق كلمة</h1>
<p>كل ملفات الصوت في التطبيق، مرتّبة حسب الفئة كما تظهر فيه، مع صورة كل كلمة لتعرف ما الذي تسجّله. ضع علامة ✓ بعد تسجيل كل كلمة. (${date})</p>
<div class="stats"><div><b>${total}</b>كلمة مسجّلة</div><div><b>${categories.length}</b>فئة</div><div><b>${n}</b>صوت جديد مقترح</div><div><b>${removed.length}</b>كلمات حُذفت</div></div>
<div class="box-note"><b>طريقة التسجيل لتبقى الأصوات متناسقة</b><ul>
<li>غرفة هادئة بدون صدى، ونفس المسافة من الميكروفون (حوالي شبر) لكل الكلمات.</li>
<li>بنفس اللهجة ونفس الصوت ونفس السرعة؛ نطق واضح وبطيء قليلاً كما يُقال للطفل.</li>
<li>نصف ثانية صمت تقريباً قبل الكلمة وبعدها، بدون نَفَس أو نقرات.</li>
<li>كلمة واحدة في كل ملف. الصيغة <bdi dir="ltr">.m4a</bdi> (من تطبيق «مذكّرات صوتية» في الآيفون مباشرة).</li>
<li>اسم الملف هو رقم الكلمة فقط، ويوضع في مجلد الفئة: مثلاً «تفاحة» رقمها 1 في الفواكه (6) ← <bdi dir="ltr">sounds/6/1.m4a</bdi>.</li>
<li>بعد استبدال الملفات أرسلها لي، وأنا أضبط مستوى الصوت وأقصّ الصمت الزائد وأحدّث التطبيق.</li></ul></div>
<div class="box-note"><b>للمراجعة قبل التسجيل</b>
${removed.length ? `<p>حُذفت هذه الكلمات (مكرّرة أو غير مطلوبة) مع صورها وأصواتها. الأرقام تتخطى هذه المواضع، وباقي الكلمات بقيت بأرقامها — لا تسجّل هذه الأرقام:</p><ul class="small">${removedList}</ul>` : ''}
${longOnes.length ? `<p>تسجيلات أطول من المعتاد (ربما فيها صمت أو جملة طويلة):</p><ul class="small">${longOnes.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}</div></section>
<section class="cat"><h2><span class="num">+</span> أصوات جديدة للتطبيق <small>المجلد <bdi dir="ltr">sounds/prompts/</bdi></small></h2>
<p>تجعل الألعاب تتكلّم مع الطفل: تعليمة قبل الكلمة، وتشجيع بعد الصواب، وتشجيع لطيف بعد الخطأ. حتى تسجيلها، يقرؤها صوت الجهاز. غيّر أي جملة كما تحب.</p>${prompts}</section>
${rows.join('')}</body></html>`;
        const htmlFile = path.join(work, 'list.html'); fs.writeFileSync(htmlFile, html);
        const browser = await chromium.launch();
        const page = await browser.newPage(); await page.goto('file://' + htmlFile, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
        await page.pdf({ path: output, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<div></div>',
            footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#94a3b8"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
            margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' } });
        await browser.close();
        console.log(`${path.relative(root, output)}: ${total} words, ${n} prompts, ${removed.length} removed words.`);
    } finally { fs.rmSync(work, { recursive: true, force: true }); }
})();
