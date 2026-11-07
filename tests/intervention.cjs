// Goal bank integrity, therapist-mode level unlocking, and saved intervention plans.
const assert = require('node:assert/strict');
const G = require('../assets/intervention-goals.js');
const ids = G.GOALS.flatMap(goal => [goal.id, ...goal.short.map(item => item.id)]);
assert.equal(new Set(ids).size, ids.length, 'Goal ids are unique');
const texts = G.GOALS.flatMap(goal => goal.short.map(item => item.text));
assert.equal(new Set(texts).size, texts.length, 'No duplicated short-term goals');
assert.deepEqual(G.LEVELS, [20, 40, 60, 80]); assert.equal(G.ACHIEVED, 80);
for (const goal of G.GOALS) {
    assert.ok(goal.title && goal.text && goal.short.length >= 3, goal.id);
    assert.ok(goal.sources.length && goal.sources.every(id => G.SOURCES[id]?.url.startsWith('https://')), `${goal.id} cites sources`);
    for (const item of goal.short) { assert.ok(item.text.includes('80%') && item.where, item.id); assert.equal(G.short(item.id).long.id, goal.id); }
}
const { create } = require('../assets/progress.js');
const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
let p = create(storage); p.signIn('الطفل');
const level = { id: 'second', previousId: 'first', keys: ['1_1', '1_2'] };
assert.equal(p.wordLevelUnlocked(level), false, 'A later level starts locked');
const session = new Map(); globalThis.sessionStorage = { getItem: key => session.get(key) };
session.set('vocabulary-builder-therapist', 'on');
assert.equal(p.therapist(), true); assert.equal(p.wordLevelUnlocked(level), true, 'Therapist mode opens every level');
assert.equal(p.wordLevelCompleted(level), false, 'Unlocking never marks a level completed');
session.clear(); assert.equal(p.wordLevelUnlocked(level), false, 'Levels lock again when therapist mode ends');
const plan = { childName: 'ليان', therapist: '', start: '2026-11-07', goals: [{ id: 'S1.1', rating: 80, history: [{ date: '2026-11-07T10:00:00Z', rating: 80 }], achieved: '2026-11-07T10:00:00Z' }] };
assert.equal(p.saveIntervention(plan), true);
plan.goals[0].rating = 20; assert.equal(p.intervention().goals[0].rating, 80, 'Saved plans are copies');
p.saveWorkspace({ slots: ['1_1'] });
p = create(storage); assert.equal(p.intervention().childName, 'ليان', 'The plan survives reopening and other saves');
console.log(`PASS intervention: ${G.GOALS.length} long-term and ${texts.length} short-term goals with sources, therapist unlock and saved plans.`);
