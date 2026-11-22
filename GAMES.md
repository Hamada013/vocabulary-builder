# Vocabulary games

## «وين؟» (where.html)

A simple drawn scene (a room, a garden or a bedroom) with the cards placed on, under, above, in front of and behind its objects. The app says «وين» + the word and the child taps that card. Each game opens with an automatic demonstration (a hand shows the right card), then the 1-2-3 countdown. Each word is asked once; the child's level (set on the account) gives 2, 3 or 4 cards. Wide screens get a 5:3 scene, tall phones a square one with bigger cards; cards never overlap. A wrong card fades and a gentle «جرّب كمان مرة» plays; after two mistakes the right card glows, so every turn ends in success. Results are logged as practice. One tap on a category starts a free game; the automatic route uses the workplace cards.

Prompts come from `assets/prompts.js` and play the therapist's recordings in `sounds/prompts/` (the device's Arabic voice only if a recording is missing).

Engine: `assets/mini-games.js` and `assets/mini-games.css`; layout `scripts/mini-page.html` (regenerate with `npm run build:games`). Tests: `node tests/mini-games.cjs`.

## Matching and memory

Practice games with a brighter look: big rounded cards in soft colours, spoken praise in the therapist's voice, a star burst on a right answer and a gentle «جرّب كمان مرة» on a mistake. In the automatic route they open straight away at the child's level, without the setup screen.

## Recordings

`recordings/01–40` hold the therapist's recordings (one per word, in the order of the recording list; later repeats reuse the first recording) and `recordings/41` the 25 prompts. `node scripts/import-recordings.cjs` converts them into the app's small m4a files (`sounds/<category>/<card>.m4a`, `sounds/prompts/<name>.m4a`) and lists every mapping in `docs/recordings-map.csv`. It stops without writing anything if a folder's count does not match the word list. `recordings/` is not part of the site or the offline download.

## Listening and naming games


Open `games.html` for the games, in route order: وين؟, المطابقة, الذاكرة, استمع واختر, البطاقات السريعة. Each game supports category/search selection, adjustable difficulty, a finite session, pause/resume, saved progress on this device, results, and optional missed-word review. Switching apps automatically pauses play and audio. Tap controls and keyboard buttons work alongside matching-card dragging.

Settings use direct radio choice cards for picture/pair counts, session length, and observation time. The category browser provides a swipeable row of illustrated tiles plus a searchable grid of all 40 categories. “تحديد” toggles the current category/search results; “تحديد الكل” toggles the entire bank. Selecting a category clears the cross-category word search, and the selected category/settings persist on this device.

| Page | Behavior | Result |
| --- | --- | --- |
| `matching.html` | Match the current picture by tapping its partner or dragging it onto a board of 2, 4, or 6 pictures. With sound enabled, the matched word plays completely before advancing. Pause/exit interrupts it intentionally. Advance between small groups when ready. | Percentage correct on the first attempt; later successful retries do not erase errors. |
| `memory.html` | First see the entire board while each matching pair glows and its word plays; then every card is covered. Find 2, 4, or 6 pairs. Hidden fronts have generic accessible names. A mismatch temporarily locks the board; pause/reload preserves the exact deck. | Completed pairs divided by attempts, plus pair and move counts. |
| `rapid.html` | Show one image with optional word/audio hints. Choose no timer or a 2, 4, or 6 second observation period, then grade “لم يتقن”, “يتعلّم”, or “أتقن”. The timer never grades automatically. The rabbit button in the header toggles a finite, unscored slideshow; each word finishes playing before the next card. | Mastered items divided by graded items, with learning counts. Missed items are available in a separate review session. |
| `test.html` | One unscored demonstration plays the word completely before the right picture glows. Then hear each test word and tap one of 2 or 4 pictures. Answers unlock after audio starts; replay handles blocked autoplay. Written labels are hidden. | Percentage correct on the first choice. Square choices stay in place on retries. An incorrect choice shakes, then the play area blurs while the target word replays; answers unlock when it finishes. |

Matching, rapid, and listening sessions sample up to 6, 10, or 20 words from the selection. Skips are recorded separately and excluded from scored denominators. Finishing before answering shows no percentage rather than a false zero. Results are practice feedback. Each game keeps its own most recent result and one resumable session in localStorage; the hub shows four game icons and titles in one row. A vocabulary revision starts a new session instead of resuming outdated cards.

## Shared vocabulary and bounded loading

`scripts/build-game-data.cjs` reads the authoritative categories and labels from `index.html`, preserving item IDs. Only pairs with existing WebP and M4A files enter `assets/game-data.js`. The current bank contains 977 items. Seventeen words (six repeats, بسكوت, يموت, يعيش, seven instruments, موسيقي) were removed from the mapping (left as `null` so other words keep their numbers and files). The PWA still downloads every existing source media file. Duplicate written words or identical image content are excluded from a session so choices remain distinct.

The chooser renders at most 24 preview cards, even when all categories are selected. Play loads at most 12 memory images or 7 matching images and uses one audio element. Delayed game actions are canceled on pause, exit, or restart. Cached media uses the same revisioned service worker storage as the main vocabulary app; use the home screen install icon to open the offline download popup before offline field use.

## Build and verification

Edit shared behavior/styles in `assets/games.js`, `assets/game-model.js`, and `assets/games.css`. Edit the shared game layout in `scripts/game-page.html`, then regenerate the four pages with `npm run build:games`. Run `npm run build` afterward to update CSS and the offline release. `npm run build:pwa` (or `node scripts/build-pwa.cjs`) refreshes game data automatically when vocabulary or media changes.

`npm test` checks media references, source labels, distinct choices, finite queues, and scoring. `npm run test:browser` exercises touch/drag/keyboard play, errors and retries, double taps, timed grading, saved games, phone/tablet layouts, all four games offline, and the full PWA download. Install Playwright browsers first as described in [PWA.md](PWA.md).
