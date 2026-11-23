# Child progress and game plans

Each app has its own child accounts, separate from every other app: the first launch asks for the child's name, and the accounts button beside the therapist button adds or switches children behind a short parent check. Progress, reports and the intervention plan belong to the active child. Workplace cards, completed practice, per-skill results, game preferences, paused games and the active game plan are stored in this browser's local storage under `vocabulary-builder-v1`. There is no server account or synchronization between devices. Removing browser data also removes this progress.

The book button beside **اختر صورة للبطاقة** switches the existing category picker between learning cards and mastered cards. A card is mastered only after both receptive and expressive evidence reach 100%. Earned mastery is retained for later review. Learned cards can still be selected and used again.

Completed workplace tests and **استمع واختر** record receptive responses. A corrected answer after an error does not count as a first-attempt success. Completed, manually graded **البطاقات السريعة** sessions record expressive responses. Skipped cards do not earn mastery; ungraded automatic viewing, matching, memory, practice, and incomplete sessions do not earn skill mastery.

Each child account has a level (سهل / متوسط / متقدم), chosen when the child is added and editable with the name at any time in the accounts window. The level sets 2 / 4 / 6 pictures and a 6 / 4 / 2-second naming time everywhere.

Pressing **تدريب** in the workplace runs the whole chain by itself: practice (the right card glows blue) → every card missed in practice is shown once, big, with its word, then 1 second → the test → every card failed in the test is shown the same way → the games box. **اختبار** alone runs the test, the repetition of failed cards and the games box. The games box always starts with «وين؟» and offers المطابقة, الذاكرة, استمع واختر (comprehension test) and البطاقات السريعة (naming test); the route plays them in that order with the workplace cards, at the child's level. The 1-2-3 countdown plays at the start of «وين؟» (after its demonstration); later games open straight away or after one large ▶ tap when the browser needs a touch before sound. Rounds saved for retired games (balloons, اكشف الصورة) are skipped.

Word levels follow the child's level: سهل levels hold 2–3 words (the original levels and their saved progress), متوسط up to 4 and متقدم up to 6, each with its own progress. Two words with the same picture or label never share a level.

Workplace tools carry one-word labels; the child's account button is on the home screen. Delete mode turns itself off 2 seconds after the last tap (each deleted card restarts the 2 seconds).

In البطاقات السريعة the beat bar starts empty for every card; the therapist adds circles with + (up to 6) and removes them with −. Tapping a circle lights and clicks it; tapping the bar plays them in order.

| Choice | Matching / listening choices and memory pairs | Rapid observation time |
| --- | --- | --- |
| Easy | 2 | 6 seconds |
| Moderate | 4 | 4 seconds |
| Advanced | 6 | 2 seconds |

The plan carries the exact workplace cards. Choice counts are capped by the selected pool. Memory uses several boards when necessary to include every card. Before production assessment, the plan introduces every selected word once as a large picture with its full audio over a blurred play area. The subsequent production trials hide labels and do not automatically play the answer before grading. Memory boards first reveal all cards, glow each matching pair with its full audio, then cover the board. Listening starts with one unscored demonstration: the word finishes playing before the correct picture glows. Preview cursors persist across pause/reload and audio failures offer the replay control. Every workplace practice/test and newly launched or resumed game starts with a cancellable, colorful 1–2–3 animation over a blurred background. Completed automatic rounds move directly into the next game’s countdown without a result screen. The plan can be paused, resumed after reload, or stopped. A one-card template remains a one-card activity without unrelated distractors.

Run `npm test`, `npm run test:browser` and `npm run test:progress:browser`. Browser commands accept `VOC_PLAYWRIGHT` (or `APP_PLAYWRIGHT`) to locate Playwright. Rebuild the release with `npm run build:pwa` after production edits.

## Route breaks, games and the camera mirror

- Between two route games the child gets a short play break (`assets/interlude.js` / `.css`): one random scene to touch (stars shine, bubbles pop, flowers spin, a school of fish scatters) around a plain circle with turning rings. Tapping the circle starts the next game; that tap also lets the browser play sound. With reduced motion nothing moves on its own.
- «وين؟» scenes give each object its own spots with a gap between cards; a card «behind» something always peeks out over its top or side.
- The memory game shows every new board face-up for a few seconds, then turns the cards over.
- «استمع واختر» cards are square (1:1).
- The speaking game (البطاقات السريعة) has a camera button in the header (`assets/mirror.js` / `.css`, shared with جملة): the screen splits into two equal squares, the card and the front camera. The adult can record and play the clip back in a loop. Recordings stay in memory only: nothing is saved or sent, and the camera turns off when the mirror closes or the page is hidden.
- The practice highlight picks baby blue, baby green or baby red for each session (`assets/glow-colour.js`).
- The تدريب button uses the same route icon as مقطع's automatic route.
- No emoji anywhere in the app; `tests/no-emoji.cjs` checks every shipped file.

## Therapist mode

Therapist mode (password 013, current tab only) makes every word level available without marking any level completed; the child's own results still count. The intervention plan is stored on the learner as `intervention` and merges safely with other open tabs. See [docs/intervention-goals.md](docs/intervention-goals.md).

The plan window has three tabs: الخطة, التقدم (in progress / achieved / suggested next goals) and بنك الأهداف. In the child's report every chart is a bar chart (comprehension and expression accuracy, and acquisition per category). The report's print button opens a window to choose the reports — progress summary, acquisition by category, and (with therapist mode open) the plan's goals — and each downloads as its own PDF.

Goal estimates (`InterventionGoals.estimate` in `assets/intervention-goals.js`): each measured goal follows the tests linked to it (comprehension by number of pictures, verbs, new categories, colours, shapes, numbers, adjectives and opposites, prepositions; naming by response time, verbs and core words; matching first tries; words remembered after 14+ days). Each session moves the estimate halfway toward that session's score, so it builds up or falls back over time. A goal is achieved after 3 sessions in a row at 80% or more and then stays achieved. The therapist's 20/40/60/80% rating, when newer than the last measured session, takes the estimate's place. Achieved goals turn green in the plan; the progress report and goals PDF have three parts: red (in progress), green (achieved) and yellow (suggested: the next goal after an achieved one).

## Activity reports



The header report icon opens the learner's report directly in a popup over the app. Persistent icon buttons switch between all saved activity, the last 6 months, the last 3 months, the last 30 days, the last 7 days, and today; no period prompt is shown. Three- and six-month ranges use calendar-month arithmetic, clamped at month ends. Switching filters updates the same popup, and its PDF button exports the selected period. Existing report-page links remain available. The report shows session/card/category totals, comprehension and expression percentages, and bars for the categories used. Practice, memory, matching, and ungraded automatic viewing do not inflate assessment percentages. A missing score is shown as an em dash instead of 0%. The PDF button saves a report with today's numeric date and the same charts. PDF creation uses local fonts and a local library and remains available offline after downloading the app.

Dated activity is recorded from this update. Previously stored per-word results are preserved as clearly labeled earlier summaries; they cannot reconstruct missing historical sessions. Reports are local to this device/browser, like the child profiles.

Run `npm run test:admin:browser` for the admin, countdown, icon-only dialog, score-independent prompt, report filters, PDF download, and pagination regression checks.

After the final automatic round, a parents icon appears in the workplace header. It opens an editable Arabic home-play lesson with the child’s name, selected words, separate comprehension/naming results, and short routines using real objects, pictures, actions and everyday play. Unassessed words are identified explicitly. Only the completed plan supplies its results; partial plans and previews cannot replace that lesson. The note can be copied or shared through the device’s share sheet and stays available after reload. See [HOME-LESSON.md](HOME-LESSON.md) for a reusable sample.

## Category acquisition charts

The report's collapsed category details contain grouped bars (baby blue comprehension, green expression), paired acquisition pie charts, and a numeric table. Each domain counts unique words meeting VOC's existing all-correct acquisition rule in their latest completed test within the selected period, divided by the category's actual catalog size. Practice and partial tests show that a category was worked on without acquiring words. Repeated attempts do not increase the denominator; a later complete failed test can reduce the count. Only worked categories appear. For reports combining children, each child's catalog is a separate set of opportunities. The accuracy summaries above the charts remain response accuracy, not catalog completion. The offline PDF includes the same charts. `assets/acquisition-charts.js` and `.css` are identical local copies in VOC/SENB so each app remains independently hostable. Run `npm run test:report-charts` and `npm run test:report-charts:browser` (with `APP_ENGINE=webkit` for WebKit).

## Workplace delete mode

The trash button toggles a temporary red edit mode. Only filled cards wiggle; pressing a card empties that slot without sound or a dialog. Empty slots do nothing while the mode is active. Toggle the trash button or press Escape to finish; clearing the last card also ends the mode. Leaving the workplace, changing profiles, or starting practice/testing exits it. Deleted card assignments are saved, while delete mode itself is not restored after reload. Reduced-motion preferences keep the red borders without the wiggle. Run `npm run test:delete:browser`, with `APP_ENGINE=webkit` for WebKit. The matching local `assets/delete-mode.css` in VOC and SENB is intentionally identical.
