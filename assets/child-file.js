/* «ملف الطفل»: one file with a child's progress from the speech apps on this device, for the therapist's
 * reports page (tools/accounts) on another device. Identical in كلمة, جملة, مقطع and اتبع التعليمات; the
 * script tag names its app: <script defer src="assets/child-file.js" data-app="voc"></script>.
 *
 * - The button sits next to «خطة التدخل» ([data-open-plan]) and shows only while the therapist switch is open.
 * - The file holds the active child's saved record from every one of these apps on this device (same name),
 *   who recorded the sessions (therapist, parents or another therapist), and a random id for this device, so a
 *   newer file from the same device replaces the older one on the reports page. Nothing is sent anywhere:
 *   the therapist shares or downloads the file and opens it on the reports page.
 * - It only reads the apps' saved data; it never writes to them. */
((root) => {
    'use strict';
    const FORMAT = 'speech-child-file', VERSION = 1;
    // Every app that can be in the file: its id on the reports page, its storage key and its name.
    const APPS = [
        { id: 'voc', key: 'vocabulary-builder-v1', name: 'كلمة' },
        { id: 'senb', key: 'sentences-builder-v1', name: 'جملة' },
        { id: 'taffaha', key: 'syllables-builder-v1', name: 'مقطع' },
        { id: 'follow', key: 'follow-direction-children-v1', name: 'اتبع التعليمات' },
        { id: 'arabicsounds', key: 'arabicsounds-children-v1', name: 'أصواتي العربية' },
        { id: 'auditory-rehabilitation', key: 'auditory-rehabilitation-children-v1', name: 'أصوات من حولي' }
    ];
    const DEVICE_KEY = 'speech-device-id-v1', RECORDER_KEY = 'speech-recorder-v1';
    const HOME = root.document?.currentScript?.dataset.app || '';
    const ROLES = { therapist: 'المعالج', parents: 'الأهل', other: 'معالج آخر' };

    const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
    const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
    const normalizeName = name => String(name || '').normalize('NFKC').replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    function deviceId() {
        let id = null; try { id = localStorage.getItem(DEVICE_KEY); } catch {}
        if (!id) { id = 'd-' + (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, '').slice(0, 16); try { localStorage.setItem(DEVICE_KEY, id); } catch {} }
        return id;
    }
    const usable = (data, child) => child?.id && child.role !== 'admin' && !data?.deletedChildren?.[child.id];

    // The child open in this app, as this app saved it.
    function activeChild() {
        const app = APPS.find(entry => entry.id === HOME); if (!app) return null;
        const data = read(app.key), id = root.InterventionGoals?.APP?.progress?.()?.active?.()?.id || data?.active;
        const child = data?.children?.find(entry => entry.id === id);
        return usable(data, child) ? child : null;
    }
    /** The file for one child: this app's record plus the same-named child in the other apps on this device. */
    function build(child, recorder) {
        const key = normalizeName(child.name), accounts = [];
        for (const app of APPS) {
            const data = read(app.key);
            for (const entry of data?.children || []) {
                if (!usable(data, entry)) continue;
                if (app.id === HOME ? entry.id === child.id : normalizeName(entry.name) === key) accounts.push({ app: app.id, key: app.key, child: entry });
            }
        }
        const birth = child.birth || child.birthDate || child.dob, gender = child.gender;
        return { format: FORMAT, version: VERSION, exported: new Date().toISOString(), device: deviceId(), from: HOME,
            recorder: { role: ROLES[recorder?.role] ? recorder.role : 'therapist', name: String(recorder?.name || '').trim().slice(0, 60) },
            child: { name: child.name, ...(birth ? { birth } : {}), ...(gender ? { gender } : {}) }, accounts, assessments: [] };
    }
    const fileName = file => `ملف-الطفل-${String(file.child.name).replace(/[^\p{L}\p{N}_-]/gu, '_').slice(0, 40)}-${file.exported.slice(0, 10)}.json`;
    /** Shares the file (phones and iPads: WhatsApp, mail…) or downloads it. Returns 'shared' or 'saved'. */
    async function deliver(file, preferShare) {
        const json = JSON.stringify(file), name = fileName(file);
        const blob = new File([json], name, { type: 'application/json' });
        if (preferShare && navigator.canShare?.({ files: [blob] })) {
            try { await navigator.share({ files: [blob], title: `ملف الطفل · ${file.child.name}` }); return 'shared'; }
            catch (error) { if (error?.name === 'AbortError') return 'cancelled'; }
        }
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        return 'saved';
    }

    // ---- Look: the same in every app ----
    const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    const ICONS = {
        file: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 17v-6m-3 3 3-3 3 3"/>'),
        share: svg('<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.8 7.4-4.4m-7.4 6.8 7.4 4.4"/>'),
        download: svg('<path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/>'),
        close: svg('<path d="m6 6 12 12M18 6 6 18"/>'),
        check: svg('<path d="m5 12 4.5 4.5L19 7"/>')
    };
    const CSS = `
.speech-file{width:min(440px,calc(100vw - 24px));max-height:calc(100dvh - 24px);padding:0;border:0;border-radius:24px;background:#fff;color:#18394b;box-shadow:0 24px 70px #0f2a3a40;font:inherit;overflow:auto}
.speech-file::backdrop{background:#0f2a3a59}
.speech-file header{display:flex;align-items:center;gap:10px;padding:16px 18px 10px}
.speech-file header>svg{width:26px;height:26px;color:#0284c7}
.speech-file h2{flex:1;margin:0;font-size:20px}
.speech-file-icon{display:inline-grid;place-items:center;width:40px;height:40px;padding:0;border:1px solid #dbe7ee;border-radius:50%;background:#fff;color:#18394b;cursor:pointer}
.speech-file-icon svg{width:20px;height:20px}
.speech-file-body{display:grid;gap:14px;padding:4px 18px 18px}
.speech-file-child{display:grid;gap:6px;padding:12px 14px;border-radius:16px;background:#f1f8fc}
.speech-file-child b{font-size:18px}
.speech-file-apps{display:flex;flex-wrap:wrap;gap:6px}
.speech-file-apps span{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;background:#fff;color:#2f7a52;font-size:13px;font-weight:700}
.speech-file-apps svg{width:14px;height:14px}
.speech-file fieldset{margin:0;padding:0;border:0;display:grid;gap:8px}
.speech-file legend{margin-bottom:8px;font-weight:700;font-size:15px}
.speech-file-roles{display:flex;gap:6px;flex-wrap:wrap}
.speech-file-roles button{flex:1;min-width:88px;min-height:44px;padding:8px 10px;border:1.5px solid #dbe7ee;border-radius:14px;background:#fff;color:#18394b;font:inherit;font-weight:700;cursor:pointer}
.speech-file-roles button[aria-pressed=true]{border-color:#34a26a;background:#eaf7ef;color:#1f6b45}
.speech-file input{min-height:44px;padding:8px 12px;border:1.5px solid #dbe7ee;border-radius:14px;font:inherit;color:inherit;background:#fff}
.speech-file-note{margin:0;color:#587082;font-size:14px;line-height:1.6}
.speech-file-actions{display:flex;gap:10px;flex-wrap:wrap}
.speech-file-actions button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 16px;border:1.5px solid #dbe7ee;border-radius:16px;background:#fff;color:#18394b;font:inherit;font-weight:800;cursor:pointer}
.speech-file-actions button.primary{border-color:#0284c7;background:#0284c7;color:#fff}
.speech-file-actions svg{width:20px;height:20px}
.speech-file [role=status]{margin:0;min-height:1.4em;color:#1f6b45;font-weight:700}
.speech-file [role=status].error{color:#b42318}
.speech-file :focus-visible{outline:3px solid #0284c780;outline-offset:2px}`;
    function style() {
        if (document.getElementById('speech-file-style')) return;
        const tag = document.createElement('style'); tag.id = 'speech-file-style'; tag.textContent = CSS; document.head.append(tag);
    }

    // ---- The window ----
    let dialog, role = 'therapist';
    function open() {
        style();
        if (!dialog) {
            dialog = document.createElement('dialog'); dialog.className = 'speech-file'; dialog.dir = 'rtl'; dialog.setAttribute('aria-labelledby', 'speech-file-title');
            document.body.append(dialog);
            dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
        }
        const child = activeChild(), saved = read(RECORDER_KEY) || {};
        role = ROLES[saved.role] ? saved.role : 'therapist';
        const head = `<header>${ICONS.file}<h2 id="speech-file-title">ملف الطفل</h2><button type="button" class="speech-file-icon" data-close aria-label="إغلاق" title="إغلاق">${ICONS.close}</button></header>`;
        if (!child) {
            dialog.innerHTML = head + '<div class="speech-file-body"><p class="speech-file-note">افتح حساب الطفل أولاً من «حسابات الأطفال»، ثم ارجع إلى هنا.</p></div>';
        } else {
            const apps = build(child, { role }).accounts.map(entry => APPS.find(app => app.id === entry.app).name);
            const canShare = !!navigator.canShare;
            dialog.innerHTML = head + `<div class="speech-file-body">
                <div class="speech-file-child"><b>${escape(child.name)}</b><div class="speech-file-apps" aria-label="التطبيقات في الملف">${apps.map(name => `<span>${ICONS.check}${escape(name)}</span>`).join('')}</div></div>
                <fieldset><legend>من سجّل هذه الجلسات؟</legend><div class="speech-file-roles">${Object.entries(ROLES).map(([id, label]) => `<button type="button" data-role="${id}" aria-pressed="${id === role}">${label}</button>`).join('')}</div>
                    <input data-name maxlength="60" autocomplete="off" placeholder="الاسم" aria-label="اسم من سجّل" value="${escape(saved.name || '')}"></fieldset>
                <p class="speech-file-note">أرسل الملف إلى المعالج ليفتحه في صفحة التقارير. يبقى الملف معك ولا يُرسل شيء تلقائياً.</p>
                <div class="speech-file-actions">${canShare ? `<button type="button" class="primary" data-go="share">${ICONS.share}مشاركة</button>` : ''}<button type="button" ${canShare ? '' : 'class="primary"'} data-go="save">${ICONS.download}تنزيل</button></div>
                <p role="status" aria-live="polite"></p></div>`;
            const name = dialog.querySelector('[data-name]'), status = dialog.querySelector('[role=status]');
            const sync = () => { name.hidden = role === 'parents'; dialog.querySelectorAll('[data-role]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.role === role))); };
            dialog.querySelectorAll('[data-role]').forEach(button => { button.onclick = () => { role = button.dataset.role; sync(); }; });
            dialog.querySelectorAll('[data-go]').forEach(button => {
                button.onclick = async () => {
                    const recorder = { role, name: role === 'parents' ? '' : name.value.trim() };
                    write(RECORDER_KEY, { role, name: name.value.trim() || saved.name || '' });
                    status.classList.remove('error'); status.textContent = '';
                    try {
                        const done = await deliver(build(child, recorder), button.dataset.go === 'share');
                        status.textContent = done === 'shared' ? 'تمت المشاركة.' : done === 'saved' ? 'نُزّل الملف.' : '';
                    } catch { status.classList.add('error'); status.textContent = 'تعذّر إنشاء الملف. أعد المحاولة.'; }
                };
            });
            sync();
        }
        dialog.querySelector('[data-close]').onclick = () => dialog.close();
        dialog.showModal(); dialog.querySelector('[data-close]').focus();
    }

    // ---- The button: next to every «خطة التدخل» button, shown and hidden with it ----
    function button(plan) {
        const b = document.createElement('button'); b.type = 'button'; b.className = plan.className; b.dataset.childFile = '';
        b.setAttribute('aria-label', 'ملف الطفل'); b.title = 'ملف الطفل'; b.setAttribute('aria-haspopup', 'dialog');
        b.innerHTML = ICONS.file; b.hidden = plan.hidden; b.onclick = open;
        new MutationObserver(() => { b.hidden = plan.hidden; }).observe(plan, { attributes: true, attributeFilter: ['hidden'] });
        return b;
    }
    // One button per plan button, made once; when an app re-sorts its header, the button moves back beside it.
    const made = new WeakMap();
    function attach() {
        for (const plan of document.querySelectorAll('[data-open-plan]')) {
            const mine = made.get(plan) || made.set(plan, button(plan)).get(plan);
            if (plan.nextElementSibling !== mine) plan.after(mine);
        }
    }
    function init() {
        attach();
        // Apps that redraw their header (اتبع التعليمات) get the button back each time.
        new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });
    }
    root.SpeechChildFile = { open, build, activeChild, deviceId, APPS, FORMAT, VERSION };
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(globalThis);
