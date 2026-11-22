# كلمة · Vocabulary Builder

Arabic vocabulary practice with pictures and recordings: 977 words in 40 categories, a workplace for sessions, matching, memory, quick cards and listen-and-choose games, and a learner report.

Published at https://hamada013.github.io/vocabulary-builder/.

The app is standalone. It has its own launch animation and logo, its own installation and offline download, and no links to other apps or websites. Each app has its own child accounts, separate from every other app: the first launch asks for the child's name, and the accounts button beside the therapist button adds or switches children behind a short parent check. Progress, reports and the intervention plan belong to the active child. Everything is stored in this browser under `vocabulary-builder-v1`.

## Therapist mode and intervention plan

The therapist switch in the home header works like the articulation app's: a lock when closed, an open lock when open. Tapping the lock asks for the password (**013**); one tap locks it again. It stays open on this device until locked. While open, every word level is unlocked. Everything therapist-only is shown only while it is open: the **خطة التدخل** button, the plan with its long- and short-term goals, ready-made plans (بداية / متوسط / متقدم) that add their goals in one tap, each goal's 20/40/60/80% rating, each long-term goal's and the whole plan's achievement percentage, the goals section in the child's progress report, and the goals PDF (goals in progress, then goals achieved at 80% on a separate page, then references). Progress stays saved in this browser. See [docs/intervention-goals.md](docs/intervention-goals.md).

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
