// Imports the therapist's recordings into the app as small m4a files.
//   recordings/01/01.mp3 …  one folder per category (01–40), files numbered in the order of the
//                           recording list (docs/كلمة - قائمة الأصوات.pdf): each word once, in the
//                           first category where it appears; later repeats reuse that recording.
//   recordings/41/01.mp3 …  the app's spoken prompts, in the order of assets/prompts.js.
// Output: sounds/<category>/<card>.m4a for every card, and sounds/prompts/<name>.m4a.
// Imported 2026-11-23. Words removed afterwards (7 instruments, موسيقي) change the counts, so a
// re-run against those same recordings stops; new recordings follow the current list.
// The script stops without writing anything if a folder's count does not match the word list,
// so a recording can never land on the wrong word. Needs macOS (afconvert).
//   node scripts/import-recordings.cjs
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { TEXT } = require('../assets/prompts.js');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'recordings');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const categories = vm.runInNewContext(`${html.slice(html.indexOf('const RAW_CATEGORIES ='), html.indexOf('const app ='))}; JSON.parse(JSON.stringify(CATEGORIES));`, {});
// Same rule as the recording list: hamza forms, ى/ي and ة/ه do not make a different word.
const normalize = word => { const n = word.normalize('NFKC').replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim(); return n.length > 1 ? n.replace(/ة/g, 'ه') : n; };
const pad = n => String(n).padStart(2, '0');
const files = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^\d+\.mp3$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b)) : [];

// Plan every conversion first; write nothing unless all counts match.
const firstRecording = new Map(), jobs = [], problems = [];
for (const category of categories) {
    const recorded = files(path.join(source, pad(category.id)));
    const fresh = category.items.filter(item => !firstRecording.has(normalize(item.name)));
    if (recorded.length !== fresh.length) { problems.push(`${pad(category.id)} ${category.name}: ${recorded.length} recordings for ${fresh.length} words`); continue; }
    fresh.forEach((item, i) => firstRecording.set(normalize(item.name), path.join(source, pad(category.id), recorded[i])));
    for (const item of category.items) jobs.push({ from: firstRecording.get(normalize(item.name)), to: path.join(root, item.audio), word: item.name });
}
const promptNames = Object.keys(TEXT), prompts = files(path.join(source, '41'));
if (prompts.length !== promptNames.length) problems.push(`41 prompts: ${prompts.length} recordings for ${promptNames.length} sentences`);
else promptNames.forEach((name, i) => jobs.push({ from: path.join(source, '41', prompts[i]), to: path.join(root, 'sounds/prompts', `${name}.m4a`), word: TEXT[name] }));
if (problems.length) { console.error('Nothing imported. These folders do not match the word list:\n  ' + problems.join('\n  ')); process.exit(1); }

// Mono AAC at 48 kbps: clear speech, about a fifth smaller than the mp3 originals.
const converted = new Map();
for (const job of jobs) {
    fs.mkdirSync(path.dirname(job.to), { recursive: true });
    if (converted.has(job.from)) { fs.copyFileSync(converted.get(job.from), job.to); continue; }
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-c', '1', '-b', '48000', job.from, job.to]);
    converted.set(job.from, job.to);
}
const lines = ['card,word,recording', ...jobs.map(job => [path.relative(root, job.to), `"${job.word}"`, path.relative(root, job.from)].join(','))];
fs.writeFileSync(path.join(root, 'docs/recordings-map.csv'), lines.join('\n') + '\n');
console.log(`Imported ${converted.size} recordings into ${jobs.length} app sounds (docs/recordings-map.csv lists each one).`);
