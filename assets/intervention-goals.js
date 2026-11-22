/* Goal bank for the therapist's intervention plan. Each long-term goal holds short-term goals the
 * therapist can select for the learner. Goals follow what كلمة practises and measures: picture
 * choice from 2/4/6 options (comprehension), naming with 6/4/2-second response times (expression),
 * matching, and the therapist-arranged workplace cards. 80% is the user's achievement criterion,
 * not a published norm. Sources are listed below and in docs/intervention-goals.md. */
((root) => {
    'use strict';
    // This app: name for the report, therapist-mode key (shared with progress.js), and its progress store.
    const APP = { id: 'voc', name: 'كلمة', therapistKey: 'vocabulary-builder-therapist', unlocksLevels: true, progress: () => root.VocProgress };
    const SOURCES = {
        'asha-sld': {
            label: 'ASHA Practice Portal: Spoken Language Disorders',
            url: 'https://www.asha.org/practice-portal/clinical-topics/spoken-language-disorders/',
            note: 'Preschool targets include "Increasing the size of vocabulary", "a wider range of semantic relationships" and "the semantic depth or richness of familiar words"; carryover "beyond the treatment setting" with practice "in the home and in the community".'
        },
        'asha-lle': {
            label: 'ASHA Practice Portal: Late Language Emergence',
            url: 'https://www.asha.org/practice-portal/clinical-topics/late-language-emergence/',
            note: 'Treatment includes "providing spoken language models for the child" and focused stimulation; AAC "may in fact aid in the development of natural speech and language".'
        },
        'asha-aac': {
            label: 'ASHA Practice Portal: Augmentative and Alternative Communication',
            url: 'https://www.asha.org/practice-portal/professional-issues/augmentative-and-alternative-communication/',
            note: 'Personalize functional vocabulary, combining core words with meaningful fringe words, including verbs.'
        },
        'steele-mills-2011': {
            label: 'Steele, S. C., & Mills, M. T. (2011). Vocabulary intervention for school-age children with language impairment: A review of evidence and good practice. Child Language Teaching and Therapy, 27(3), 354–370.',
            url: 'https://doi.org/10.1177/0265659011412247',
            note: 'Children with language impairment "need many exposures", spaced "across several days"; they find verbs harder than nouns; teaching depth through categories, features, "examples and nonexamples"; "encouraging children to use vocabulary expressively".'
        },
        'ebbels-2012': {
            label: 'Ebbels, S. H., et al. (2012). Effectiveness of semantic therapy for word-finding difficulties in pupils with persistent language impairments: A randomized control trial. International Journal of Language & Communication Disorders, 47(1), 35–51.',
            url: 'https://doi.org/10.1111/j.1460-6984.2011.00073.x',
            note: 'Semantic therapy on category words (animals, food, clothes) improved word finding, maintained after 5 months (small sample, n = 15).'
        }
    };

    const GOALS = [
        {
            id: 'L1', title: 'فهم الكلمات',
            text: 'يفهم الطفل الكلمة التي يسمعها ويشير إلى صورتها.',
            sources: ['asha-sld', 'steele-mills-2011'],
            short: [
                { id: 'S1.1', text: 'يشير إلى الصورة من صورتين.', where: 'استمع واختر · اختبار مساحة العمل (سهل)' },
                { id: 'S1.2', text: 'يشير إلى الصورة من 4 صور.', where: 'استمع واختر · اختبار مساحة العمل (متوسط)' },
                { id: 'S1.3', text: 'يشير إلى الصورة من 6 صور.', where: 'استمع واختر · اختبار مساحة العمل (متقدم)' },
                { id: 'S1.4', text: 'يشير إلى صورة الفعل: «ياكل، يركض».', where: 'فئة الأفعال · استمع واختر' },
                { id: 'S1.5', text: 'يشير إلى صور فئة جديدة لم يتدرّب عليها.', where: 'استمع واختر · فئة جديدة' }
            ]
        },
        {
            id: 'L2', title: 'قول الكلمات',
            text: 'يسمّي الطفل الصورة بالكلمة.',
            sources: ['asha-lle', 'steele-mills-2011', 'ebbels-2012'],
            short: [
                { id: 'S2.1', text: 'يكرّر اسم الصورة بعد سماعه.', where: 'مساحة العمل · صوت البطاقة' },
                { id: 'S2.2', text: 'يسمّي الصورة بعد سماع أول صوت منها.', where: 'البطاقات السريعة' },
                { id: 'S2.3', text: 'يسمّي الصورة وحده خلال 6 ثوانٍ.', where: 'البطاقات السريعة · مهلة 6 ثوانٍ' },
                { id: 'S2.4', text: 'يسمّي الصورة وحده بسرعة (4 ثم 2 ثانية).', where: 'البطاقات السريعة · مهلة 4 ثم 2 ثانية' },
                { id: 'S2.5', text: 'يسمّي صورة الفعل: «يشرب، ينام».', where: 'فئة الأفعال · البطاقات السريعة' }
            ]
        },
        {
            id: 'L3', title: 'الفئات والمعنى',
            text: 'يجمع الطفل الكلمات في فئات ويعرف معناها.',
            sources: ['asha-sld', 'steele-mills-2011', 'ebbels-2012'],
            short: [
                { id: 'S3.1', text: 'يطابق الصورة مع مثيلتها (من 4 صور).', where: 'المطابقة' },
                { id: 'S3.2', text: 'يفرز صوراً من فئتين: «أكل وحيوانات».', where: 'بطاقات مساحة العمل' },
                { id: 'S3.3', text: 'يجد الصورة الغريبة عن المجموعة.', where: 'بطاقات مساحة العمل' },
                { id: 'S3.4', text: 'يقول اسم الفئة: «فواكه، ملابس».', where: 'بطاقات مساحة العمل' },
                { id: 'S3.5', text: 'يقول شيئين عن الكلمة: فئتها أو استعمالها أو مكانها.', where: 'بطاقات مساحة العمل' }
            ]
        },
        {
            id: 'L4', title: 'المفاهيم',
            text: 'يعرف الطفل الألوان والأشكال والأرقام والصفات والأماكن.',
            sources: ['asha-sld'],
            short: [
                { id: 'S4.1', text: 'يشير إلى اللون الصحيح.', where: 'فئة الألوان' },
                { id: 'S4.2', text: 'يشير إلى الشكل الصحيح.', where: 'فئة الأشكال' },
                { id: 'S4.3', text: 'يشير إلى الرقم الصحيح.', where: 'فئة الأرقام' },
                { id: 'S4.4', text: 'يعرف الصفة وعكسها: «كبير / صغير».', where: 'فئتا الصفات والمتضادات' },
                { id: 'S4.5', text: 'يعرف «فوق، تحت، جوا» (من صورتين).', where: 'فئة حروف الجر' }
            ]
        },
        {
            id: 'L5', title: 'التواصل اليومي',
            text: 'يستعمل الطفل الكلمات ليطلب ويعلّق.',
            sources: ['asha-aac', 'asha-lle'],
            short: [
                { id: 'S5.1', text: 'يطلب ما يريد بالبطاقة أو بالكلمة.', where: 'مساحة العمل · فئات الطعام والألعاب' },
                { id: 'S5.2', text: 'يقول «بدي، ساعدني، خلصنا، استراحة» في اللعب.', where: 'فئة الكلمات الأساسية' },
                { id: 'S5.3', text: 'يجيب عن «شو هاد؟» بكلمة.', where: 'مساحة العمل' }
            ]
        },
        {
            id: 'L6', title: 'الاستعمال اليومي',
            text: 'يستعمل الطفل كلماته الجديدة خارج الجلسة ولا ينساها.',
            sources: ['asha-sld', 'steele-mills-2011', 'ebbels-2012'],
            short: [
                { id: 'S6.1', text: 'يسمّي الكلمات على أغراض حقيقية أو صور جديدة.', where: 'خارج التطبيق' },
                { id: 'S6.2', text: 'يقول كلماته الجديدة في البيت (حسب الأهل).', where: 'رسالة الأهل' },
                { id: 'S6.3', text: 'يتذكّر كلماته بعد أسبوعين بدون تدريب.', where: 'استمع واختر · البطاقات السريعة' }
            ]
        }
    ];

    // Ready-made plans: one tap adds their short-term goals to the child's plan.
    const PLANS = [
        { id: 'P1', title: 'بداية', text: 'فهم وتكرار الكلمات الأولى', goals: ["S1.1", "S1.2", "S2.1", "S3.1", "S5.1"] },
        { id: 'P2', title: 'متوسط', text: 'تسمية الصور والمفاهيم', goals: ["S1.3", "S1.4", "S2.2", "S2.3", "S4.1", "S4.4"] },
        { id: 'P3', title: 'متقدم', text: 'تسمية سريعة وفئات واستعمال يومي', goals: ["S1.5", "S2.4", "S2.5", "S3.4", "S3.5", "S6.2"] }
    ];
    const LEVELS = [20, 40, 60, 80];
    const ACHIEVED = 80;
    const byId = new Map(GOALS.flatMap(goal => goal.short.map(item => [item.id, { ...item, long: goal }])));

    // ---- Estimates from the child's saved sessions ----
    // Which recorded answers count for each goal. A goal not listed here has no test in the app and is
    // rated by the therapist only. Each check receives one answer: { key, correct, total, firstTry },
    // its session { source, domain, kind, difficulty, size } and the answer's category.
    const catOf = key => parseInt(String(key), 10);
    const tested = (domain, extra = () => true) => (answer, session) => session.domain === domain && session.kind === 'assessment' && answer.total > 0 && extra(answer, session);
    const MEASURES = {
        'S1.1': tested('receptive', (a, s) => s.level === 'easy'),
        'S1.2': tested('receptive', (a, s) => s.level === 'moderate'),
        'S1.3': tested('receptive', (a, s) => s.level === 'advanced'),
        'S1.4': tested('receptive', a => catOf(a.key) === 2),
        'S1.5': tested('receptive', (a, s) => s.newCategories.has(catOf(a.key))),
        'S2.3': tested('expressive', (a, s) => s.level === 'easy'),
        'S2.4': tested('expressive', (a, s) => s.level === 'moderate' || s.level === 'advanced'),
        'S2.5': tested('expressive', a => catOf(a.key) === 2),
        'S3.1': (a, s) => s.source === 'matching' && a.firstTry !== undefined,
        'S4.1': tested('receptive', a => catOf(a.key) === 32),
        'S4.2': tested('receptive', a => catOf(a.key) === 38),
        'S4.3': tested('receptive', a => catOf(a.key) === 40),
        'S4.4': tested('receptive', a => [14, 33].includes(catOf(a.key))),
        'S4.5': tested('receptive', a => catOf(a.key) === 12),
        'S5.2': tested('expressive', a => ['1_2', '1_9', '1_16', '1_18'].includes(a.key)),
        'S6.3': (a, s) => s.kind === 'assessment' && a.total > 0 && s.gapDays(a.key) >= 14
    };
    const DAY = 864e5;
    /** Estimates for every measured goal, from the child's sessions in date order.
     *  Each session moves the estimate halfway toward that session's score, so it builds up or falls
     *  back over time. A goal is achieved after 3 sessions in a row at 80% or more. */
    function estimate(child) {
        const sessions = (child?.sessions || []).filter(session => !session.partial && Array.isArray(session.records))
            .map(session => ({ ...session, time: Date.parse(session.date || session.started) || 0 })).sort((a, b) => a.time - b.time);
        const seenCategories = new Set(), lastTested = new Map(), out = {};
        for (const session of sessions) {
            const keys = [...new Set(session.records.map(record => record.key))];
            // Workplace tests have no level saved; the number of cards on the board is the number of choices.
            const level = session.difficulty || (session.source === 'workplace' ? (keys.length <= 2 ? 'easy' : keys.length <= 4 ? 'moderate' : 'advanced') : null);
            const categories = new Set(keys.map(catOf)), newCategories = new Set([...categories].filter(id => !seenCategories.has(id)));
            const context = { ...session, level, newCategories, gapDays: key => lastTested.has(key) ? (session.time - lastTested.get(key)) / DAY : -1 };
            for (const [id, counts] of Object.entries(MEASURES)) {
                let right = 0, total = 0;
                for (const answer of session.records) if (counts(answer, context)) { total++; right += id === 'S3.1' ? answer.firstTry : answer.correct; }
                if (!total) continue;
                const score = Math.round(right / total * 100), goal = out[id] ||= { percent: null, sessions: 0, streak: 0, achieved: null, history: [] };
                goal.percent = goal.percent == null ? score : Math.round((goal.percent + score) / 2);
                goal.sessions++; goal.streak = score >= ACHIEVED ? goal.streak + 1 : 0;
                goal.last = new Date(session.time).toISOString();
                goal.history.push({ date: goal.last, score, percent: goal.percent });
                if (goal.streak >= 3 && !goal.achieved) goal.achieved = goal.last;
            }
            if (session.kind === 'assessment') for (const key of keys) lastTested.set(key, session.time);
            categories.forEach(id => seenCategories.add(id));
        }
        return out;
    }
    /** Suggested next goals: after an achieved goal, the next goal of the same long-term goal that is not in the plan yet. */
    function suggest(planIds, achievedIds, limit = 4) {
        const inPlan = new Set(planIds), done = new Set(achievedIds), out = [];
        for (const goal of GOALS) {
            const ids = goal.short.map(item => item.id);
            if (!ids.some(id => done.has(id))) continue;
            const next = ids.find(id => !inPlan.has(id));
            if (next) out.push(next);
        }
        return out.slice(0, limit);
    }
    const api = { APP, SOURCES, GOALS, PLANS, LEVELS, ACHIEVED, MEASURES, estimate, suggest, short: id => byId.get(id) || null };
    if (typeof module !== 'undefined') module.exports = api;
    root.InterventionGoals = api;
})(globalThis);
