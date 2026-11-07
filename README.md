# كلمة · Vocabulary Builder

Arabic vocabulary practice with pictures and recordings: 994 words in 40 categories, a workplace for sessions, matching, memory, quick cards and listen-and-choose games, and a learner report.

Published at https://hamada013.github.io/vocabulary-builder/.

The app is standalone. It has its own launch animation and logo, its own installation and offline download, and no links to other apps or websites. There are no child accounts: one learner per device is created automatically on first launch, and progress is stored in this browser under `vocabulary-builder-v1`.

## Run locally

Serve the repository root over HTTPS or localhost (for example `npx serve .`) and open `index.html`. Opening the file directly does not provide the service worker.

## Build and check

```sh
node scripts/build-pwa.cjs           # regenerate assets/pwa-release.js after any code or media change
node scripts/build-pwa.cjs --check   # verify the release is current
npm test                             # data, game, progress and release checks
npm install && npm run test:browser  # launch, download and offline reopening in a browser
```

Pushing to `main` publishes the site with GitHub Actions (Settings → Pages → Source: GitHub Actions).

More detail: [GAMES.md](GAMES.md), [PROGRESS.md](PROGRESS.md), [HOME-LESSON.md](HOME-LESSON.md), [PWA.md](PWA.md) and [docs/learning-sequence.md](docs/learning-sequence.md).
