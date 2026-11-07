/* Therapist mode (password 013) and the learner's intervention plan. Shared by كلمة, جملة and مقطع;
 * each app's assets/intervention-goals.js supplies its name, goal bank and progress store.
 * Therapist mode lasts for this tab only: it shows the plan button (and opens every level where the app has levels).
 * The plan holds goals chosen from the goal bank, each rated 20/40/60/80%. 80% counts as achieved.
 * The PDF progress report lists goals still in progress, then achieved goals on their own page. */
(() => {
    'use strict';
    const G = window.InterventionGoals;
    if (!G) return;
    const APP = G.APP, KEY = APP.therapistKey, PASSWORD = '013';
    // The progress store may load after this script (module apps), so look it up when needed.
    const P = { intervention: () => APP.progress()?.intervention() ?? null, saveIntervention: plan => APP.progress()?.saveIntervention(plan) ?? false };
    const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    const ICONS = {
        close: svg('<path d="m6 6 12 12M18 6 6 18"/>'),
        lock: svg('<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>'),
        pdf: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6m-3-3 3 3 3-3"/>'),
        plus: svg('<path d="M12 5v14M5 12h14"/>'),
        check: svg('<path d="m5 12 4.5 4.5L19 7"/>'),
        trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>')
    };
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const today = () => new Date().toISOString().slice(0, 10);
    const formatDate = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-GB').format(d); };
    const digits = value => String(value).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).trim();

    const isActive = () => { try { return sessionStorage.getItem(KEY) === 'on'; } catch { return false; } };
    function setActive(on) {
        try { on ? sessionStorage.setItem(KEY, 'on') : sessionStorage.removeItem(KEY); } catch {}
        syncHeader();
        window.dispatchEvent(new CustomEvent('voc-therapist-change', { detail: { active: on } }));
    }
    function syncHeader() {
        const on = isActive();
        document.querySelectorAll('[data-therapist]').forEach(button => {
            button.setAttribute('aria-pressed', String(on));
            const label = on ? 'وضع المعالج مفعّل — اضغط للإنهاء' : 'وضع المعالج';
            button.setAttribute('aria-label', label); button.title = label;
        });
        document.querySelectorAll('[data-open-plan]').forEach(button => { button.hidden = !on; });
        if (!on && plan?.open) plan.close();
    }
    const toast = (message, type) => window.app?.showToast?.(message, type);

    // ---- Password and exit dialogs ----
    let gate, leave;
    function openGate() {
        if (!gate) {
            gate = document.createElement('dialog'); gate.className = 'voc-therapist'; gate.dir = 'rtl'; gate.setAttribute('aria-labelledby', 'voc-therapist-title');
            gate.innerHTML = `<header>${ICONS.lock}<h2 id="voc-therapist-title">وضع المعالج</h2><button type="button" class="voc-plan-icon" data-close aria-label="إغلاق" title="إغلاق">${ICONS.close}</button></header>
                <form novalidate><p id="voc-therapist-help">${APP.unlocksLevels ? 'أدخل كلمة مرور المعالج لفتح كل المستويات وخطة التدخل.' : 'أدخل كلمة مرور المعالج لفتح خطة التدخل.'}</p>
                <input type="password" inputmode="numeric" autocomplete="off" maxlength="8" aria-label="كلمة مرور المعالج" aria-describedby="voc-therapist-help voc-therapist-error">
                <p id="voc-therapist-error" role="alert" hidden></p>
                <div class="voc-therapist-actions"><button type="submit" class="primary">دخول</button></div></form>`;
            document.body.append(gate);
            const input = gate.querySelector('input'), error = gate.querySelector('[role=alert]');
            gate.querySelector('[data-close]').onclick = () => gate.close();
            gate.querySelector('form').onsubmit = event => {
                event.preventDefault();
                if (digits(input.value) !== PASSWORD) {
                    error.textContent = 'كلمة المرور غير صحيحة.'; error.hidden = false; input.setAttribute('aria-invalid', 'true'); input.select(); return;
                }
                gate.close(); setActive(true); toast(APP.unlocksLevels ? 'تم تفعيل وضع المعالج: كل المستويات مفتوحة' : 'تم تفعيل وضع المعالج', 'success');
            };
        }
        const input = gate.querySelector('input'); input.value = ''; input.removeAttribute('aria-invalid'); gate.querySelector('[role=alert]').hidden = true;
        gate.showModal(); input.focus();
    }
    function openLeave() {
        if (!leave) {
            leave = document.createElement('dialog'); leave.className = 'voc-therapist'; leave.dir = 'rtl'; leave.setAttribute('aria-labelledby', 'voc-therapist-leave-title');
            leave.innerHTML = `<header>${ICONS.lock}<h2 id="voc-therapist-leave-title">إنهاء وضع المعالج؟</h2></header>
                <p>${APP.unlocksLevels ? 'تُقفل المستويات حسب تقدّم الطفل وتختفي خطة التدخل.' : 'يختفي زر خطة التدخل.'} تبقى الخطة محفوظة.</p>
                <div class="voc-therapist-actions"><button type="button" class="primary" data-end>إنهاء</button><button type="button" data-cancel>إلغاء</button></div>`;
            document.body.append(leave);
            leave.querySelector('[data-cancel]').onclick = () => leave.close();
            leave.querySelector('[data-end]').onclick = () => { leave.close(); setActive(false); toast('تم إنهاء وضع المعالج', 'info'); };
        }
        leave.showModal(); leave.querySelector('[data-cancel]').focus();
    }

    // ---- Plan model ----
    function load() {
        const saved = P.intervention() || {};
        return { childName: saved.childName || '', therapist: saved.therapist || '', start: saved.start || today(),
            goals: Array.isArray(saved.goals) ? saved.goals.filter(goal => G.short(goal.id)) : [], updated: saved.updated || null };
    }
    let model = null;
    function save() {
        model.updated = new Date().toISOString();
        const ok = P.saveIntervention(model);
        const error = plan?.querySelector('[data-plan-error]');
        if (error) { error.hidden = ok !== false; if (ok === false) error.textContent = 'تعذّر حفظ الخطة على هذا الجهاز. تحقق من مساحة التخزين وأعد المحاولة.'; }
    }
    const goalOf = id => model.goals.find(goal => goal.id === id);
    const stateOf = goal => !goal || goal.rating == null ? 'new' : goal.rating >= G.ACHIEVED ? 'done' : 'working';
    const statusLabel = { new: 'لم يُقيّم', working: 'قيد العمل', done: 'تحقق' };
    function toggleGoal(id) {
        const index = model.goals.findIndex(goal => goal.id === id);
        if (index >= 0) model.goals.splice(index, 1);
        else model.goals.push({ id, rating: null, history: [], added: today() });
        save(); render();
    }
    function rate(id, level) {
        const goal = goalOf(id); if (!goal || goal.rating === level) return;
        goal.rating = level; goal.history.push({ date: new Date().toISOString(), rating: level });
        if (level >= G.ACHIEVED && !goal.achieved) goal.achieved = new Date().toISOString();
        if (level < G.ACHIEVED) delete goal.achieved;
        save(); render();
    }

    // ---- Plan dialog ----
    let plan, tab = 'plan';
    function build() {
        plan = document.createElement('dialog'); plan.className = 'voc-plan'; plan.dir = 'rtl'; plan.setAttribute('aria-labelledby', 'voc-plan-title');
        plan.innerHTML = `<header class="voc-plan-head"><h2 id="voc-plan-title">خطة التدخل</h2>
                <button type="button" class="voc-plan-icon" data-plan-pdf aria-label="تنزيل تقرير التقدم PDF" title="تنزيل تقرير التقدم PDF">${ICONS.pdf}</button>
                <button type="button" class="voc-plan-icon" data-plan-close aria-label="إغلاق" title="إغلاق">${ICONS.close}</button></header>
            <div class="voc-plan-body">
                <p data-plan-error role="alert" hidden></p>
                <div class="voc-plan-info">
                    <label>اسم الطفل<input data-field="childName" autocomplete="off" maxlength="60"></label>
                    <label>المعالج<input data-field="therapist" autocomplete="off" maxlength="60"></label>
                    <label>بداية الخطة<input data-field="start" type="date"></label>
                </div>
                <div class="voc-plan-tabs" role="tablist" aria-label="خطة التدخل">
                    <button type="button" role="tab" id="voc-tab-plan" aria-controls="voc-panel-plan" data-tab="plan"></button>
                    <button type="button" role="tab" id="voc-tab-bank" aria-controls="voc-panel-bank" data-tab="bank">بنك الأهداف</button>
                </div>
                <section role="tabpanel" id="voc-panel-plan" aria-labelledby="voc-tab-plan" data-panel="plan"></section>
                <section role="tabpanel" id="voc-panel-bank" aria-labelledby="voc-tab-bank" data-panel="bank"></section>
            </div>`;
        document.body.append(plan);
        plan.querySelector('[data-plan-close]').onclick = () => plan.close();
        plan.querySelector('[data-plan-pdf]').onclick = download;
        plan.addEventListener('click', event => { if (event.target === plan) plan.close(); });
        for (const input of plan.querySelectorAll('[data-field]')) input.addEventListener('change', () => { model[input.dataset.field] = input.value.trim(); save(); });
        const tabs = [...plan.querySelectorAll('[role=tab]')];
        for (const button of tabs) {
            button.onclick = () => { tab = button.dataset.tab; render(); };
            button.onkeydown = event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault(); const index = tabs.indexOf(button);
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowLeft' ? 1 : -1) + tabs.length) % tabs.length;
                tab = tabs[next].dataset.tab; render(); tabs[next].focus();
            };
        }
        plan.addEventListener('click', event => {
            const button = event.target.closest('button'); if (!button || !plan.contains(button)) return;
            // Re-rendering replaces the buttons; keep keyboard focus on the equivalent control.
            const refocus = selector => plan.querySelector(selector)?.focus();
            if (button.dataset.toggle) { toggleGoal(button.dataset.toggle); refocus(`[data-toggle="${button.dataset.toggle}"]`); }
            else if (button.dataset.rate) { rate(button.dataset.rate, Number(button.dataset.level)); refocus(`[data-rate="${button.dataset.rate}"][data-level="${button.dataset.level}"]`); }
            else if (button.dataset.remove) { toggleGoal(button.dataset.remove); refocus('#voc-tab-plan'); }
            else if (button.dataset.goBank !== undefined) { tab = 'bank'; render(); plan.querySelector('#voc-tab-bank').focus(); }
        });
    }
    const sourceLine = goal => `<p class="voc-goal-sources">المصادر: ${goal.sources.map(id => escape(G.SOURCES[id].label.split(':')[0].split('(')[0].trim())).join(' · ')}</p>`;
    function render() {
        const counts = { total: model.goals.length, done: model.goals.filter(goal => stateOf(goal) === 'done').length };
        counts.working = counts.total - counts.done;
        for (const input of plan.querySelectorAll('[data-field]')) if (document.activeElement !== input) input.value = model[input.dataset.field] || '';
        plan.querySelector('#voc-tab-plan').textContent = `الخطة (${counts.total})`;
        for (const button of plan.querySelectorAll('[role=tab]')) { const on = button.dataset.tab === tab; button.setAttribute('aria-selected', String(on)); button.tabIndex = on ? 0 : -1; }
        for (const panel of plan.querySelectorAll('[role=tabpanel]')) panel.hidden = panel.dataset.panel !== tab;
        plan.querySelector('[data-plan-pdf]').disabled = !counts.total;

        const planPanel = plan.querySelector('[data-panel=plan]');
        if (!counts.total) planPanel.innerHTML = `<div class="voc-plan-empty">لم تُضف أهداف بعد.<br>اختر الأهداف المناسبة للطفل من بنك الأهداف.<br><button type="button" class="voc-add" data-go-bank>${ICONS.plus}بنك الأهداف</button></div>`;
        else planPanel.innerHTML = `<div class="voc-plan-summary"><div><strong>${counts.total}</strong><span>أهداف الخطة</span></div><div><strong>${counts.done}</strong><span>تحقق (80%)</span></div><div><strong>${counts.working}</strong><span>قيد العمل</span></div></div>`
            + G.GOALS.filter(goal => goal.short.some(item => goalOf(item.id))).map(goal => `<article class="voc-goal"><h3>الهدف بعيد المدى: ${escape(goal.title)}</h3><p>${escape(goal.text)}</p>`
                + goal.short.filter(item => goalOf(item.id)).map(item => {
                    const saved = goalOf(item.id), state = stateOf(saved);
                    return `<div class="voc-short"><div class="voc-short-text">${escape(item.text)}<small>${escape(item.where)}</small></div>
                        <div class="voc-short-tools"><span class="voc-status" data-state="${state}">${statusLabel[state]}</span><button type="button" class="voc-plan-icon" data-remove="${item.id}" aria-label="حذف الهدف من الخطة: ${escape(item.text)}" title="حذف من الخطة">${ICONS.trash}</button></div>
                        <div class="voc-rating" role="group" aria-label="نسبة الإنجاز">${G.LEVELS.map(level => `<button type="button" data-rate="${item.id}" data-level="${level}" aria-pressed="${saved.rating === level}">${level}%</button>`).join('')}</div></div>`;
                }).join('') + '</article>').join('');

        plan.querySelector('[data-panel=bank]').innerHTML = G.GOALS.map(goal => `<article class="voc-goal"><h3>${escape(goal.title)}</h3><p>الهدف بعيد المدى: ${escape(goal.text)}</p>`
            + goal.short.map(item => { const added = !!goalOf(item.id); return `<div class="voc-short"><div class="voc-short-text">${escape(item.text)}<small>${escape(item.where)}</small></div>
                <button type="button" class="voc-add" data-toggle="${item.id}" aria-pressed="${added}" aria-label="${added ? 'إزالة من الخطة' : 'إضافة إلى الخطة'}: ${escape(item.text)}">${added ? ICONS.check + 'في الخطة' : ICONS.plus + 'إضافة'}</button></div>`; }).join('')
            + sourceLine(goal) + '</article>').join('');
    }
    function open() {
        if (!isActive()) { openGate(); return; }
        if (!plan) build();
        model = load(); tab = model.goals.length ? 'plan' : 'bank'; render();
        window.dispatchEvent(new Event(`${APP.id}-profile-open`)); window.dispatchEvent(new Event('suite-navigation-open'));
        plan.showModal(); plan.querySelector('[data-plan-close]').focus();
    }

    // ---- PDF progress report ----
    let pdfLibrary;
    const loadPDF = () => pdfLibrary ||= new Promise((resolve, reject) => {
        if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
        const script = document.createElement('script'); script.src = 'assets/vendor/jspdf.umd.min.js';
        script.onload = () => resolve(window.jspdf.jsPDF); script.onerror = () => { pdfLibrary = null; reject(Error('PDF library unavailable')); }; document.head.append(script);
    });
    async function pdfFor(report) {
        const jsPDF = await loadPDF(); await document.fonts.load('700 32px Cairo'); await document.fonts.load('400 24px Cairo'); await document.fonts.ready;
        const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
        doc.setProperties({ title: `${APP.name} - تقرير خطة التدخل - ${report.childName || ''}`, creator: APP.name });
        const width = 1240, height = 1754, margin = 80, pages = [];
        let canvas, c, y;
        const font = (size, weight = 700) => { c.font = `${weight} ${size}px Cairo`; };
        // Direction follows the text itself (Arabic or not); alignment stays as requested.
        const arabic = str => /[\u0600-\u06FF]/.test(str);
        const text = (str, x, yy, size = 26, color = '#18394b', align = 'right', weight = 700) => { font(size, weight); c.fillStyle = color; c.textAlign = align; c.direction = arabic(str) ? 'rtl' : 'ltr'; c.textBaseline = 'middle'; c.fillText(String(str), x, yy); };
        const lines = (str, maxWidth, size, weight = 700) => {
            font(size, weight); const out = []; let line = '';
            for (const word of String(str).split(/\s+/)) { const next = line ? `${line} ${word}` : word; if (c.measureText(next).width > maxWidth && line) { out.push(line); line = word; } else line = next; }
            if (line) out.push(line); return out;
        };
        const paragraph = (str, x, maxWidth, size, color, weight = 700, lineHeight = 1.55) => { const rtl = arabic(str); for (const line of lines(str, maxWidth, size, weight)) { text(line, rtl ? x : x - maxWidth, y + size * .6, size, color, rtl ? 'right' : 'left', weight); y += size * lineHeight; } };
        const box = (x, yy, w, h, fill, stroke) => { c.beginPath(); c.roundRect(x, yy, w, h, 20); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); } };
        const newPage = (title, subtitle) => {
            canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; c = canvas.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, width, height); pages.push(canvas);
            box(margin, 60, width - margin * 2, 180, '#f1f8fc');
            text(`${APP.name} · تقرير تقدّم خطة التدخل`, width - margin - 28, 105, 24, '#0284c7');
            text(report.childName || 'الطفل', width - margin - 28, 158, 36);
            text([report.therapist && `المعالج: ${report.therapist}`, report.start && `بداية الخطة: ${formatDate(report.start)}`].filter(Boolean).join('   ·   '), width - margin - 28, 210, 22, '#587082', 'right', 600);
            text(formatDate(report.date), margin + 28, 105, 24, '#587082', 'left');
            y = 290;
            if (title) { text(title, width - margin, y, 34, '#18394b'); y += 46; }
            if (subtitle) { text(subtitle, width - margin, y, 22, '#587082', 'right', 600); y += 46; }
        };
        const ensure = (needed, title) => { if (y + needed > height - 110) newPage(title); };
        const goalBlock = (entry, achieved, goal) => {
            const textWidth = width - margin * 2 - 60, rows = lines(entry.text, textWidth, 25, 600);
            const historyText = entry.history.length ? entry.history.map(step => `${step.rating}% (${formatDate(step.date)})`).join('  ←  ') : 'لم يُقيّم بعد';
            const historyRows = lines(`التقييمات: ${historyText}`, textWidth, 20, 600);
            const blockHeight = 40 + rows.length * 39 + 34 + 62 + historyRows.length * 31 + 24;
            // A goal that moves to a new page keeps its long-term goal heading.
            if (y + blockHeight + 10 > height - 110) { newPage(achieved ? 'أهداف تحققت (تابع)' : 'أهداف قيد العمل (تابع)'); text(`الهدف بعيد المدى: ${goal.title} (تابع)`, width - margin, y + 14, 27, '#0369a1'); y += 52; }
            const top = y; box(margin, top, width - margin * 2, blockHeight, achieved ? '#f2fbf5' : '#fbfdff', achieved ? '#bfe5cd' : '#e2eef5');
            y = top + 26; paragraph(entry.text, width - margin - 30, textWidth, 25, '#18394b', 600, 1.55);
            text(entry.where, width - margin - 30, y + 12, 19, '#7b8f9d', 'right', 600); y += 40;
            // Four-step bar: 20, 40, 60, 80%.
            const barWidth = 520, segment = (barWidth - 30) / 4, barRight = width - margin - 30;
            G.LEVELS.forEach((level, index) => {
                const x = barRight - (index + 1) * segment - index * 10, filled = entry.rating != null && level <= entry.rating;
                box(x, y, segment, 26, filled ? (achieved ? '#2f7a52' : '#0284c7') : '#eaf0f4');
                text(`${level}%`, x + segment / 2, y + 44, 17, '#587082', 'center', 600);
            });
            text(entry.rating == null ? 'لم يُقيّم' : achieved ? `تحقق ${entry.rating}%${entry.achieved ? ` · ${formatDate(entry.achieved)}` : ''}` : `الآن: ${entry.rating}%`,
                margin + 30, y + 14, 24, achieved ? '#2f7a52' : '#a66a00', 'left');
            y += 70;
            for (const row of historyRows) { text(row, width - margin - 30, y + 10, 20, '#587082', 'right', 600); y += 31; }
            y = top + blockHeight + 18;
        };
        const section = (entries, achieved) => {
            for (const goal of G.GOALS) {
                const items = entries.filter(entry => entry.long.id === goal.id); if (!items.length) continue;
                ensure(140, achieved ? 'أهداف تحققت (تابع)' : 'أهداف قيد العمل (تابع)');
                text(`الهدف بعيد المدى: ${goal.title}`, width - margin, y + 14, 27, '#0369a1'); y += 46;
                paragraph(goal.text, width - margin, width - margin * 2, 22, '#587082', 600, 1.5); y += 10;
                for (const entry of items) goalBlock(entry, achieved, goal);
                y += 10;
            }
        };
        const entries = report.goals.map(goal => ({ ...G.short(goal.id), ...goal, history: goal.history || [] }));
        const done = entries.filter(entry => entry.rating != null && entry.rating >= G.ACHIEVED), working = entries.filter(entry => !done.includes(entry));

        newPage('أهداف قيد العمل', 'الأهداف التي لم تبلغ 80% بعد، مع آخر تقييم وتاريخ التقييمات.');
        const metrics = [[entries.length, 'أهداف الخطة', '#0284c7'], [done.length, 'تحققت (80%)', '#2f7a52'], [working.length, 'قيد العمل', '#a66a00']];
        metrics.forEach(([number, name, color], index) => { const x = width - margin - 340 - index * 370; box(x, y, 340, 120, '#f7fafc'); text(number, x + 170, y + 42, 42, color, 'center'); text(name, x + 170, y + 92, 23, '#587082', 'center', 600); });
        y += 160;
        if (working.length) section(working, false); else { text('كل أهداف الخطة تحققت.', width - margin, y + 14, 25, '#2f7a52'); y += 50; }

        newPage('أهداف تحققت', `أهداف بلغت ${G.ACHIEVED}% وتُعدّ منجزة، مع تاريخ تحققها.`);
        if (done.length) section(done, true); else { text('لا توجد أهداف محققة بعد.', width - margin, y + 14, 25, '#587082'); y += 50; }

        const used = [...new Set(entries.flatMap(entry => entry.long.sources))];
        newPage('المراجع', `معيار الإنجاز ${G.ACHIEVED}% محدد في هذه الخطة، وليس معياراً منشوراً.`);
        for (const id of used) { const source = G.SOURCES[id]; ensure(140); paragraph(source.label, width - margin, width - margin * 2, 21, '#18394b', 600, 1.5); text(source.url, margin, y + 10, 18, '#0369a1', 'left', 600); y += 48; }

        pages.forEach((page, index) => {
            canvas = page; c = page.getContext('2d'); text(`${index + 1} / ${pages.length}`, width / 2, height - 55, 20, '#587082', 'center');
            if (index) doc.addPage(); doc.addImage(page.toDataURL('image/jpeg', .94), 'JPEG', 0, 0, 210, 297);
        });
        return doc;
    }
    let busy = false;
    async function download() {
        if (busy || !model?.goals.length) return;
        busy = true; const button = plan.querySelector('[data-plan-pdf]'); button.disabled = true;
        try {
            const report = { ...model, date: new Date().toISOString() };
            const doc = await pdfFor(report);
            doc.save(`خطة-التدخل-${(report.childName || 'الطفل').replace(/[^\p{L}\p{N}_-]/gu, '_')}-${formatDate(report.date).replaceAll('/', '-')}.pdf`);
        } catch {
            const error = plan.querySelector('[data-plan-error]'); error.textContent = 'تعذّر إنشاء التقرير. أعد المحاولة أو نزّل التطبيق للاستخدام دون إنترنت.'; error.hidden = false;
        } finally { busy = false; button.disabled = !model.goals.length; }
    }

    function init() {
        document.querySelectorAll('[data-therapist]').forEach(button => { button.onclick = () => isActive() ? openLeave() : openGate(); });
        document.querySelectorAll('[data-open-plan]').forEach(button => { button.onclick = open; });
        syncHeader();
    }
    window.InterventionPlan = { open, isActive, pdfFor: report => pdfFor(report), model: () => model && JSON.parse(JSON.stringify(model)) };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
