/* The start screen: the app opens locked, showing its logo and three bars: the child's name, the child's number,
 * and the therapist bar. Identical in كلمة, جملة, مقطع and اتبع التعليمات; the script tag names its app:
 * <script defer src="assets/speech-entry.js" data-app="voc"></script> (after speech-sync.js).
 *
 * - Parents type the child's name and the 6-digit number the therapist shared («مشاركة مع الأهل» on the reports
 *   page). The first time, this also connects the device to the clinic (assets/speech-sync.js) and adds the child;
 *   after that the app opens straight on that child, and the accounts window shows only that child.
 * - The therapist bar asks for 013 and opens the app as before (all accounts). The choice is remembered on this
 *   device for every app on the site, until «قفل التطبيق» in the clinic window (the cloud button).
 * - Each child's account is valid until a date the therapist chooses on the reports page (3, 6, 9 or 12 months).
 *   After it, the app shows the start screen with «انتهت مدة حساب الطفل» until the therapist renews it; the new date
 *   reaches the device the next time it is online.
 * - This keeps parents to their own child and strangers away from children's data; it is not a security system
 *   (the code is public and there is no server of our own). */
((root) => {
    'use strict';
    const HOME = root.document?.currentScript?.dataset.app || '', ENTRY_KEY = 'speech-entry-v1', CODE = '013';
    const read = () => { try { return JSON.parse(localStorage.getItem(ENTRY_KEY)); } catch { return null; } };
    const write = value => { try { localStorage.setItem(ENTRY_KEY, JSON.stringify(value)); } catch {} };
    const digits = value => String(value || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g, '');
    const normalizeName = name => String(name || '').normalize('NFKC').replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
    // The last digit checks the other five (same rule as the reports page), so a mistyped number is caught at once.
    const checkDigit = five => String([...five].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0) * 7 % 10);
    const validCode = code => /^\d{6}$/.test(code) && checkDigit(code.slice(0, 5)) === code[5];
    const progress = () => root.InterventionGoals?.APP?.progress?.();

    const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    const LOCK = svg('<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>');
    const CSS = `
.speech-entry{position:fixed;inset:0;width:auto;height:auto;max-width:none;max-height:none;margin:0;border:0;display:grid;place-items:center;padding:20px;overflow:auto;background:radial-gradient(ellipse at top right,#e0f2fe,transparent 55%),radial-gradient(ellipse at bottom left,#dcfce7,transparent 50%),#f8fafc;color:#18394b;font-family:inherit}
.speech-entry::backdrop{background:#f8fafc}
.speech-entry form{width:min(380px,100%);display:grid;gap:14px;text-align:center}
.speech-entry-logo{width:96px;height:96px;margin:0 auto;border-radius:28px;object-fit:cover;box-shadow:0 10px 30px #0f2a3a26;background:#fff}
.speech-entry h1{margin:4px 0 8px;font-size:26px}
.speech-entry input{width:100%;box-sizing:border-box;min-height:56px;padding:10px 16px;border:2px solid #dbe7ee;border-radius:18px;background:#fff;color:inherit;font:inherit;font-size:19px;text-align:center}
.speech-entry input[data-number]{direction:ltr;letter-spacing:.2em;font-weight:800}
.speech-entry input:focus{outline:none;border-color:#0284c7;box-shadow:0 0 0 4px #0284c726}
.speech-entry button{min-height:56px;border:0;border-radius:18px;font:inherit;font-size:19px;font-weight:800;cursor:pointer}
.speech-entry [data-enter]{background:#0284c7;color:#fff}.speech-entry [data-enter]:disabled{opacity:.6}
.speech-entry [data-therapist]{display:flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:#18394b;border:2px solid #dbe7ee}.speech-entry [data-therapist] svg{width:22px;height:22px}
.speech-entry [role=alert]{min-height:1.5em;margin:0;color:#b42318;font-weight:700}
.speech-entry small{color:#587082;line-height:1.6}
.speech-entry :focus-visible{outline:3px solid #0284c780;outline-offset:2px}
body.speech-parent dialog form:has(input[placeholder="اسم الطفل"]),body.speech-parent .suite-account-tools,body.speech-parent .speech-sync-section{display:none!important}`;
    function style() { if (document.getElementById('speech-entry-style')) return; const tag = document.createElement('style'); tag.id = 'speech-entry-style'; tag.textContent = CSS; document.head.append(tag); }
    const logo = () => document.querySelector('header img, .brand img, img[src*="logo"]')?.src || document.querySelector('link[rel="apple-touch-icon"], link[rel="icon"]')?.href || '';
    const title = () => String(document.title || '').split('·')[0].trim();

    // ---- The locked screen ----
    let screen;
    function lock(message = '') {
        style();
        // A modal window, so it sits above the app's own windows; Escape cannot close it.
        screen?.remove(); screen = document.createElement('dialog'); screen.className = 'speech-entry'; screen.dir = 'rtl'; screen.setAttribute('aria-labelledby', 'speech-entry-title');
        screen.addEventListener('cancel', event => event.preventDefault());
        const src = logo();
        screen.innerHTML = `<form novalidate>${src ? `<img class="speech-entry-logo" src="${src}" alt="">` : ''}<h1 id="speech-entry-title">${title()}</h1>
            <input data-name autocomplete="off" maxlength="60" placeholder="اسم الطفل" aria-label="اسم الطفل" dir="auto">
            <input data-number inputmode="numeric" autocomplete="off" maxlength="7" placeholder="رقم الطفل" aria-label="رقم الطفل">
            <button type="submit" data-enter>دخول</button>
            <p role="alert">${message}</p>
            <button type="button" data-therapist>${LOCK}المعالج</button>
            <small>الاسم والرقم يصلان من المعالج.</small></form>`;
        document.body.append(screen); closeOthers(); screen.showModal();
        const form = screen.querySelector('form'), alert = screen.querySelector('[role=alert]'), enter = screen.querySelector('[data-enter]');
        const number = screen.querySelector('[data-number]');
        number.oninput = () => { const d = digits(number.value).slice(0, 6); number.value = d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d; };
        form.onsubmit = async event => {
            event.preventDefault(); alert.textContent = '';
            const name = screen.querySelector('[data-name]').value.trim(), code = digits(number.value);
            if (!name) { alert.textContent = 'اكتب اسم الطفل.'; return; }
            if (!validCode(code)) { alert.textContent = 'تحقق من رقم الطفل: ستة أرقام كما أرسلها المعالج.'; return; }
            if (!navigator.onLine) { alert.textContent = 'تحتاج اتصالاً بالإنترنت لأول دخول.'; return; }
            enter.disabled = true; enter.textContent = 'جارٍ الدخول…';
            try {
                const child = await root.SpeechSync.joinChild(name, code);
                if (!(child.apps || []).includes(HOME)) throw Error('هذا الطفل غير مضاف إلى هذا التطبيق بعد. اطلب من المعالج إضافته.');
                if (expired(child)) throw Error(ENDED);
                write({ mode: 'parent', child: { id: child.id, name: child.name, code: child.code, apps: child.apps || [], until: child.until || null } });
                open(true);
            } catch (error) { alert.textContent = /[؀-ۿ]/.test(error?.message || '') ? error.message : 'الاسم أو الرقم غير صحيح.'; enter.disabled = false; enter.textContent = 'دخول'; }
        };
        // The therapist bar turns into the 013 box.
        screen.querySelector('[data-therapist]').onclick = event => {
            const bar = event.currentTarget, box = document.createElement('input');
            box.type = 'password'; box.inputMode = 'numeric'; box.autocomplete = 'off'; box.maxLength = 8; box.placeholder = 'رمز المعالج'; box.setAttribute('aria-label', 'رمز المعالج');
            bar.replaceWith(box); box.focus();
            box.oninput = () => { if (digits(box.value) === CODE) { write({ mode: 'therapist' }); unlock(); } };
            box.onkeydown = key => { if (key.key === 'Enter') { key.preventDefault(); if (digits(box.value) !== CODE) { alert.textContent = 'رمز المعالج غير صحيح.'; box.select(); } } };
        };
        screen.querySelector('[data-name]').focus();
    }
    // While locked, any other window the app opens (e.g. «حسابات الأطفال» on first start) is closed again.
    function closeOthers() { document.querySelectorAll('dialog[open]').forEach(other => { if (other !== screen) other.close(); }); }
    new MutationObserver(() => { if (screen?.isConnected) closeOthers(); }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] });
    function unlock() { screen?.close(); screen?.remove(); screen = null; }

    const ENDED = 'انتهت مدة حساب الطفل. تواصل مع المعالج لإعادة التفعيل.';
    const expired = child => !!child?.until && Date.parse(child.until) < Date.now();
    // The clinic's latest details for the parent's child (apps, valid-until date), sent by assets/speech-sync.js.
    function refresh(children) {
        const entry = read(); if (entry?.mode !== 'parent') return;
        const latest = children.find(child => child.id === entry.child.id); if (!latest) return;
        const wasLocked = expired(entry.child) || !(entry.child.apps || []).includes(HOME);
        entry.child = { ...entry.child, name: latest.name, apps: latest.apps || [], until: latest.until || null }; write(entry);
        if (wasLocked && !expired(entry.child) && entry.child.apps.includes(HOME)) location.reload();
        else if (!wasLocked && (expired(entry.child) || !entry.child.apps.includes(HOME))) open(false);
    }
    // ---- Opening the parent's child ----
    // Opens (or adds) the child in this app, links it to the clinic child, then shows the app.
    function open(first) {
        const entry = read(), P = progress(); if (!entry?.child) return;
        document.body.classList.add('speech-parent');
        if (expired(entry.child)) { lock(ENDED); return; }
        if (!(entry.child.apps || []).includes(HOME)) { lock('هذا التطبيق غير مفعّل لطفلك. اطلب من المعالج إضافته.'); return; }
        root.SpeechSync?.expect(entry.child);
        const same = normalizeName(P?.active?.()?.name) === normalizeName(entry.child.name);
        if (!same && P?.signIn) {
            P.signIn(entry.child.name);
            // The apps redraw on load: reload once so every screen shows the child (guarded against loops).
            if (!sessionStorage.getItem('speech-entry-reloaded')) { sessionStorage.setItem('speech-entry-reloaded', '1'); location.reload(); return; }
        }
        sessionStorage.removeItem('speech-entry-reloaded');
        unlock(); if (first) root.SpeechSync?.run();
    }
    // The accounts window shows only the parent's child.
    const only = children => { const entry = read(); return entry?.mode === 'parent' ? children.filter(child => normalizeName(child.name) === normalizeName(entry.child.name)) : children; };
    function relock() { localStorage.removeItem(ENTRY_KEY); document.body.classList.remove('speech-parent'); location.reload(); }

    function init() {
        if (root.SuiteAccounts) root.SuiteAccounts.only = only;
        const entry = read();
        if (!entry) lock();
        else if (entry.mode === 'parent') open(false);
    }
    root.SpeechEntry = { lock, relock, read, refresh, validCode, checkDigit };
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(globalThis);
