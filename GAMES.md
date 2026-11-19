# Vocabulary games

## Simple games (no settings screen)

`where.html` (وين؟) and `balloons.html` (البالونات) start with one tap on a category; the automatic plan plays them with the workplace cards. Each picture is introduced with a spoken prompt («وين …» + the word), praise after a right answer and a gentle «جرّب كمان مرة» after a wrong one. Difficulty adapts while playing: two first-try answers in a row add a picture (up to 4), a mistake removes one (down to 2). In «وين؟» a wrong picture fades out; in the balloons game a wrong balloon drifts away; after two mistakes the right picture glows, so every trial ends in success. Results are logged as practice and never count as assessment.

Prompts come from `assets/prompts.js`. Each plays `sounds/prompts/<name>.m4a` once recorded (the list is in `docs/sound-recording-list.pdf`); until then the device's Arabic voice reads it, and with no Arabic voice it is skipped. Recorded prompts install with the app.

Engine: `assets/mini-games.js` and `assets/mini-games.css`; layout `scripts/mini-page.html` (regenerate with `npm run build:games`). Tests: `node tests/mini-games.cjs`.

## Listening and naming games


Open `games.html` for the games. Matching and memory (below) are no longer listed in the menus; their pages stay so plans saved earlier can finish. Each game supports category/search selection, adjustable difficulty, a finite session, pause/resume, saved progress on this device, results, and optional missed-word review. Switching apps automatically pauses play and audio. Tap controls and keyboard buttons work alongside matching-card dragging.

Settings use direct radio choice cards for picture/pair counts, session length, and observation time. The category browser provides a swipeable row of illustrated tiles plus a searchable grid of all 40 categories. “تحديد” toggles the current category/search results; “تحديد الكل” toggles the entire bank. Selecting a category clears the cross-category word search, and the selected category/settings persist on this device.

| Page | Behavior | Result |
| --- | --- | --- |
| `matching.html` | Match the current picture by tapping its partner or dragging it onto a board of 2, 4, or 6 pictures. With sound enabled, the matched word plays completely before advancing. Pause/exit interrupts it intentionally. Advance between small groups when ready. | Percentage correct on the first attempt; later successful retries do not erase errors. |
| `memory.html` | First see the entire board while each matching pair glows and its word plays; then every card is covered. Find 2, 4, or 6 pairs. Hidden fronts have generic accessible names. A mismatch temporarily locks the board; pause/reload preserves the exact deck. | Completed pairs divided by attempts, plus pair and move counts. |
| `rapid.html` | Show one image with optional word/audio hints. Choose no timer or a 2, 4, or 6 second observation period, then grade “لم يتقن”, “يتعلّم”, or “أتقن”. The timer never grades automatically. The rabbit button in the header toggles a finite, unscored slideshow; each word finishes playing before the next card. | Mastered items divided by graded items, with learning counts. Missed items are available in a separate review session. |
| `test.html` | One unscored demonstration plays the word completely before the right picture glows. Then hear each test word and tap one of 2 or 4 pictures. Answers unlock after audio starts; replay handles blocked autoplay. Written labels are hidden. | Percentage correct on the first choice. Square choices stay in place on retries. An incorrect choice shakes, then the play area blurs while the target word replays; answers unlock when it finishes. |

Matching, rapid, and listening sessions sample up to 6, 10, or 20 words from the selection. Skips are recorded separately and excluded from scored denominators. Finishing before answering shows no percentage rather than a false zero. Results are practice feedback. Each game keeps its own most recent result and one resumable session in localStorage; the hub shows four game icons and titles in one row. A vocabulary revision starts a new session instead of resuming outdated cards.

## Shared vocabulary and bounded loading

`scripts/build-game-data.cjs` reads the authoritative categories and labels from `index.html`, preserving item IDs. Only pairs with existing WebP and M4A files enter `assets/game-data.js`. The current bank contains 985 items. Nine words (six repeats, بسكوت, يموت, يعيش) were removed from the mapping (left as `null` so other words keep their numbers and files). The PWA still downloads every existing source media file. Duplicate written words or identical image content are excluded from a session so choices remain distinct.

The chooser renders at most 24 preview cards, even when all categories are selected. Play loads at most 12 memory images or 7 matching images and uses one audio element. Delayed game actions are canceled on pause, exit, or restart. Cached media uses the same revisioned service worker storage as the main vocabulary app; use the home screen install icon to open the offline download popup before offline field use.

## Build and verification

Edit shared behavior/styles in `assets/games.js`, `assets/game-model.js`, and `assets/games.css`. Edit the shared game layout in `scripts/game-page.html`, then regenerate the four pages with `npm run build:games`. Run `npm run build` afterward to update CSS and the offline release. `npm run build:pwa` (or `node scripts/build-pwa.cjs`) refreshes game data automatically when vocabulary or media changes.

`npm test` checks media references, source labels, distinct choices, finite queues, and scoring. `npm run test:browser` exercises touch/drag/keyboard play, errors and retries, double taps, timed grading, saved games, phone/tablet layouts, all four games offline, and the full PWA download. Install Playwright browsers first as described in [PWA.md](PWA.md).
