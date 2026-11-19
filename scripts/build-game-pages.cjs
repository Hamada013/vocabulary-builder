// Run when changing scripts/game-page.html or scripts/mini-page.html; generates consistent,
// semantic Arabic pages while keeping their existing public URLs.
const fs = require('node:fs');
const path = require('node:path');
const { MODES } = require('../assets/game-model.js');
const { MINI_MODES } = require('../assets/mini-games.js');
const root = path.resolve(__dirname, '..');
const pages = [[path.join(__dirname, 'game-page.html'), MODES], [path.join(__dirname, 'mini-page.html'), MINI_MODES]];
for (const [file, modes] of pages) {
    const template = fs.readFileSync(file, 'utf8');
    for (const [mode, meta] of Object.entries(modes)) {
        fs.writeFileSync(path.join(root, `${mode}.html`), template.replaceAll('{{MODE}}', mode).replaceAll('{{TITLE}}', meta.title).replaceAll('{{DESCRIPTION}}', meta.description));
    }
}
