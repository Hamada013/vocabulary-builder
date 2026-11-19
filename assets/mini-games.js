/* Two simple games with no settings screen: «وين؟» and balloons.
 * Words come from the automatic plan, the workplace cards, or one tap on a category.
 * Difficulty adapts while playing: two first-try answers in a row add a picture,
 * a mistake removes one. Every delayed step belongs to a ticket; stopping cancels it. */
((root) => {
    'use strict';
    const MINI_MODES = {
        where: { title: 'وين؟', description: 'اسمع الكلمة والمس صورتها', icon: 'hand-pointer', domain: 'receptive', min: 2, max: 4 },
        balloons: { title: 'البالونات', description: 'فقّع البالون اللي فيه الصورة', icon: 'birthday-cake', domain: 'receptive', min: 2, max: 4 },
    };
    const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const normalize = word => String(word).normalize('NFKC').replace(/[ً-ٰٟـ\s]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي');
    /** Trials for a word list: short lists repeat each word twice, never the same word twice in a row. */
    function buildTrials(keys, mode, cap = 10) {
        const rounds = keys.length <= 5 ? 2 : 1, out = [];
        for (let r = 0; r < rounds; r++) {
            let batch = shuffle(keys);
            if (out.length && batch.length > 1 && batch[0] === out.at(-1)) batch.push(batch.shift());
            out.push(...batch);
        }
        return out.slice(0, Math.max(cap, keys.length));
    }
    /** Choices per mode, from a plan level (2/4/6) to the game's own range. */
    function startLevel(mode, planLevel) {
        const meta = MINI_MODES[mode];
        return Math.min(meta.max, { 2: 2, 4: 3, 6: 4 }[planLevel] || 2);
    }
    /** Two first-try successes in a row add a choice; any mistake removes one. */
    function adapt(state, firstTry, mode) {
        const meta = MINI_MODES[mode];
        if (firstTry) { state.streak++; if (state.streak >= 2 && state.level < meta.max) { state.level++; state.streak = 0; } }
        else { state.streak = 0; if (state.level > meta.min) state.level--; }
        return state;
    }
    /** Distinct distractors: same category first, never a picture or word equal to the target's. */
    function distractors(target, count, pool, bank) {
        const used = new Set([normalize(target.name)]), pictures = new Set([target.imageHash]), out = [];
        const take = list => { for (const item of shuffle(list)) { if (out.length >= count) return; if (used.has(normalize(item.name)) || pictures.has(item.imageHash)) continue; used.add(normalize(item.name)); pictures.add(item.imageHash); out.push(item); } };
        take(pool.filter(item => item.key !== target.key));
        take(bank.filter(item => item.catId === target.catId));
        take(bank);
        return out;
    }
    const api = { MINI_MODES, buildTrials, startLevel, adapt, distractors, normalize };
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
        let state = { level: 2, streak: 0 }, mistakes = 0, finished = false, lastWords = [];
        let blip = null;

        const show = view => { for (const id of ['choose', 'play', 'done']) $(`#mini-${id}`).hidden = id !== view; document.body.classList.toggle('mini-playing', view === 'play'); };
        const alive = t => t === ticket && !finished;
        function pop() {
            try {
                blip ||= new (root.AudioContext || root.webkitAudioContext)();
                const now = blip.currentTime, tone = blip.createOscillator(), gain = blip.createGain();
                tone.frequency.setValueAtTime(520, now); tone.frequency.exponentialRampToValueAtTime(980, now + .09);
                gain.gain.setValueAtTime(.15, now); gain.gain.exponentialRampToValueAtTime(.001, now + .14);
                tone.connect(gain); gain.connect(blip.destination); tone.start(now); tone.stop(now + .15);
            } catch {}
        }
        function image(item, className = '') {
            const img = document.createElement('img'); img.src = item.image; img.alt = ''; img.decoding = 'async'; img.draggable = false;
            if (className) img.className = className;
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
            // Workplace cards reach these games through the automatic plan; here the child just picks a category.
            for (const category of data.categories) {
                if (!category.items.length) continue;
                host.append(sourceTile(category.name, category.items, () => start(shuffle(category.items).slice(0, 4))));
            }
            show('choose');
        }

        // ---------- Session ----------
        function start(list, level = null) {
            words = [...new Map(list.map(item => [item.key, item])).values()];
            lastWords = words;
            trials = buildTrials(words.map(item => item.key), mode);
            index = 0; records = []; finished = false; mistakes = 0;
            state = { level: startLevel(mode, level), streak: 0 };
            sessionId = `${mode}-${Date.now()}-${Math.random().toString(36).slice(2)}`; started = new Date().toISOString();
            show('play'); renderStars(); $('#mini-stage').replaceChildren();
            const t = ++ticket; void V.say('start-1').then(() => { if (alive(t)) next(); });
        }
        function next() {
            const t = ++ticket; mistakes = 0;
            if (finished) return;
            if (index >= trials.length) { void finish(false); return; }
            renderStars();
            const item = byKey.get(trials[index]);
            if (mode === 'where') whereTrial(item, t);
            else balloonTrial(item, t);
        }
        function success(item, t) {
            records.push({ key: item.key, correct: mistakes === 0 });
            root.SessionHomework?.record({ activity: meta.title, key: item.key, label: item.name, needsHelp: mistakes > 0 });
            adapt(state, mistakes === 0, mode);
            index++; renderStars();
            return V.praise().then(() => { if (alive(t)) next(); });
        }
        async function miss(item, t, button) {
            mistakes++;
            button.classList.remove('mini-wrong'); void button.offsetWidth; button.classList.add('mini-wrong');
            await V.retry(); if (!alive(t)) return;
            // After a second mistake the right picture glows, so the child always ends with success.
            if (mistakes >= 2) document.querySelectorAll(`[data-key="${item.key}"]`).forEach(el => el.classList.add('mini-hint'));
            await ask(item, t);
        }

        // «وين؟»: big pictures, tap the one you heard. Wrong pictures fade out.
        async function whereTrial(item, t) {
            const choices = shuffle([item, ...distractors(item, state.level - 1, words, items)]);
            const stage = $('#mini-stage'); stage.className = `mini-stage mini-where n${choices.length}`;
            stage.replaceChildren(...choices.map(choice => {
                const button = document.createElement('button'); button.type = 'button'; button.className = 'mini-card'; button.dataset.key = choice.key;
                button.setAttribute('aria-label', choice.name); button.disabled = true; button.append(image(choice));
                button.addEventListener('click', async () => {
                    if (!alive(t) || button.disabled) return;
                    if (choice.key === item.key) {
                        stage.querySelectorAll('button').forEach(b => { b.disabled = true; }); button.classList.add('mini-right'); pop();
                        await success(item, t);
                    } else { button.disabled = true; button.classList.add('mini-faded'); await miss(item, t, button); }
                });
                return button;
            }));
            await ask(item, t);
            if (alive(t)) stage.querySelectorAll('button:not(.mini-faded)').forEach(b => { b.disabled = false; });
        }

        // Balloons: pictures float up; pop the one you heard. A missed wave comes back slower.
        function balloonTrial(item, t, wave = 0) {
            const choices = shuffle([item, ...distractors(item, state.level - 1, words, items)]);
            const stage = $('#mini-stage'); stage.className = 'mini-stage mini-balloons';
            const seconds = Math.max(7, 10 - state.level + (mistakes ? 2 : 0) + wave);
            const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc', '#fb923c'];
            const lanes = shuffle(choices.map((_, i) => i));
            stage.replaceChildren(...choices.map((choice, i) => {
                const balloon = document.createElement('button'); balloon.type = 'button'; balloon.className = 'mini-balloon'; balloon.dataset.key = choice.key;
                balloon.setAttribute('aria-label', choice.name);
                balloon.style.setProperty('--x', `${(lanes[i] + .5) / choices.length * 100}%`);
                balloon.style.setProperty('--color', colors[(i + index) % colors.length]);
                balloon.style.setProperty('--rise', `${seconds}s`);
                balloon.style.setProperty('--delay', `${(i * .45).toFixed(2)}s`);
                const face = document.createElement('span'); face.className = 'mini-balloon-face'; face.append(image(choice));
                balloon.append(face);
                balloon.addEventListener('click', async () => {
                    if (!alive(t) || balloon.classList.contains('popped')) return;
                    if (choice.key === item.key) {
                        stage.querySelectorAll('.mini-balloon').forEach(b => b.classList.add('frozen')); balloon.classList.add('popped'); pop();
                        await success(item, t);
                    } else { balloon.classList.add('mini-away'); await miss(item, t, balloon); }
                });
                if (choice.key === item.key) balloon.addEventListener('animationend', event => {
                    if (event.animationName !== 'mini-rise' || !alive(t) || balloon.classList.contains('popped')) return;
                    mistakes = Math.max(mistakes, 1); // Floated away: not a first-try answer, but no scolding.
                    balloonTrial(item, t, wave + 1);
                });
                return balloon;
            }));
            void ask(item, t);
        }

        async function finish(partial) {
            if (finished) return; finished = true; ++ticket; V.stop();
            const scored = meta.domain ? records : [];
            if (records.length) P.logSession({ id: sessionId, started, source: mode, domain: meta.domain, kind: 'practice', partial,
                records: records.map(record => ({ key: record.key, correct: scored.length ? Number(record.correct) : 0, total: scored.length ? 1 : 0 })) });
            if (plan && !partial) {
                const correct = records.filter(record => record.correct).length;
                P.advancePlan(plan.id, plan.position, null, meta.domain ? { correct, total: records.length } : null);
                await V.say('done-1');
                location.replace(P.planURL()); return;
            }
            if (plan && partial) { P.cancelPlan(); plan = null; }
            const firstTry = records.filter(record => record.correct).length;
            $('#mini-done-title').textContent = partial ? 'وقفنا هون' : 'برافو! خلصنا';
            $('#mini-done-text').textContent = meta.domain && records.length ? `${firstTry} من ${records.length} من أول مرة` : `${records.length} صور`;
            show('done'); $('#mini-done-title').focus({ preventScroll: true });
            if (!partial) void V.say('done-1');
        }

        // ---------- Controls ----------
        $('#mini-replay').addEventListener('click', () => { const item = byKey.get(trials[index]); if (item) void ask(item, ticket); });
        const pauseDialog = $('#mini-pause');
        $('#mini-stop').addEventListener('click', () => { ++ticket; V.stop(); pauseDialog.showModal(); });
        pauseDialog.addEventListener('cancel', event => { event.preventDefault(); pauseDialog.close(); next(); });
        pauseDialog.querySelector('[data-pause=continue]').addEventListener('click', () => { pauseDialog.close(); next(); });
        pauseDialog.querySelector('[data-pause=stop]').addEventListener('click', () => { pauseDialog.close(); void finish(true); });
        $('#mini-again').addEventListener('click', () => { V.unlock(); start(lastWords, null); });
        $('#mini-other').addEventListener('click', () => { if (P.currentRound()) location.href = 'games.html'; else renderChoose(); });
        // Leaving the app stops the sound; coming back replays the current picture after one tap.
        const tap = $('#mini-tap');
        function needTap(then) { tap.hidden = false; tap.querySelector('button').onclick = () => { tap.hidden = true; V.unlock(); then(); }; }
        document.addEventListener('visibilitychange', () => { if (document.hidden && !$('#mini-play').hidden && !finished) { ++ticket; V.stop(); needTap(next); } });
        for (const event of ['voc-profile-open', 'suite-navigation-open']) root.addEventListener(event, () => { if (!$('#mini-play').hidden && !finished) { ++ticket; V.stop(); needTap(next); } });

        // ---------- Entry ----------
        const round = P.currentRound();
        if (params.has('plan') && round) {
            if (round.mode !== mode) { location.replace(P.planURL()); return; }
            const pool = round.keys.map(key => byKey.get(key));
            if (pool.some(item => !item)) { P.cancelPlan(); renderChoose(); return; }
            plan = { id: P.active().plan.id, position: P.active().plan.position };
            document.body.classList.add('automatic-plan');
            // Browsers only allow sound after a touch on this page; one big button, then play.
            const go = () => start(pool, round.settings?.level);
            if (navigator.userActivation?.hasBeenActive) go(); else needTap(go);
        } else renderChoose();
    });
})(globalThis);
