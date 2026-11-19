// Simple games and the adaptive automatic plan.
// Run: node tests/mini-games.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const G = require('../assets/mini-games.js');
const { create } = require('../assets/progress.js');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/game-data.js'), 'utf8'), ctx);
const bank = ctx.window.VOC_GAME_DATA.categories.flatMap(c => c.items);

// Trials: short lists repeat each word twice, never twice in a row.
for (let run = 0; run < 200; run++) {
    const trials = G.buildTrials(['a', 'b', 'c'], 'where');
    assert.equal(trials.length, 6);
    for (const key of ['a', 'b', 'c']) assert.equal(trials.filter(t => t === key).length, 2);
    for (let i = 1; i < trials.length; i++) assert.notEqual(trials[i], trials[i - 1], 'No word twice in a row');
}
assert.equal(G.buildTrials(Array.from({ length: 9 }, (_, i) => `k${i}`), 'balloons').length, 9, 'Long lists play each word once');

// Levels: plan difficulty maps into each game's own range; success adds a picture, a mistake removes one.
assert.deepEqual([2, 4, 6].map(l => G.startLevel('where', l)), [2, 3, 4]);
const state = { level: 2, streak: 0 };
G.adapt(state, true, 'where'); assert.equal(state.level, 2);
G.adapt(state, true, 'where'); assert.equal(state.level, 3, 'Two first-try answers add a picture');
G.adapt(state, true, 'where'); G.adapt(state, true, 'where'); G.adapt(state, true, 'where'); G.adapt(state, true, 'where');
assert.equal(state.level, 4, 'Never more than four pictures');
G.adapt(state, false, 'where'); assert.equal(state.level, 3, 'A mistake removes a picture');
G.adapt(state, false, 'where'); G.adapt(state, false, 'where'); assert.equal(state.level, 2, 'Never fewer than two');

// Distractors are distinct from the target and from each other, by word and by picture.
for (const target of bank.filter((_, i) => i % 37 === 0)) {
    const others = G.distractors(target, 3, [target], bank);
    assert.equal(others.length, 3);
    const names = new Set([target, ...others].map(i => G.normalize(i.name))), pictures = new Set([target, ...others].map(i => i.imageHash));
    assert.equal(names.size, 4); assert.equal(pictures.size, 4);
    assert.ok(others.some(i => i.catId === target.catId) || bank.filter(i => i.catId === target.catId).length < 2, 'Same category first');
}

// Adaptive plan.
const map = new Map(); const storage = { getItem: k => map.get(k), setItem: (k, v) => map.set(k, v) };
let p = create(storage); p.signIn('ليان');
let plan = p.startPlan(['1_1', '1_2', '1_3'], 'moderate', ['where', 'balloons', 'test', 'rapid']);
assert.deepEqual(plan.rounds.map(r => r.mode), ['where', 'balloons', 'test', 'rapid'], 'Practise, then test');
const id = plan.id;
// Strong practice makes the later games harder.
p.advancePlan(id, 0, null, { correct: 6, total: 6 });
plan = p.active().plan;
assert.deepEqual(plan.rounds.slice(1).map(r => r.settings.level), [6, 6, 6]);
assert.equal(plan.rounds.find(r => r.mode === 'rapid').settings.duration, 2);
// Weak practice makes them easier again and repeats the game once at the easiest level.
p.advancePlan(id, 1, null, { correct: 2, total: 6 });
plan = p.active().plan;
assert.deepEqual(plan.rounds.map(r => r.mode), ['where', 'balloons', 'balloons', 'test', 'rapid']);
assert.equal(plan.rounds[2].repeat, true); assert.equal(plan.rounds[2].settings.level, 2);
assert.equal(plan.rounds[3].settings.level, 4);
// A repeated round is never repeated again.
p.advancePlan(id, 2, null, { correct: 1, total: 6 });
plan = p.active().plan;
assert.equal(plan.rounds.filter(r => r.mode === 'balloons').length, 2);
assert.equal(plan.rounds[3].settings.level, 2);
// Test evidence also adapts the naming round and still reaches the home lesson.
p.advancePlan(id, 3, { domain: 'receptive', records: [{ key: '1_1', correct: true }, { key: '1_2', correct: true }, { key: '1_3', correct: true }] });
assert.equal(p.active().plan.rounds[4].settings.duration, 4);
p.advancePlan(id, 4, { domain: 'expressive', records: [{ key: '1_1', correct: true }] });
assert.equal(p.active().plan, null);
assert.equal(p.active().homeLesson.evidence.length, 2);
// A plan saved before اكشف الصورة was removed skips that round instead of opening a missing page.
plan = p.startPlan(['1_1', '1_2'], 'easy', ['where', 'test']);
plan.rounds.unshift({ mode: 'reveal', keys: ['1_1', '1_2'], settings: { level: 2 } });
assert.equal(p.currentRound().mode, 'where');
assert.equal(p.planURL(), 'where.html?plan=1');
p.cancelPlan();
console.log('PASS simple games: varied trials, adaptive pictures, distinct distractors, a self-adjusting plan and retired games skipped.');
