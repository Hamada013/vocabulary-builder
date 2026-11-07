# Offline app

كلمة is a standalone installable app. `manifest.webmanifest`, `sw.js` and `assets/pwa-release.js` sit at the repository root, so the published address (https://hamada013.github.io/vocabulary-builder/) is the install scope. The worker caches the app interface as one release; pictures and recordings download only when the download icon in the home header is used. Its caches are named after this repository, so other apps on the same GitHub Pages address are never touched.

Run `node scripts/build-pwa.cjs` after changing any app code or media, and commit the regenerated `assets/pwa-release.js`. `node scripts/build-pwa.cjs --check` and `npm test` verify the release; `node tests/standalone-browser.cjs` checks the launch, the download and offline reopening in a browser.
