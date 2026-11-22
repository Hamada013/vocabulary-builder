// «وين؟» scenes, the child's level on the account, the automatic route and the goal estimates.
// Run: node tests/mini-games.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const G = require('../assets/mini-games.js');
const { create } = require('../assets/progress.js');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/game-data.js'), 'utf8'), ctx);
const bank = ctx.window.VOC_GAME_DATA.categories.flatMap(c => c.items);

// Each word is asked once.
for (let run = 0; run < 50; run++) {
    const trials = G.buildTrials(['a', 'b', 'c', 'a']);
    assert.equal(trials.length, 3); assert.deepEqual([...trials].sort(), ['a', 'b', 'c']);
}
// Cards in the scene follow the level: 2 / 3 / 4.
assert.deepEqual(['easy', 'moderate', 'advanced'].map(G.cardCount), [2, 3, 4]);
assert.deepEqual([2, 4, 6].map(G.cardCount), [2, 3, 4]);
// Distractors are distinct from the target and from each other, by word and by picture.
for (const target of bank.filter((_, i) => i % 37 === 0)) {
    const others = G.distractors(target, 3, [target], bank);
    assert.equal(others.length, 3);
    assert.equal(new Set([target, ...others].map(i => G.normalize(i.name))).size, 4);
    assert.equal(new Set([target, ...others].map(i => i.imageHash)).size, 4);
}
// Every scene offers all five place words, at distinct spots inside the stage, enough for four cards.
for (const scene of G.SCENES) {
    assert.ok(scene.spots.length >= 4, `${scene.id}: room for four cards`);
    assert.equal(new Set(scene.spots.map(s => `${s.x},${s.y}`)).size, scene.spots.length, `${scene.id}: no two spots overlap`);
    for (const spot of scene.spots) assert.ok(spot.x > 5 && spot.x < 95 && spot.y > 5 && spot.y < 95, `${scene.id}: spot inside the stage`);
    // «behind» cards sit under an object (lower z); the others are drawn in front.
    const objectZ = Math.min(...scene.objects.map(o => o.z));
    for (const spot of scene.spots) assert.equal(spot.place === 'behind', spot.z < objectZ, `${scene.id}: ${spot.place} layering`);
    // Up to four cards always fit without overlapping, on wide (5:3, 16%) and tall (square, 24%) screens.
    for (const [w, h] of [[16, 16 * 5 / 3], [24, 24]]) for (let n = 2; n <= 4; n++) for (let run = 0; run < 100; run++) {
        const spots = G.placeCards(scene, n, w, h);
        assert.equal(spots.length, n, `${scene.id}: ${n} cards at ${w}%`);
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) assert.ok(Math.abs(spots[i].x - spots[j].x) >= w || Math.abs(spots[i].y - spots[j].y) >= h, `${scene.id}: cards overlap`);
    }
}
const places = new Set(G.SCENES.flatMap(scene => scene.spots.map(spot => spot.place)));
assert.deepEqual([...places].sort(), ['above', 'behind', 'front', 'on', 'under']);

// The child's level lives on the account; it can be changed, and the name can be edited.
const map = new Map(); const storage = { getItem: k => map.get(k), setItem: (k, v) => map.set(k, v) };
let p = create(storage);
p.signIn('ليان', 'moderate'); assert.equal(p.level(), 'moderate');
p.signIn('عمر'); assert.equal(p.level(), 'easy', 'New children start at سهل');
const omar = p.active().id;
assert.equal(p.setLevel(omar, 'advanced'), true); assert.equal(p.level(), 'advanced');
assert.equal(p.setLevel(omar, 'expert'), false);
assert.equal(p.rename(omar, 'ليان'), false, 'Two children cannot share a name');
assert.equal(p.rename(omar, '  عمر   الصغير '), true); assert.equal(p.active().name, 'عمر الصغير');
p = create(storage); assert.equal(p.level(), 'advanced'); assert.equal(p.active().name, 'عمر الصغير');

// The route: «وين؟» first, then the chosen games in a fixed order, at the child's level.
let plan = p.startPlan(['1_1', '1_2', '1_3'], ['rapid', 'memory', 'test', 'matching']);
assert.deepEqual(plan.rounds.map(r => r.mode), ['where', 'matching', 'memory', 'test', 'rapid']);
assert.ok(plan.rounds.every(r => r.settings.level === 6), 'Advanced child: 6 pictures');
assert.equal(plan.rounds.find(r => r.mode === 'rapid').settings.duration, 2);
plan = p.startPlan(['1_1'], []);
assert.deepEqual(plan.rounds.map(r => r.mode), ['where'], '«وين؟» runs even when no other game is chosen');
// Rounds saved for retired games (balloons, reveal) are skipped.
plan = p.startPlan(['1_1', '1_2'], ['test']);
plan.rounds.unshift({ mode: 'balloons', keys: ['1_1', '1_2'], settings: { level: 2 } }, { mode: 'reveal', keys: ['1_1'], settings: { level: 2 } });
assert.equal(p.currentRound().mode, 'where');
assert.equal(p.planURL(), 'where.html?plan=1');
p.cancelPlan();

// Goal estimates build up and fall back with each session; 3 sessions in a row at 80%+ achieve a goal.
global.window = globalThis; require('../assets/intervention-goals.js');
const Goals = globalThis.InterventionGoals;
const session = (date, records, extra = {}) => ({ id: date + Math.random(), date, source: 'test', domain: 'receptive', kind: 'assessment', difficulty: 'easy', records, ...extra });
const answer = (key, correct) => ({ key, correct, total: 1 });
const days = ['2026-11-01', '2026-11-03', '2026-11-05', '2026-11-07'];
let est = Goals.estimate({ sessions: [session(days[0], [answer('6_1', 1), answer('6_2', 0)])] });
assert.equal(est['S1.1'].percent, 50);
est = Goals.estimate({ sessions: days.map((d, i) => session(d, [answer('6_1', 1), answer('6_2', i ? 1 : 0)])) });
assert.equal(est['S1.1'].sessions, 4); assert.equal(est['S1.1'].percent, 94, 'Builds up session by session');
assert.ok(est['S1.1'].achieved, 'Three sessions in a row at 80% or more');
est = Goals.estimate({ sessions: [...days.slice(0, 3).map(d => session(d, [answer('6_1', 1)])), session(days[3], [answer('6_1', 0)])] });
assert.ok(est['S1.1'].achieved, 'An achieved goal stays achieved'); assert.equal(est['S1.1'].percent, 50, 'but the estimate falls back');
est = Goals.estimate({ sessions: [session(days[0], [answer('6_1', 1)]), session(days[1], [answer('6_1', 1)]), session(days[2], [answer('6_1', 0)]), session(days[3], [answer('6_1', 1)])] });
assert.equal(est['S1.1'].achieved, null, 'The three sessions must be in a row');
// Each goal only counts its own answers: verbs, colours, the naming time, matching first tries, practice is ignored.
est = Goals.estimate({ sessions: [
    session(days[0], [answer('2_3', 1), answer('32_1', 0)], { difficulty: 'moderate' }),
    session(days[1], [answer('1_16', 1)], { domain: 'expressive', difficulty: 'easy' }),
    session(days[2], [{ key: '6_1', correct: 0, total: 0, firstTry: 1 }, { key: '6_2', correct: 0, total: 0, firstTry: 0 }], { source: 'matching', domain: null, kind: 'practice', difficulty: null }),
    session(days[3], [answer('6_1', 1)], { kind: 'practice' })
] });
assert.equal(est['S1.4'].percent, 100); assert.equal(est['S4.1'].percent, 0); assert.equal(est['S1.2'].percent, 50);
assert.equal(est['S2.3'].percent, 100); assert.equal(est['S5.2'].percent, 100); assert.equal(est['S3.1'].percent, 50);
assert.equal(est['S1.1'], undefined, 'Practice sessions do not count as tests');
// Suggested goals: the next goal after an achieved one, not already in the plan.
assert.deepEqual(Goals.suggest(['S1.1', 'S1.2'], ['S1.1']), ['S1.3']);
assert.deepEqual(Goals.suggest(['S1.1'], []), [], 'Nothing is suggested before a goal is achieved');
console.log('PASS «وين؟» scenes, account levels and names, route order, retired rounds skipped, goal estimates and suggestions.');
