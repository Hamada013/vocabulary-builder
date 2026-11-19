// Builds the two picture/sound bank lists, one word per line in copyable groups:
//   "كلمة - قائمة الصور.pdf"    pictures to design
//   "كلمة - قائمة الأصوات.pdf"  recordings to make (the words, then the app's spoken prompts)
// A word used in several categories (e.g. كرسي in common objects, furniture and school) is listed
// once, in the first category where it appears: one picture and one recording serve them all.
// Words are listed exactly as written in the app. The pictures list starts with design rules for therapy use.
//   node scripts/build-bank-lists.cjs [output folder]   (default: the folder containing this project)
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), os = require('node:os');
const { chromium } = require('playwright');
const { TEXT } = require('../assets/prompts.js');
const root = path.resolve(__dirname, '..');
const outDir = path.resolve(process.argv[2] || path.join(root, '..'));

const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const categories = vm.runInNewContext(`${source.slice(source.indexOf('const RAW_CATEGORIES ='), source.indexOf('const app ='))}; JSON.parse(JSON.stringify(CATEGORIES));`, {});
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Same word despite spelling noise (hamza forms, ى/ي, ة/ه); single letters such as ه and ة stay distinct.
const normalize = word => { const n = word.normalize('NFKC').replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim(); return n.length > 1 ? n.replace(/ة/g, 'ه') : n; };

const seen = new Set();
const groups = categories.map(category => ({ title: `${category.id}. ${category.name}`, words: category.items.map(item => item.name).filter(name => { const key = normalize(name); if (seen.has(key)) return false; seen.add(key); return true; }) })).filter(group => group.words.length);
const unique = groups.reduce((n, g) => n + g.words.length, 0);
const entries = categories.reduce((n, c) => n + c.items.length, 0);

// Entries worth a decision before designing or recording them.
const review = [
    '«بنت خايفة ولد يصرخ» (المشاعر 25): تبدو بطاقتين مدموجتين.',
    'صابونة (أشياء شائعة 28) و صابون (الأثاث 32): نفس الشيء.',
    'يجلس و يقف (الصفات 37، 38): أفعال، مكانها الأفعال أو المتضادات.',
];
// Concepts whose picture may not suit every Arab family; decide before designing.
const cultural = [
    'خنزير (المزرعة): مقبول في بعض المناطق ومرفوض في أخرى — يمكن حذفه من البنك العام.',
    'ساحرة، جنية الأسنان، ملاك، شرير: مفاهيم ثقافية/دينية — صمّمها بشكل محايد أو استبدلها.',
    'كولا: اسم تجاري — اجعلها «مشروب غازي» بدون علامة تجارية.',
    'راقصة باليه، كعب عالي، كيلوت، فستان: لباس محتشم ومناسب للأطفال.'
];
const designRules = [
    ['مفهوم واحد', 'كل صورة تُظهر شيئاً واحداً واضحاً في المنتصف ويملأ معظم المساحة، بدون عناصر تشتّت الطفل.'],
    ['خلفية بيضاء سادة', 'بدون نص أو كتابة أو إطار أو ظل كبير (عدا بطاقات الحروف والأرقام). الطفل يسمّي الصورة لا يقرؤها.'],
    ['أسلوب واحد للبنك كله', 'رسم كرتوني مسطّح، خطوط خارجية واضحة، ألوان مريحة. نفس النسب ونفس الشخصيات في كل الفئات.'],
    ['الأفعال', 'نفس الطفل يقوم بالفعل بوضوح مع ما يدلّ عليه (يشرب: الكأس عند فمه؛ يفتح: الباب نصف مفتوح). وضعية واحدة لا تحتمل فعلاً آخر.'],
    ['المشاعر', 'وجه كبير وتعبير واضح ومبالغ قليلاً؛ نسخة ولد ونسخة بنت لكل شعور.'],
    ['حروف الجر والمتضادات', 'نفس الشيء ونفس الشخصية في الصورتين، ولا يتغيّر إلا المفهوم (فوق/تحت، مفتوح/مسكّر، كبير/صغير).'],
    ['من البيت العربي', 'الأشياء والأطعمة والبيوت بالشكل المألوف في البيوت العربية (خبز عربي، إبريق، فنجان قهوة، بيوت المدن العربية).'],
    ['ملائم لكل المناطق العربية', 'لباس محتشم، بدون خنزير أو كحول أو رموز دينية، وبدون علامات تجارية. تنوّع في ملامح الأطفال ولون البشرة، والحجاب لبعض النساء.'],
    ['واضح للأطفال الصغار', 'الشيء بحجمه ولونه الحقيقيين ومن الزاوية المألوفة (التفاحة حمراء من الجانب، لا مقطوعة ولا من الأعلى) — أول صورة للكلمة هي الأوضح.'],
    ['المقاس', 'مربّع 1024×1024 بكسل على الأقل، PNG أو WebP، بنفس الهوامش حول الرسم في كل الصور.']
];

function page(title, subtitle, notes, sections) {
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="file://${encodeURI(path.join(root, 'assets/vendor/cairo.css'))}"><style>
body{font-family:Cairo,sans-serif;color:#1e293b;margin:0}
h1{font-size:20pt;margin:0 0 1mm;color:#0369a1}
.sub{margin:0 0 3mm;color:#64748b;font-size:10pt}
.notes{border:1.5px solid #fde68a;background:#fffbeb;border-radius:3mm;padding:2mm 4mm;margin:0 0 5mm;font-size:9.5pt;line-height:1.7}
.notes b{color:#92400e}
.groups{columns:3;column-gap:6mm}
section{margin:0 0 5mm}section.short{break-inside:avoid}
h2{font-size:12.5pt;margin:0 0 1mm;color:#075985;border-bottom:1.5px solid #bae6fd;break-after:avoid}
h2 small{font-size:9pt;color:#94a3b8;font-weight:600}
.guide{break-after:page}.guide-title{font-size:15pt}.guide ol{margin:2mm 0 4mm;padding-inline-start:6mm;font-size:10.5pt;line-height:1.75}.guide li{margin-bottom:1mm}
.words{white-space:pre-line;font-size:11.5pt;line-height:1.55;font-weight:600}
</style></head><body><h1>${title}</h1><p class="sub">${subtitle}</p>${notes}
<div class="groups">${sections.map(({ title, words }) => `<section${words.length <= 30 ? ' class="short"' : ''}><h2>${esc(title)} <small>(${words.length})</small></h2><div class="words">${words.map(esc).join('\n')}</div></section>`).join('')}</div></body></html>`;
}

const reviewBox = `<div class="notes"><b>للمراجعة قبل التصميم والتسجيل:</b><br>${review.map(esc).join('<br>')}</div>`;
const guide = `<div class="guide"><h2 class="guide-title">قواعد تصميم الصور لعلاج النطق واللغة</h2><ol>${designRules.map(([title, text]) => `<li><b>${esc(title)}:</b> ${esc(text)}</li>`).join('')}</ol>
<div class="notes"><b>مفاهيم تحتاج قراراً ثقافياً قبل التصميم:</b><br>${cultural.map(esc).join('<br>')}</div></div>`;
const shared = `كل كلمة مذكورة مرة واحدة، في أول فئة تظهر فيها — صورة واحدة وتسجيل واحد يكفيان كل الفئات (${entries - unique} تكرار حُذف من ${entries} بطاقة).`;
const prompts = { title: 'أصوات التطبيق (تشجيع وتعليمات)', words: Object.values(TEXT) };
const documents = [
    ['كلمة - قائمة الصور.pdf', page('قائمة الصور المطلوبة — كلمة', `${unique} صورة في ${groups.length} مجموعة. ${shared}`, guide + reviewBox, groups)],
    ['كلمة - قائمة الأصوات.pdf', page('قائمة الأصوات المطلوبة — كلمة', `${unique} كلمة + ${prompts.words.length} جملة للتطبيق. ${shared}`, reviewBox, [...groups, prompts])]
];

(async () => {
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'voc-bank-'));
    const browser = await chromium.launch();
    try {
        for (const [name, html] of documents) {
            const htmlFile = path.join(work, 'list.html'); fs.writeFileSync(htmlFile, html);
            const tab = await browser.newPage(); await tab.goto('file://' + htmlFile, { waitUntil: 'networkidle' }); await tab.evaluate(() => document.fonts.ready);
            await tab.pdf({ path: path.join(outDir, name), format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });
            await tab.close();
            console.log(path.join(outDir, name));
        }
    } finally { await browser.close(); fs.rmSync(work, { recursive: true, force: true }); }
    console.log(`${unique} unique words (from ${entries} cards), ${prompts.words.length} prompts.`);
})();
