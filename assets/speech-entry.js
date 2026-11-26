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
                try { sessionStorage.setItem(WELCOME_KEY, '1'); } catch {}
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
        if (sessionStorage.getItem(WELCOME_KEY)) { sessionStorage.removeItem(WELCOME_KEY); welcome(entry.child); }
    }
    // ---- The parents' welcome (2026-11-26): right after they sign in, a short animated card from the therapist ----
    const WELCOME_KEY = 'speech-entry-welcome';
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const WELCOME_CSS = `
.speech-welcome{width:min(400px,calc(100vw - 32px));padding:28px 24px 22px;border:0;border-radius:30px;background:#fff;color:#18394b;text-align:center;box-shadow:0 30px 80px #0f2a3a40;font:inherit;overflow:visible}
.speech-welcome::backdrop{background:#0f2a3a66}
.speech-welcome img{display:block;margin:0 auto;width:104px;height:104px;border-radius:30px;object-fit:cover;box-shadow:0 10px 30px #0f2a3a26;background:#fff}
.speech-welcome h2{margin:14px 0 6px;font-size:28px}.speech-welcome p{margin:4px 0;font-size:18px;line-height:1.7}
.speech-welcome .speech-welcome-who{font-weight:800;color:#0b6f80}
.speech-welcome .speech-welcome-until{margin-top:14px;font-size:15px;color:#587082}
.speech-welcome .speech-welcome-date{display:inline-block;margin-top:2px;padding:6px 14px;border-radius:12px;background:#eef6fb;font-weight:800;font-size:18px;direction:ltr;unicode-bidi:isolate}
.speech-welcome button{width:100%;min-height:56px;margin-top:18px;border:0;border-radius:18px;background:#0284c7;color:#fff;font:inherit;font-size:19px;font-weight:800;cursor:pointer}
.speech-welcome-dots{position:absolute;inset:0;pointer-events:none}.speech-welcome-dots i{position:absolute;left:50%;top:76px;width:10px;height:10px;border-radius:50%;opacity:0}
@media (prefers-reduced-motion:no-preference){
.speech-welcome[open]{animation:speech-welcome-in .5s cubic-bezier(.2,.9,.3,1.2) both}
.speech-welcome img{animation:speech-welcome-wave 1.4s .35s ease-in-out both}
.speech-welcome h2,.speech-welcome p,.speech-welcome button{animation:speech-welcome-up .45s ease-out both}
.speech-welcome h2{animation-delay:.25s}.speech-welcome p:nth-of-type(1){animation-delay:.35s}.speech-welcome p:nth-of-type(2){animation-delay:.45s}.speech-welcome p:nth-of-type(3){animation-delay:.55s}.speech-welcome p:nth-of-type(4){animation-delay:.6s}.speech-welcome button{animation-delay:.7s}
.speech-welcome-dots i{animation:speech-welcome-dot .9s .3s ease-out forwards}}
@keyframes speech-welcome-in{from{opacity:0;transform:translateY(24px) scale(.9)}to{opacity:1;transform:none}}
@keyframes speech-welcome-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes speech-welcome-wave{0%,100%{transform:rotate(0)}20%{transform:rotate(-8deg) scale(1.06)}40%{transform:rotate(7deg) scale(1.06)}60%{transform:rotate(-5deg)}80%{transform:rotate(3deg)}}
@keyframes speech-welcome-dot{0%{opacity:1;transform:translate(-50%,-50%) scale(.4)}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1)}}`;
    function welcome(child) {
        if (!document.getElementById('speech-welcome-style')) { const tag = document.createElement('style'); tag.id = 'speech-welcome-style'; tag.textContent = WELCOME_CSS; document.head.append(tag); }
        const box = document.createElement('dialog'); box.className = 'speech-welcome'; box.dir = 'rtl'; box.setAttribute('aria-labelledby', 'speech-welcome-title');
        const src = logo(), until = child.until ? new Intl.DateTimeFormat('en-GB').format(new Date(child.until)) : '';
        const colors = ['#f59e0b', '#22c55e', '#38bdf8', '#f472b6', '#a78bfa', '#facc15', '#fb7185', '#34d399'];
        const dots = colors.concat(colors).map((c, i) => { const a = i / 16 * Math.PI * 2, r = 110 + (i % 2) * 40; return `<i style="background:${c};--x:${Math.round(Math.cos(a) * r)}px;--y:${Math.round(Math.sin(a) * r)}px"></i>`; }).join('');
        box.innerHTML = `<div class="speech-welcome-dots" aria-hidden="true">${dots}</div>${src ? `<img src="${src}" alt="">` : ''}<h2 id="speech-welcome-title">أهلاً وسهلاً!</h2>
            <p class="speech-welcome-who">أنا أحمد غانم، أخصائي النطق واللغة.</p><p>سعيد جداً بالعمل مع <bdi>${escape(child.name)}</bdi>، وأتمنى لكم وقتاً ممتعاً ومفيداً.</p>
            ${until ? `<p class="speech-welcome-until">الحساب صالح حتى:</p><p><span class="speech-welcome-date">${until}</span></p>` : ''}<button type="button">لنبدأ</button>`;
        box.querySelector('button').onclick = () => { box.close(); box.remove(); };
        box.addEventListener('cancel', () => box.remove());
        document.body.append(box); box.showModal();
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
