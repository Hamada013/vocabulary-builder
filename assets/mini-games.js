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
    const SCENES = [
        { id: 'room', name: 'الغرفة',
            background: `<rect width="1000" height="600" fill="#fdf3e3"/><rect y="410" width="1000" height="190" fill="#e6c9a0"/><rect y="404" width="1000" height="10" fill="#c99f6e"/>
                <rect x="400" y="60" width="200" height="150" rx="10" fill="#bfe3f7" ${ink}/><path d="M500 60v150M400 135h200" ${ink}/>`,
            objects: [
                { id: 'table', x: 6, y: 47, w: 34, h: 43, z: 4, svg: `<svg viewBox="0 0 340 430"><rect x="4" y="4" width="332" height="34" rx="8" fill="#c8874b" ${ink}/><rect x="26" y="38" width="26" height="388" fill="#a86a35" ${ink}/><rect x="288" y="38" width="26" height="388" fill="#a86a35" ${ink}/></svg>` },
                { id: 'box', x: 62, y: 56, w: 24, h: 34, z: 4, svg: `<svg viewBox="0 0 240 340"><rect x="4" y="40" width="232" height="296" rx="6" fill="#d9a066" ${ink}/><path d="M4 40 40 4h160l36 36" fill="#e8b57c" ${ink}/><path d="M120 40v296" stroke="#b07a42" stroke-width="5"/></svg>` }
            ],
            spots: [
                { place: 'on', x: 23, y: 33, z: 6 }, { place: 'under', x: 23, y: 74, z: 5 },
                { place: 'behind', x: 74, y: 49, z: 2 }, { place: 'front', x: 74, y: 82, z: 6 }, { place: 'above', x: 74, y: 18, z: 6 }
            ] },
        { id: 'garden', name: 'الحديقة',
            background: `<rect width="1000" height="600" fill="#cdeefc"/><circle cx="880" cy="90" r="55" fill="#ffd54f"/><rect y="420" width="1000" height="180" fill="#9ad574"/><path d="M0 420q250-40 500 0t500 0v10H0z" fill="#86c95f"/>`,
            objects: [
                { id: 'tree', x: 5, y: 6, w: 30, h: 82, z: 4, svg: `<svg viewBox="0 0 300 820"><rect x="120" y="380" width="60" height="436" rx="10" fill="#9a6437" ${ink}/><circle cx="150" cy="210" r="146" fill="#5cb85c" ${ink}/><circle cx="90" cy="250" r="20" fill="#e74c3c"/><circle cx="200" cy="170" r="20" fill="#e74c3c"/><circle cx="170" cy="290" r="20" fill="#e74c3c"/></svg>` },
                { id: 'bench', x: 55, y: 58, w: 38, h: 30, z: 4, svg: `<svg viewBox="0 0 380 300"><rect x="10" y="4" width="360" height="40" rx="8" fill="#e08b3c" ${ink}/><rect x="4" y="90" width="372" height="36" rx="8" fill="#e08b3c" ${ink}/><rect x="40" y="44" width="18" height="46" fill="#a35d22"/><rect x="322" y="44" width="18" height="46" fill="#a35d22"/><rect x="40" y="126" width="22" height="170" fill="#7a4518" ${ink}/><rect x="318" y="126" width="22" height="170" fill="#7a4518" ${ink}/></svg>` }
            ],
            spots: [
                { place: 'behind', x: 35, y: 26, z: 2 }, { place: 'under', x: 13, y: 74, z: 6 },
                { place: 'on', x: 74, y: 54, z: 6 }, { place: 'under', x: 74, y: 82, z: 5 }, { place: 'above', x: 74, y: 17, z: 6 }
            ] },
        { id: 'bedroom', name: 'غرفة النوم',
            background: `<rect width="1000" height="600" fill="#f1ecfb"/><rect y="430" width="1000" height="170" fill="#d6c4ef"/><rect y="424" width="1000" height="10" fill="#b8a2df"/>`,
            objects: [
                { id: 'cupboard', x: 5, y: 16, w: 26, h: 74, z: 4, svg: `<svg viewBox="0 0 260 740"><rect x="4" y="4" width="252" height="700" rx="10" fill="#8ec5e8" ${ink}/><path d="M130 4v700" ${ink}/><circle cx="110" cy="360" r="9" fill="#3b2f2a"/><circle cx="150" cy="360" r="9" fill="#3b2f2a"/><rect x="20" y="704" width="30" height="32" fill="#5b8db0"/><rect x="210" y="704" width="30" height="32" fill="#5b8db0"/></svg>` },
                { id: 'bed', x: 50, y: 46, w: 46, h: 44, z: 4, svg: `<svg viewBox="0 0 460 440"><rect x="4" y="4" width="40" height="300" rx="10" fill="#b5835a" ${ink}/><rect x="30" y="150" width="426" height="96" rx="16" fill="#f8f8f8" ${ink}/><rect x="40" y="120" width="100" height="44" rx="18" fill="#fff" ${ink}/><rect x="170" y="128" width="286" height="60" rx="16" fill="#f48fb1" ${ink}/><rect x="40" y="246" width="26" height="190" fill="#8a5c38" ${ink}/><rect x="420" y="246" width="26" height="190" fill="#8a5c38" ${ink}/></svg>` }
            ],
            spots: [
                { place: 'front', x: 18, y: 78, z: 6 }, { place: 'behind', x: 32, y: 34, z: 2 },
                { place: 'on', x: 76, y: 42, z: 6 }, { place: 'under', x: 76, y: 80, z: 5 }, { place: 'above', x: 76, y: 12, z: 6 }
            ] }
    ];
    /** Places for n cards that never overlap: w and h are one card's width and height in % of the stage. */
    function placeCards(scene, n, w = 16, h = 16 * 5 / 3) {
        for (let attempt = 0; attempt < 30; attempt++) {
            const chosen = [];
            for (const spot of shuffle(scene.spots)) {
                if (chosen.length >= n) break;
                if (chosen.every(other => Math.abs(other.x - spot.x) >= w || Math.abs(other.y - spot.y) >= h)) chosen.push(spot);
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
            if (navigator.userActivation?.hasBeenActive) go(); else needTap(go);
        } else renderChoose();
    });
})(globalThis);
