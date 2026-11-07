/* Goal bank for the therapist's intervention plan. Each long-term goal holds short-term goals the
 * therapist can select for the learner. Goals follow what كلمة practises and measures: picture
 * choice from 2/4/6 options (comprehension), naming with 6/4/2-second response times (expression),
 * matching, and the therapist-arranged workplace cards. 80% is the user's achievement criterion,
 * not a published norm. Sources are listed below and in docs/intervention-goals.md. */
((root) => {
    'use strict';
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
            id: 'L1', title: 'فهم المفردات',
            text: 'سيُظهر الطفل فهماً للأسماء والأفعال المستهدفة بالإشارة إلى الصورة المسمّاة.',
            sources: ['asha-sld', 'steele-mills-2011'],
            short: [
                { id: 'S1.1', text: 'يشير إلى الصورة المسمّاة من بين صورتين بدقة 80%.', where: 'استمع واختر · اختبار مساحة العمل (سهل)' },
                { id: 'S1.2', text: 'يشير إلى الصورة المسمّاة من بين 4 صور بدقة 80%.', where: 'استمع واختر · اختبار مساحة العمل (متوسط)' },
                { id: 'S1.3', text: 'يشير إلى الصورة المسمّاة من بين 6 صور بدقة 80%.', where: 'استمع واختر · اختبار مساحة العمل (متقدم)' },
                { id: 'S1.4', text: 'يشير إلى صورة الفعل المسمّى (مثل: ياكل، يركض) من بين 4 صور بدقة 80%.', where: 'فئة الأفعال · استمع واختر' },
                { id: 'S1.5', text: 'يشير إلى الصورة المسمّاة في فئة جديدة لم يتدرّب عليها بعد، بدقة 80%.', where: 'استمع واختر · فئة جديدة' }
            ]
        },
        {
            id: 'L2', title: 'تسمية المفردات',
            text: 'سيسمّي الطفل الأسماء والأفعال المستهدفة عند رؤية صورها.',
            sources: ['asha-lle', 'steele-mills-2011', 'ebbels-2012'],
            short: [
                { id: 'S2.1', text: 'يكرّر اسم الصورة بعد نموذج المعالج بدقة 80%.', where: 'مساحة العمل · صوت البطاقة' },
                { id: 'S2.2', text: 'يسمّي الصورة بعد تلميح بأول صوت من الكلمة بدقة 80%.', where: 'البطاقات السريعة' },
                { id: 'S2.3', text: 'يسمّي الصورة تلقائياً دون تلميح خلال 6 ثوانٍ بدقة 80%.', where: 'البطاقات السريعة · مهلة 6 ثوانٍ' },
                { id: 'S2.4', text: 'يسمّي الصورة تلقائياً خلال 4 ثوانٍ ثم ثانيتين بدقة 80%.', where: 'البطاقات السريعة · مهلة 4 ثم 2 ثانية' },
                { id: 'S2.5', text: 'يسمّي صورة الفعل (مثل: يشرب، ينام) بدقة 80%.', where: 'فئة الأفعال · البطاقات السريعة' }
            ]
        },
        {
            id: 'L3', title: 'التصنيف ومعنى الكلمة',
            text: 'سيُنظّم الطفل الكلمات في فئات ويصف معناها بسماتها.',
            sources: ['asha-sld', 'steele-mills-2011', 'ebbels-2012'],
            short: [
                { id: 'S3.1', text: 'يطابق الصورة بمثيلتها من بين 4 صور بدقة 80%.', where: 'المطابقة' },
                { id: 'S3.2', text: 'يفرز صوراً مختلطة من فئتين (مثل: طعام وحيوانات) بدقة 80%.', where: 'بطاقات مساحة العمل' },
                { id: 'S3.3', text: 'يحدّد الصورة التي لا تنتمي إلى المجموعة من بين 3 أو 4 صور بدقة 80%.', where: 'بطاقات مساحة العمل' },
                { id: 'S3.4', text: 'يسمّي الفئة لمجموعة صور (مثل: «فواكه»، «ملابس») بدقة 80%.', where: 'بطاقات مساحة العمل' },
                { id: 'S3.5', text: 'يذكر سمتين للكلمة المستهدفة (الفئة، الاستعمال، المكان) بدقة 80%.', where: 'بطاقات مساحة العمل' }
            ]
        },
        {
            id: 'L4', title: 'المفاهيم الأساسية',
            text: 'سيفهم الطفل ويستخدم مفاهيم اللون والشكل والعدد والصفات والمكان.',
            sources: ['asha-sld'],
            short: [
                { id: 'S4.1', text: 'يتعرّف الألوان بالإشارة من بين 4 صور بدقة 80%.', where: 'فئة الألوان' },
                { id: 'S4.2', text: 'يتعرّف الأشكال بالإشارة من بين 4 صور بدقة 80%.', where: 'فئة الأشكال' },
                { id: 'S4.3', text: 'يتعرّف الأرقام بالإشارة من بين 4 صور بدقة 80%.', where: 'فئة الأرقام' },
                { id: 'S4.4', text: 'يميّز الصفة وضدّها (مثل: كبير/صغير) ويسمّيهما بدقة 80%.', where: 'فئتا الصفات والمتضادات' },
                { id: 'S4.5', text: 'يتعرّف مفاهيم المكان (فوق، تحت، جوا) بالإشارة من بين صورتين بدقة 80%.', where: 'فئة حروف الجر' }
            ]
        },
        {
            id: 'L5', title: 'التواصل الوظيفي',
            text: 'سيستخدم الطفل الكلمات أو البطاقات للطلب والتعليق في مواقف اللعب والحياة اليومية.',
            sources: ['asha-aac', 'asha-lle'],
            short: [
                { id: 'S5.1', text: 'يطلب شيئاً مرغوباً بالإشارة إلى بطاقته أو بتسميته في 80% من الفرص.', where: 'مساحة العمل · فئات الطعام والألعاب' },
                { id: 'S5.2', text: 'يستخدم كلمات أساسية (بدي، ساعدني، خلصنا، استراحة) في اللعب في 80% من الفرص.', where: 'فئة الكلمات الأساسية' },
                { id: 'S5.3', text: 'يجيب عن سؤال «شو هاد؟» بكلمة واحدة في 80% من الفرص.', where: 'مساحة العمل' }
            ]
        },
        {
            id: 'L6', title: 'التعميم والمحافظة',
            text: 'سيستخدم الطفل الكلمات التي أتقنها خارج التطبيق ويحافظ عليها مع الوقت.',
            sources: ['asha-sld', 'steele-mills-2011', 'ebbels-2012'],
            short: [
                { id: 'S6.1', text: 'يسمّي الكلمات المتقنة على أغراض حقيقية أو صور غير صور التطبيق بدقة 80%.', where: 'خارج التطبيق' },
                { id: 'S6.2', text: 'يستخدم الكلمات المتقنة في البيت، حسب ملاحظة الأهل، في 80% من الكلمات.', where: 'رسالة الأهل' },
                { id: 'S6.3', text: 'يحافظ على فهم وتسمية الكلمات المتقنة بعد أسبوعين دون تدريب بدقة 80%.', where: 'استمع واختر · البطاقات السريعة' }
            ]
        }
    ];

    const LEVELS = [20, 40, 60, 80];
    const ACHIEVED = 80;
    const byId = new Map(GOALS.flatMap(goal => goal.short.map(item => [item.id, { ...item, long: goal }])));
    const api = { SOURCES, GOALS, LEVELS, ACHIEVED, short: id => byId.get(id) || null };
    if (typeof module !== 'undefined') module.exports = api;
    root.VocInterventionGoals = api;
})(globalThis);
