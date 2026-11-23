/* «وين؟»: a simple drawn scene (room, garden, bedroom) with the cards placed on, under, above,
 * in front of and behind its objects. The app says «وين» + the word and the child taps that card.
 * Every game opens with an automatic demonstration (a hand shows the right card), then 1-2-3.
 * Each word is asked once; the number of cards comes from the child's level (2 / 3 / 4).
 * Every delayed step belongs to a ticket; stopping or leaving cancels it. */
((root) => {
    'use strict';
    const MINI_MODES = {
        where: { title: 'وين؟', description: 'اسمع الكلمة ولاقي صورتها بالمكان', icon: 'hand-pointer', domain: 'receptive' }
    };
    const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const normalize = word => String(word).normalize('NFKC').replace(/[ً-ٰٟـ\s]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي');
    /** Each word once, in a random order. */
    const buildTrials = keys => shuffle([...new Set(keys)]);
    /** Cards in the scene for a level: plan levels 2/4/6 or the account levels. */
    function cardCount(level) {
        return { 2: 2, 4: 3, 6: 4, easy: 2, moderate: 3, advanced: 4 }[level] || 2;
    }
    /** Distinct distractors: the session's own words first, then the same category, never a picture or word equal to the target's. */
    function distractors(target, count, pool, bank) {
        const used = new Set([normalize(target.name)]), pictures = new Set([target.imageHash]), out = [];
        const take = list => { for (const item of shuffle(list)) { if (out.length >= count) return; if (used.has(normalize(item.name)) || pictures.has(item.imageHash)) continue; used.add(normalize(item.name)); pictures.add(item.imageHash); out.push(item); } };
        take(pool.filter(item => item.key !== target.key));
        take(bank.filter(item => item.catId === target.catId));
        take(bank);
        return out;
    }

    // ---------- Scenes ----------
    // Stage is 5:3. Objects and card spots are in % of the stage; z orders cards in front of or behind objects.
    // Card spots name the place word so the scene always has a real «on / under / above / in front / behind».
    const ink = 'stroke="#3b2f2a" stroke-width="4" stroke-linejoin="round"';
    // Each object owns its spots, in its own column, so cards never stack on each other; a card «behind»
    // something always peeks out (top and side) so at least about half of its picture shows.
    const SCENES = [
        { id: 'room', name: 'الغرفة',
            background: `<rect width="1000" height="600" fill="#fdf3e3"/><rect y="420" width="1000" height="180" fill="#e6c9a0"/><rect y="414" width="1000" height="10" fill="#c99f6e"/>
                <rect x="410" y="40" width="180" height="130" rx="10" fill="#bfe3f7" ${ink}/><path d="M500 40v130M410 105h180" ${ink}/><circle cx="560" cy="75" r="16" fill="#ffd54f"/>
                <path d="M392 30h216" stroke="#8a5c38" stroke-width="8" stroke-linecap="round"/><path d="M398 34q-6 80 22 150l-30 0q-14-80-10-150z" fill="#f48fb1" ${ink}/><path d="M602 34q6 80-22 150l30 0q14-80 10-150z" fill="#f48fb1" ${ink}/>
                <rect x="90" y="90" width="120" height="90" rx="8" fill="#fff8e1" ${ink}/><path d="M104 165l34-40 26 26 16-16 18 30z" fill="#9ad574"/><circle cx="182" cy="116" r="11" fill="#ffd54f"/>
                <ellipse cx="510" cy="560" rx="300" ry="32" fill="#f6b26b" opacity=".55"/><ellipse cx="510" cy="560" rx="220" ry="20" fill="none" stroke="#e69138" stroke-width="5" stroke-dasharray="14 12" opacity=".6"/>`,
            objects: [
                { id: 'table', x: 3, y: 50, w: 30, h: 40, z: 4, svg: `<svg viewBox="0 0 300 400"><rect x="4" y="4" width="292" height="34" rx="8" fill="#c8874b" ${ink}/><rect x="20" y="38" width="26" height="358" fill="#a86a35" ${ink}/><rect x="254" y="38" width="26" height="358" fill="#a86a35" ${ink}/></svg>` },
                { id: 'box', x: 40, y: 62, w: 20, h: 28, z: 4, svg: `<svg viewBox="0 0 200 280"><rect x="4" y="34" width="192" height="242" rx="6" fill="#d9a066" ${ink}/><path d="M4 34 30 4h140l26 30" fill="#e8b57c" ${ink}/><path d="M100 34v242" stroke="#b07a42" stroke-width="5"/><rect x="70" y="120" width="60" height="26" rx="4" fill="#fff3" stroke="#b07a42" stroke-width="3"/></svg>` },
                { id: 'chair', x: 68, y: 44, w: 26, h: 46, z: 4, svg: `<svg viewBox="0 0 260 460"><rect x="34" y="4" width="192" height="226" rx="22" fill="#7cb9e8" ${ink}/><path d="M70 60h120M70 110h120M70 160h120" stroke="#5a9bd0" stroke-width="10" stroke-linecap="round"/><rect x="8" y="226" width="244" height="54" rx="14" fill="#5a9bd0" ${ink}/><rect x="26" y="280" width="28" height="176" fill="#3f7fb5" ${ink}/><rect x="206" y="280" width="28" height="176" fill="#3f7fb5" ${ink}/></svg>` },
                { id: 'plant', x: 34, y: 70, w: 6, h: 20, z: 3, svg: `<svg viewBox="0 0 60 200"><path d="M30 110c-30-30-24-70-6-96M30 110c26-28 26-66 8-92M30 110c-4-36 0-70 2-100" fill="none" stroke="#4caf50" stroke-width="8" stroke-linecap="round"/><path d="M8 110h44l-6 86H14z" fill="#e57373" ${ink}/></svg>` }
            ],
            spots: [
                { place: 'on', x: 18, y: 36, z: 6 }, { place: 'under', x: 18, y: 77, z: 5 },
                { place: 'behind', x: 53, y: 55, z: 2 },
                { place: 'above', x: 81, y: 20, z: 6 }, { place: 'front', x: 81, y: 81, z: 6 }
            ] },
        { id: 'garden', name: 'الحديقة',
            background: `<rect width="1000" height="600" fill="#cdeefc"/><circle cx="900" cy="80" r="50" fill="#ffd54f"/><path d="M900 10v-0M820 80h-0" stroke="#ffd54f"/>
                <g fill="#fff"><ellipse cx="420" cy="80" rx="70" ry="28"/><ellipse cx="460" cy="62" rx="44" ry="30"/><ellipse cx="640" cy="120" rx="56" ry="22"/><ellipse cx="672" cy="106" rx="34" ry="24"/></g>
                <rect y="430" width="1000" height="170" fill="#9ad574"/><path d="M0 430q250-40 500 0t500 0v10H0z" fill="#86c95f"/>
                <path d="M0 380h1000" stroke="#d7b48a" stroke-width="8"/><g fill="#f3dcb8" stroke="#c9a06d" stroke-width="3">${Array.from({ length: 21 }, (_, i) => `<path d="M${i * 50 + 8} 436v-84l17-18 17 18v84z"/>`).join('')}</g>
                <g>${[[120, 560, '#f48fb1'], [330, 575, '#ffd54f'], [560, 585, '#ce93d8'], [940, 560, '#f48fb1']].map(([x, y, c]) => `<path d="M${x} ${y}v-26" stroke="#4caf50" stroke-width="5"/><circle cx="${x}" cy="${y - 32}" r="12" fill="${c}"/><circle cx="${x}" cy="${y - 32}" r="5" fill="#fff59d"/>`).join('')}</g>`,
            objects: [
                { id: 'tree', x: 2, y: 4, w: 28, h: 84, z: 4, svg: `<svg viewBox="0 0 280 840"><rect x="112" y="380" width="56" height="456" rx="10" fill="#9a6437" ${ink}/><circle cx="140" cy="220" r="134" fill="#5cb85c" ${ink}/><circle cx="80" cy="250" r="18" fill="#e74c3c"/><circle cx="190" cy="180" r="18" fill="#e74c3c"/><circle cx="160" cy="300" r="18" fill="#e74c3c"/></svg>` },
                { id: 'bush', x: 38, y: 62, w: 24, h: 28, z: 4, svg: `<svg viewBox="0 0 240 280"><path d="M10 276c-12-60 10-110 50-118-6-60 54-96 96-62 44-22 88 24 70 74 30 24 18 84 4 106z" fill="#4caf50" ${ink}/><circle cx="80" cy="170" r="10" fill="#f48fb1"/><circle cx="150" cy="130" r="10" fill="#ffd54f"/><circle cx="180" cy="210" r="10" fill="#f48fb1"/></svg>` },
                { id: 'bench', x: 66, y: 56, w: 30, h: 34, z: 4, svg: `<svg viewBox="0 0 300 340"><rect x="10" y="4" width="280" height="40" rx="8" fill="#e08b3c" ${ink}/><rect x="4" y="96" width="292" height="36" rx="8" fill="#e08b3c" ${ink}/><rect x="36" y="44" width="18" height="52" fill="#a35d22"/><rect x="246" y="44" width="18" height="52" fill="#a35d22"/><rect x="36" y="132" width="22" height="204" fill="#7a4518" ${ink}/><rect x="242" y="132" width="22" height="204" fill="#7a4518" ${ink}/></svg>` }
            ],
            spots: [
                { place: 'under', x: 16, y: 78, z: 6 },
                { place: 'behind', x: 53, y: 55, z: 2 },
                { place: 'above', x: 81, y: 20, z: 6 }, { place: 'on', x: 81, y: 52, z: 6 }, { place: 'under', x: 81, y: 82, z: 5 }
            ] },
        { id: 'bedroom', name: 'غرفة النوم',
            background: `<rect width="1000" height="600" fill="#f1ecfb"/><rect y="440" width="1000" height="160" fill="#d6c4ef"/><rect y="434" width="1000" height="10" fill="#b8a2df"/>
                <g fill="#ffe082">${[[380, 70], [440, 130], [520, 60], [600, 120]].map(([x, y]) => `<path d="M${x} ${y - 14}l4 10 11 1-8 7 2 11-9-5-9 5 2-11-8-7 11-1z"/>`).join('')}</g>
                <path d="M450 210a40 40 0 1 0 50-60 32 32 0 1 1-50 60z" fill="#fff59d"/>
                <ellipse cx="560" cy="560" rx="280" ry="28" fill="#b39ddb" opacity=".45"/>`,
            objects: [
                { id: 'cupboard', x: 4, y: 14, w: 24, h: 76, z: 4, svg: `<svg viewBox="0 0 240 760"><rect x="4" y="4" width="232" height="720" rx="10" fill="#8ec5e8" ${ink}/><path d="M120 4v720" ${ink}/><circle cx="100" cy="370" r="9" fill="#3b2f2a"/><circle cx="140" cy="370" r="9" fill="#3b2f2a"/><rect x="18" y="724" width="30" height="32" fill="#5b8db0"/><rect x="192" y="724" width="30" height="32" fill="#5b8db0"/></svg>` },
                { id: 'lamp', x: 36, y: 56, w: 11, h: 34, z: 3, svg: `<svg viewBox="0 0 110 340"><path d="M24 4h62l18 80H6z" fill="#ffcc80" ${ink}/><rect x="50" y="84" width="10" height="120" fill="#8a5c38"/><rect x="4" y="204" width="102" height="132" rx="8" fill="#b5835a" ${ink}/><circle cx="55" cy="270" r="7" fill="#3b2f2a"/></svg>` },
                { id: 'bed', x: 50, y: 50, w: 46, h: 40, z: 4, svg: `<svg viewBox="0 0 460 400"><rect x="4" y="4" width="40" height="300" rx="10" fill="#b5835a" ${ink}/><rect x="30" y="136" width="426" height="90" rx="16" fill="#f8f8f8" ${ink}/><rect x="40" y="104" width="100" height="44" rx="18" fill="#fff" ${ink}/><rect x="170" y="112" width="286" height="60" rx="16" fill="#f48fb1" ${ink}/><rect x="40" y="226" width="26" height="170" fill="#8a5c38" ${ink}/><rect x="420" y="226" width="26" height="170" fill="#8a5c38" ${ink}/></svg>` }
            ],
            spots: [
                { place: 'front', x: 16, y: 80, z: 6 }, { place: 'behind', x: 32, y: 30, z: 2 },
                { place: 'above', x: 76, y: 18, z: 6 }, { place: 'on', x: 76, y: 50, z: 6 }, { place: 'under', x: 76, y: 82, z: 5 }
            ] }
    ];
    /** Places for n cards that never overlap: w and h are one card's width and height in % of the stage. */
    function placeCards(scene, n, w = 16, h = 16 * 5 / 3) {
        for (let attempt = 0; attempt < 30; attempt++) {
            const chosen = [];
            for (const spot of shuffle(scene.spots)) {
                if (chosen.length >= n) break;
                if (chosen.every(other => Math.abs(other.x - spot.x) >= w + 1 || Math.abs(other.y - spot.y) >= h + 2)) chosen.push(spot);
            }
            if (chosen.length >= Math.min(n, scene.spots.length)) return chosen;
        }
        return shuffle(scene.spots).slice(0, Math.min(n, scene.spots.length));
    }

    const api = { MINI_MODES, SCENES, buildTrials, cardCount, distractors, placeCards, normalize };
    root.VocMiniGames = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (!root.document) return;

    document.addEventListener('DOMContentLoaded', () => {
        const mode = document.body.dataset.mini, meta = MINI_MODES[mode];
        const P = root.VocProgress, V = root.VocPrompts, data = root.VOC_GAME_DATA;
        if (!meta || !P || !V || !data) return;
        const $ = selector => document.querySelector(selector);
        const items = data.categories.flatMap(category => category.items);
        const byKey = new Map(items.map(item => [item.key, item]));
        const params = new URLSearchParams(location.search);
        let plan = null, words = [], trials = [], index = 0, records = [], ticket = 0, sessionId = null, started = null;
        let count = 2, mistakes = 0, finished = false, lastWords = [], sceneTurn = Math.floor(Math.random() * SCENES.length);
        let blip = null;

        const show = view => { for (const id of ['choose', 'play', 'done']) $(`#mini-${id}`).hidden = id !== view; document.body.classList.toggle('mini-playing', view === 'play'); };
        const alive = t => t === ticket && !finished;
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        function pop() {
            try {
                blip ||= new (root.AudioContext || root.webkitAudioContext)();
                const now = blip.currentTime, tone = blip.createOscillator(), gain = blip.createGain();
                tone.frequency.setValueAtTime(520, now); tone.frequency.exponentialRampToValueAtTime(980, now + .09);
                gain.gain.setValueAtTime(.15, now); gain.gain.exponentialRampToValueAtTime(.001, now + .14);
                tone.connect(gain); gain.connect(blip.destination); tone.start(now); tone.stop(now + .15);
            } catch {}
        }
        function image(item) {
            const img = document.createElement('img'); img.src = item.image; img.alt = ''; img.decoding = 'async'; img.draggable = false;
            img.onerror = () => { img.onerror = null; img.src = 'images/placeholder.svg'; };
            return img;
        }
        function renderStars() {
            const host = $('#mini-stars');
            host.replaceChildren(...trials.map((_, i) => { const s = document.createElement('span'); s.textContent = '★'; s.className = i < index ? 'earned' : i === index ? 'current' : ''; return s; }));
            host.setAttribute('aria-valuemin', '0'); host.setAttribute('aria-valuemax', String(trials.length)); host.setAttribute('aria-valuenow', String(index));
        }
        // Instruction then the word itself: «وين … تفاحة».
        async function ask(item, t) {
            $('#mini-replay').disabled = true;
            await V.say('ask-where'); if (!alive(t)) return false;
            const heard = await V.word(item.audio);
            if (alive(t)) $('#mini-replay').disabled = false;
            return heard;
        }

        // ---------- Scene drawing ----------
        function drawScene(target, onPick) {
            const scene = SCENES[sceneTurn++ % SCENES.length];
            const cards = shuffle([target, ...distractors(target, count - 1, words, items)]);
            const stage = $('#mini-stage'); stage.className = 'mini-stage mini-scene-stage';
            // Wide screens get a 5:3 scene; tall phones a square one with bigger cards, so pictures stay easy to tap.
            const box = stage.getBoundingClientRect(), tall = box.width < box.height, ratio = tall ? 1 : 5 / 3, cardWidth = tall ? 24 : 16;
            const spots = placeCards(scene, cards.length, cardWidth, cardWidth * ratio);
            const world = document.createElement('div'); world.className = 'where-scene'; world.dataset.scene = scene.id;
            world.style.aspectRatio = tall ? '1 / 1' : '5 / 3'; world.style.width = `${Math.floor(Math.min(box.width, box.height * ratio))}px`;
            world.style.setProperty('--card', `${cardWidth}%`);
            world.insertAdjacentHTML('beforeend', `<svg class="where-background" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">${scene.background}</svg>`);
            for (const object of scene.objects) {
                const holder = document.createElement('div'); holder.className = 'where-object'; holder.setAttribute('aria-hidden', 'true');
                Object.assign(holder.style, { left: object.x + '%', top: object.y + '%', width: object.w + '%', height: object.h + '%', zIndex: object.z });
                // Objects fill their box, so on/under/behind spots stay aligned when the scene changes shape.
                holder.innerHTML = object.svg.replace('<svg ', '<svg preserveAspectRatio="none" '); world.append(holder);
            }
            const buttons = cards.map((card, i) => {
                const spot = spots[i], button = document.createElement('button');
                button.type = 'button'; button.className = 'where-card'; button.dataset.key = card.key; button.dataset.place = spot.place;
                button.setAttribute('aria-label', card.name); button.disabled = true;
                Object.assign(button.style, { left: spot.x + '%', top: spot.y + '%', zIndex: spot.z });
                button.append(image(card));
                button.addEventListener('click', () => onPick(button, card));
                world.append(button); return button;
            });
            stage.replaceChildren(world);
            return buttons;
        }

        // ---------- Word sources (no settings screen) ----------
        function sourceTile(label, pictures, onPick) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'mini-source';
            const strip = document.createElement('span'); strip.className = 'mini-source-pictures';
            strip.append(image(pictures[0]));
            const name = document.createElement('strong'); name.textContent = label;
            button.append(strip, name); button.addEventListener('click', () => { V.unlock(); onPick(); });
            return button;
        }
        function renderChoose() {
            const host = $('#mini-sources'); host.replaceChildren();
            // Workplace cards reach this game through the automatic route; here the child just picks a category.
            for (const category of data.categories) {
                if (!category.items.length) continue;
                host.append(sourceTile(category.name, category.items, () => start(shuffle(category.items).slice(0, 4))));
            }
            show('choose');
        }

        // ---------- Session ----------
        async function start(list, level = P.level()) {
            words = [...new Map(list.map(item => [item.key, item])).values()];
            lastWords = words;
            trials = buildTrials(words.map(item => item.key));
            index = 0; records = []; finished = false; mistakes = 0; count = cardCount(level);
            sessionId = `${mode}-${Date.now()}-${Math.random().toString(36).slice(2)}`; started = new Date().toISOString();
            show('play'); renderStars(); $('#mini-stage').replaceChildren();
            const t = ++ticket;
            await demo(byKey.get(trials[0]), t); if (!alive(t)) return;
            // The 1-2-3 countdown follows the demonstration.
            if (root.VocCountdown && !await root.VocCountdown.start()) { if (alive(t)) needTap(next); return; }
            if (alive(t)) next();
        }
        // Demonstration: the scene appears, «وين …» plays, and a hand moves to the right card and taps it.
        async function demo(item, t) {
            const buttons = drawScene(item, () => {});
            const banner = document.createElement('p'); banner.className = 'where-demo-banner'; banner.textContent = 'شوف كيف نلعب';
            const hand = document.createElement('span'); hand.className = 'where-hand'; hand.innerHTML = '<i class="fas fa-hand-pointer" aria-hidden="true"></i>';
            const world = $('.where-scene'); world.append(banner, hand); world.classList.add('is-demo');
            await ask(item, t); if (!alive(t)) return;
            const target = buttons.find(button => button.dataset.key === item.key);
            hand.style.left = target.style.left; hand.style.top = target.style.top; hand.classList.add('moving');
            await wait(1100); if (!alive(t)) return;
            hand.classList.add('tap'); target.classList.add('where-right'); pop();
            await V.praise(); if (!alive(t)) return;
            await wait(400);
        }
        function next() {
            const t = ++ticket; mistakes = 0;
            if (finished) return;
            if (index >= trials.length) { void finish(false); return; }
            renderStars();
            void trial(byKey.get(trials[index]), t);
        }
        async function trial(item, t) {
            const buttons = drawScene(item, async (button, card) => {
                if (!alive(t) || button.disabled) return;
                if (card.key === item.key) {
                    buttons.forEach(b => { b.disabled = true; }); button.classList.add('where-right'); pop();
                    records.push({ key: item.key, correct: mistakes === 0 });
                    root.SessionHomework?.record({ activity: meta.title, key: item.key, label: item.name, needsHelp: mistakes > 0 });
                    index++; renderStars();
                    await V.praise(); if (alive(t)) next();
                } else {
                    mistakes++; button.disabled = true; button.classList.add('where-wrong');
                    await V.retry(); if (!alive(t)) return;
                    // After a second mistake the right card glows, so every turn ends in success.
                    if (mistakes >= 2) buttons.find(b => b.dataset.key === item.key)?.classList.add('where-hint');
                    await ask(item, t);
                }
            });
            await ask(item, t);
            if (alive(t)) buttons.forEach(b => { if (!b.classList.contains('where-wrong')) b.disabled = false; });
        }

        async function finish(partial) {
            if (finished) return; finished = true; ++ticket; V.stop();
            if (records.length) P.logSession({ id: sessionId, started, source: mode, domain: meta.domain, kind: 'practice', partial,
                records: records.map(record => ({ key: record.key, correct: Number(record.correct), total: 1 })) });
            if (plan && !partial) {
                P.advancePlan(plan.id, plan.position, null);
                await V.say('done-1');
                location.replace(P.planURL()); return;
            }
            if (plan && partial) { P.cancelPlan(); plan = null; }
            const firstTry = records.filter(record => record.correct).length;
            $('#mini-done-title').textContent = partial ? 'وقفنا هون' : 'برافو! خلصنا';
            $('#mini-done-text').textContent = records.length ? `${firstTry} من ${records.length} من أول مرة` : '';
            show('done'); $('#mini-done-title').focus({ preventScroll: true });
            if (!partial) void V.say('done-1');
        }

        // ---------- Controls ----------
        $('#mini-replay').addEventListener('click', () => { const item = byKey.get(trials[index]); if (item) void ask(item, ticket); });
        const pauseDialog = $('#mini-pause');
        $('#mini-stop').addEventListener('click', () => { ++ticket; V.stop(); root.VocCountdown?.cancel(); pauseDialog.showModal(); });
        pauseDialog.addEventListener('cancel', event => { event.preventDefault(); pauseDialog.close(); next(); });
        pauseDialog.querySelector('[data-pause=continue]').addEventListener('click', () => { pauseDialog.close(); next(); });
        pauseDialog.querySelector('[data-pause=stop]').addEventListener('click', () => { pauseDialog.close(); void finish(true); });
        $('#mini-again').addEventListener('click', () => { V.unlock(); void start(lastWords); });
        $('#mini-other').addEventListener('click', () => { if (P.currentRound()) location.href = 'games.html'; else renderChoose(); });
        // Leaving the app stops the sound; coming back replays the current picture after one tap.
        const tap = $('#mini-tap');
        function needTap(then) { tap.hidden = false; tap.querySelector('button').onclick = () => { tap.hidden = true; V.unlock(); then(); }; }
        document.addEventListener('visibilitychange', () => { if (document.hidden && !$('#mini-play').hidden && !finished) { ++ticket; V.stop(); root.VocCountdown?.cancel(); needTap(next); } });
        for (const event of ['voc-profile-open', 'suite-navigation-open']) root.addEventListener(event, () => { if (!$('#mini-play').hidden && !finished) { ++ticket; V.stop(); root.VocCountdown?.cancel(); needTap(next); } });

        // ---------- Entry ----------
        const round = P.currentRound();
        if (params.has('plan') && round) {
            if (round.mode !== mode) { location.replace(P.planURL()); return; }
            const pool = round.keys.map(key => byKey.get(key));
            if (pool.some(item => !item)) { P.cancelPlan(); renderChoose(); return; }
            plan = { id: P.active().plan.id, position: P.active().plan.position };
            document.body.classList.add('automatic-plan');
            // Browsers only allow sound after a touch on this page; one big button, then play.
            const go = () => void start(pool, round.settings?.level);
            // Between two route games the child gets a short play break; its circle is also the tap sound needs.
            if (root.VocInterlude && (plan.position > 0 || !navigator.userActivation?.hasBeenActive)) root.VocInterlude.show(() => { V.unlock(); go(); });
            else if (navigator.userActivation?.hasBeenActive) go(); else needTap(go);
        } else renderChoose();
    });
})(globalThis);
