/* Clinic sync: connects this app to the clinic's online database (Firebase project speech-clinic) so children
 * made on the reports page appear here and their progress goes back by itself. Identical in كلمة, جملة, مقطع and
 * اتبع التعليمات; the script tag names its app: <script defer src="assets/speech-sync.js" data-app="voc"></script>.
 *
 * - Nothing happens until this device is connected: on the therapist's own computer by signing in on the reports page
 *   (same site, same sign-in), on any other device with a join link or code made on the reports page.
 * - «حسابات الأطفال» gains «أطفال من العيادة»: the clinic's children for this app that are not on this device yet,
 *   each with a + that adds them through the app's own add row. A child already here with the same name is linked.
 * - Progress: each linked child's saved record is sent when it changes (at start, every minute, and when the app is
 *   hidden). It only reads the app's saved data; it never writes to it.
 * - A cloud button next to «ملف الطفل» (therapist switch open) shows the state, connects with a code, or disconnects. */
((root) => {
    'use strict';
    const VERSION = '13.4.0', BASE = `https://www.gstatic.com/firebasejs/${VERSION}/`;
    const CONFIG = { apiKey: 'AIzaSyCkKI0KqGy6EeJRkRsR2T71VvT5waraDeY', authDomain: 'speech-clinic.firebaseapp.com', projectId: 'speech-clinic',
        storageBucket: 'speech-clinic.firebasestorage.app', messagingSenderId: '81493283329', appId: '1:81493283329:web:eaefcee2183ca173342600' };
    const APPS = { voc: 'vocabulary-builder-v1', senb: 'sentences-builder-v1', taffaha: 'syllables-builder-v1', follow: 'follow-direction-children-v1' };
    const HOME = root.document?.currentScript?.dataset.app || '', KEY = APPS[HOME];
    const STATE_KEY = 'speech-sync-state-v1', MAP_KEY = 'speech-sync-map-v1', SENT_KEY = 'speech-sync-sent-v1', PENDING_KEY = 'speech-sync-pending-v1';
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
    const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
    const normalizeName = name => String(name || '').normalize('NFKC').replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
    const formatCode = code => String(code || '').replace(/^(\d{3})(\d{3})$/, '$1-$2');
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    // state: { mode: 'owner' | 'device', label?, role? } — set by the reports page (owner) or by joining (device).
    const state = () => read(STATE_KEY, null);

    let loading = null;
    function load() {
        return loading ||= (async () => {
            const [app, auth, store] = await Promise.all(['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(file => import(BASE + file)));
            const firebase = app.getApps().length ? app.getApp() : app.initializeApp(CONFIG);
            const a = auth.getAuth(firebase); await a.authStateReady();
            return { auth, store, a, db: store.getFirestore(firebase) };
        })().catch(error => { loading = null; throw error; });
    }

    // ---- The clinic's children for this app ----
    const sync = { children: [], user: null, device: null, error: '', last: null, busy: false };
    async function fetchChildren() {
        const { store, a, db } = await load(), user = a.currentUser; if (!user) throw Object.assign(Error('not signed in'), { code: 'signed-out' });
        sync.user = user;
        let list;
        if (!user.isAnonymous) list = (await store.getDocs(store.collection(db, 'children'))).docs;
        else {
            const device = await store.getDoc(store.doc(db, 'devices', user.uid)); if (!device.exists()) throw Object.assign(Error('not joined'), { code: 'not-joined' });
            sync.device = device.data();
            list = sync.device.all ? (await store.getDocs(store.collection(db, 'children'))).docs
                : (await Promise.all((sync.device.children || []).map(id => store.getDoc(store.doc(db, 'children', id))))).filter(entry => entry.exists());
        }
        const all = list.map(entry => ({ id: entry.id, ...entry.data() }));
        root.SpeechEntry?.refresh?.(all);
        sync.children = all.filter(child => !child.removed && (child.apps || []).includes(HOME));
        return sync.children;
    }
    const localChildren = () => { const data = read(KEY, null); return (data?.children || []).filter(child => child?.id && child.role !== 'admin' && !data.deletedChildren?.[child.id]); };
    // Links local accounts to clinic children: added from «أطفال من العيادة», or the only one with the same name.
    function link() {
        const map = read(MAP_KEY, {}), mine = map[HOME] ||= {}, pending = read(PENDING_KEY, {}), local = localChildren();
        for (const child of local) {
            if (mine[child.id]) continue;
            const wanted = pending[HOME]?.[normalizeName(child.name)];
            const same = sync.children.filter(entry => normalizeName(entry.name) === normalizeName(child.name));
            const target = wanted && sync.children.find(entry => entry.id === wanted) || (same.length === 1 ? same[0] : null);
            if (target && !Object.values(mine).includes(target.id)) { mine[child.id] = target.id; if (pending[HOME]) delete pending[HOME][normalizeName(child.name)]; }
        }
        write(MAP_KEY, map); write(PENDING_KEY, pending);
        return mine;
    }
    const waiting = () => { const mine = read(MAP_KEY, {})[HOME] || {}, linked = new Set(Object.values(mine)); return sync.children.filter(child => !linked.has(child.id)); };

    // ---- Sending progress ----
    const hash = text => { let h = 5381; for (let i = 0; i < text.length; i++) h = (h * 33 ^ text.charCodeAt(i)) >>> 0; return h.toString(36) + ':' + text.length; };
    async function send() {
        const { store, db } = await load(), mine = link(), sent = read(SENT_KEY, {}), local = localChildren(), s = state() || {};
        for (const [localId, childId] of Object.entries(mine)) {
            const child = local.find(entry => entry.id === localId); if (!child) continue;
            const data = JSON.stringify(child), tag = `${HOME}:${localId}`, h = hash(data);
            if (sent[tag] === h) continue;
            if (data.length > 900000) { sync.error = `سجل ${child.name} كبير جداً للإرسال.`; continue; }
            await store.setDoc(store.doc(db, 'children', childId, 'records', `${HOME}_${sync.user.uid}`),
                { app: HOME, device: sync.user.uid, label: s.label || '', role: sync.user.isAnonymous ? (sync.device?.role || 'parents') : 'therapist', updated: new Date().toISOString(), data });
            sent[tag] = h; write(SENT_KEY, sent);
        }
    }
    async function run() {
        if (!state() || sync.busy || !KEY) return;
        sync.busy = true; sync.error = '';
        try { await fetchChildren(); await send(); sync.last = new Date(); }
        catch (error) {
            const code = String(error?.code || '');
            sync.error = code === 'not-joined' || code === 'signed-out' ? 'هذا الجهاز غير مرتبط بالعيادة. اربطه برمز من صفحة التقارير.'
                : code.includes('permission') ? 'لا يُسمح لهذا الجهاز بهذه البيانات. اطلب رمز ربط جديداً.'
                : !navigator.onLine || code.includes('unavailable') ? 'لا يوجد اتصال بالإنترنت؛ سيُرسل التقدم لاحقاً.' : 'تعذّرت المزامنة الآن؛ سيُعاد المحاولة.';
        }
        sync.busy = false; paint();
    }

    // ---- Joining with a code from the reports page ----
    async function join(code, label) {
        code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (code.length < 8) throw Error('الرمز غير مكتمل.');
        const { auth, store, a, db } = await load();
        if (a.currentUser && !a.currentUser.isAnonymous) { write(STATE_KEY, { mode: 'owner' }); return 'owner'; }
        const user = a.currentUser || (await auth.signInAnonymously(a)).user;
        const ticket = await store.getDoc(store.doc(db, 'joinCodes', code)).catch(() => null);
        if (!ticket?.exists()) throw Error('الرمز غير صحيح أو انتهت صلاحيته.');
        const t = ticket.data();
        await store.setDoc(store.doc(db, 'devices', user.uid), { code, all: t.all, children: t.children, role: t.role, label: String(label || '').trim().slice(0, 40), joined: new Date().toISOString() });
        write(STATE_KEY, { mode: 'device', label: String(label || '').trim().slice(0, 40), role: t.role });
        return 'device';
    }
    function disconnect() { localStorage.removeItem(STATE_KEY); sync.children = []; paint(); }
    // Parents sign in with the child's name and number (assets/speech-entry.js). The reports page stores a join
    // ticket under a hash of the two, so only someone who knows both can find it.
    async function parentKey(name, code) {
        const bytes = new TextEncoder().encode(normalizeName(name) + '|' + String(code).replace(/\D/g, ''));
        return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    async function joinChild(name, code) {
        const { auth, store, a, db } = await load();
        // The therapist's own computer (signed in on the reports page): find the child directly.
        if (a.currentUser && !a.currentUser.isAnonymous) {
            const all = (await store.getDocs(store.collection(db, 'children'))).docs.map(entry => ({ id: entry.id, ...entry.data() }));
            const child = all.find(entry => entry.code === code && normalizeName(entry.name) === normalizeName(name));
            if (!child) throw Error('الاسم أو الرقم غير صحيح.');
            write(STATE_KEY, { mode: 'owner' }); return child;
        }
        const user = a.currentUser || (await auth.signInAnonymously(a)).user, key = await parentKey(name, code);
        const ticket = await store.getDoc(store.doc(db, 'joinCodes', key)).catch(() => null);
        if (!ticket?.exists()) throw Error('الاسم أو الرقم غير صحيح.');
        const t = ticket.data(), mine = await store.getDoc(store.doc(db, 'devices', user.uid)).catch(() => null);
        if (!mine?.exists()) await store.setDoc(store.doc(db, 'devices', user.uid), { code: key, all: t.all, children: t.children, role: t.role, label: 'جهاز الأهل', joined: new Date().toISOString() });
        else if (!mine.data().all && !(mine.data().children || []).includes(t.children[0])) throw Error('هذا الجهاز مرتبط بطفل آخر. اطلب من المعالج المساعدة.');
        const child = await store.getDoc(store.doc(db, 'children', t.children[0]));
        if (!child.exists()) throw Error('الاسم أو الرقم غير صحيح.');
        write(STATE_KEY, { mode: 'device', label: 'جهاز الأهل', role: 'parents' });
        return { id: child.id, ...child.data() };
    }
    // The start screen tells sync which clinic child the account it opens belongs to.
    function expect(child) { const pending = read(PENDING_KEY, {}); (pending[HOME] ||= {})[normalizeName(child.name)] = child.id; write(PENDING_KEY, pending); }

    // ---- Look: the same in every app ----
    const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    const ICONS = { cloud: svg('<path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 11 3.5 3.5 0 0 0 7 18Z"/>'), on: svg('<path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 11 3.5 3.5 0 0 0 7 18Z"/><path d="m9.5 13.5 2 2 3.5-3.5"/>'),
        plus: svg('<path d="M12 5v14M5 12h14"/>'), close: svg('<path d="m6 6 12 12M18 6 6 18"/>'), refresh: svg('<path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4"/>') };
    const CSS = `
.speech-sync-section{margin-top:14px;padding:12px;border:1.5px dashed #9fd3b4;border-radius:18px;background:#f4fbf7}
.speech-sync-section h3{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:15px;color:#1f6b45}.speech-sync-section h3 svg{width:20px;height:20px}
.speech-sync-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:#fff;margin-top:6px}
.speech-sync-row span{flex:1;display:grid}.speech-sync-row b{font-size:16px}.speech-sync-row small{color:#587082}
.speech-sync-add{display:inline-grid;place-items:center;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:#2f7a52;color:#fff;cursor:pointer}.speech-sync-add svg{width:22px;height:22px}
.speech-sync{width:min(420px,calc(100vw - 24px));padding:0;border:0;border-radius:24px;background:#fff;color:#18394b;box-shadow:0 24px 70px #0f2a3a40;font:inherit}
.speech-sync::backdrop{background:#0f2a3a59}
.speech-sync header{display:flex;align-items:center;gap:10px;padding:16px 18px 8px}.speech-sync header>svg{width:26px;height:26px;color:#2f7a52}.speech-sync h2{flex:1;margin:0;font-size:20px}
.speech-sync-icon{display:inline-grid;place-items:center;width:40px;height:40px;padding:0;border:1px solid #dbe7ee;border-radius:50%;background:#fff;color:#18394b;cursor:pointer}.speech-sync-icon svg{width:20px;height:20px}
.speech-sync-body{display:grid;gap:12px;padding:4px 18px 18px}
.speech-sync-body p{margin:0;line-height:1.6}.speech-sync-state{padding:10px 12px;border-radius:14px;background:#f1f5f9;font-weight:700}.speech-sync-state[data-on]{background:#eaf7ef;color:#1f6b45}.speech-sync-state[data-error]{background:#fee2e2;color:#b42318}
.speech-sync input{min-height:46px;padding:8px 12px;border:1.5px solid #dbe7ee;border-radius:14px;font:inherit;color:inherit;background:#fff}
.speech-sync input[data-code]{direction:ltr;text-align:center;letter-spacing:.18em;font-weight:800;text-transform:uppercase}
.speech-sync-actions{display:flex;gap:10px;flex-wrap:wrap}.speech-sync-actions button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 14px;border:1.5px solid #dbe7ee;border-radius:16px;background:#fff;color:#18394b;font:inherit;font-weight:800;cursor:pointer}
.speech-sync-actions button.primary{border-color:#2f7a52;background:#2f7a52;color:#fff}.speech-sync-actions button[data-armed]{border-color:#b42318;color:#b42318;background:#fee2e2}.speech-sync-actions svg{width:20px;height:20px}
.speech-sync :focus-visible,.speech-sync-section :focus-visible{outline:3px solid #2f7a5280;outline-offset:2px}`;
    function style() { if (document.getElementById('speech-sync-style')) return; const tag = document.createElement('style'); tag.id = 'speech-sync-style'; tag.textContent = CSS; document.head.append(tag); }

    // ---- «أطفال من العيادة» inside «حسابات الأطفال» ----
    // Adds a clinic child through the app's own add row, then links the new account to it.
    function add(child, host) {
        const input = host.closest('dialog')?.querySelector('input[placeholder="اسم الطفل"]'), form = input?.form;
        if (!form || !input) return;
        const pending = read(PENDING_KEY, {}); (pending[HOME] ||= {})[normalizeName(child.name)] = child.id; write(PENDING_KEY, pending);
        input.value = child.name; input.dispatchEvent(new Event('input', { bubbles: true })); form.requestSubmit();
        setTimeout(() => { link(); run(); }, 600);
    }
    function extend(host) {
        host.querySelector('.speech-sync-section')?.remove();
        const list = state() ? waiting() : []; if (!list.length) return;
        style();
        const section = document.createElement('section'); section.className = 'speech-sync-section'; section.setAttribute('aria-label', 'أطفال من العيادة');
        section.innerHTML = `<h3>${ICONS.on}أطفال من العيادة</h3>` + list.map(child => `<div class="speech-sync-row"><span><b>${escape(child.name)}</b>${child.code ? `<small>رقم الطفل <bdi dir="ltr">${formatCode(child.code)}</bdi></small>` : ''}</span><button type="button" class="speech-sync-add" data-add="${escape(child.id)}" aria-label="إضافة ${escape(child.name)} إلى هذا الجهاز" title="إضافة إلى هذا الجهاز">${ICONS.plus}</button></div>`).join('');
        section.querySelectorAll('[data-add]').forEach(button => { button.onclick = () => add(sync.children.find(child => child.id === button.dataset.add), host); });
        host.append(section);
    }

    // ---- The cloud button and its window ----
    let dialog;
    function paint() {
        const on = !!state() && !sync.error;
        document.querySelectorAll('[data-speech-sync]').forEach(button => {
            button.innerHTML = on ? ICONS.on : ICONS.cloud; button.style.color = on ? '#2f7a52' : sync.error && state() ? '#b42318' : '';
            const label = !state() ? 'ربط هذا الجهاز بالعيادة' : sync.error ? 'مزامنة العيادة: ' + sync.error : 'متصل بالعيادة'; button.setAttribute('aria-label', label); button.title = label;
        });
        document.querySelectorAll('.suite-account-browser').forEach(extend);
        if (dialog?.open) fill();
    }
    function fill() {
        const s = state(), head = `<header>${ICONS.on}<h2 id="speech-sync-title">العيادة</h2><button type="button" class="speech-sync-icon" data-close aria-label="إغلاق" title="إغلاق">${ICONS.close}</button></header>`;
        if (s) {
            const where = s.mode === 'owner' ? 'جهاز المعالج (حساب العيادة)' : escape(s.label || 'جهاز مرتبط');
            dialog.innerHTML = head + `<div class="speech-sync-body"><p class="speech-sync-state" ${sync.error ? 'data-error' : 'data-on'}>${sync.error ? escape(sync.error) : `متصل · ${where}`}</p>
                <p>${sync.children.length} طفل من العيادة لهذا التطبيق.${sync.last ? ` آخر مزامنة ${sync.last.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}.` : ''} يُرسل التقدم وحده عند كل تغيير.</p>
                <div class="speech-sync-actions"><button type="button" class="primary" data-now>${ICONS.refresh}مزامنة الآن</button><button type="button" data-off>فصل هذا الجهاز</button></div>${relockButton()}</div>`;
            dialog.querySelector('[data-now]').onclick = () => run();
            const off = dialog.querySelector('[data-off]');
            off.onclick = () => { if (!off.dataset.armed) { off.dataset.armed = '1'; off.textContent = 'اضغط مرة أخرى للفصل'; setTimeout(() => { if (off.isConnected) { delete off.dataset.armed; off.textContent = 'فصل هذا الجهاز'; } }, 3000); return; } disconnect(); };
        } else {
            const code = new URLSearchParams(location.search).get('join') || '';
            dialog.innerHTML = head + `<div class="speech-sync-body"><p>اربط هذا الجهاز بالعيادة ليصل تقدم الأطفال إلى صفحة التقارير وحده. اطلب الرمز من صفحة التقارير.</p>
                <input data-code maxlength="12" autocomplete="off" placeholder="الرمز" aria-label="رمز الربط" value="${escape(code)}">
                <input data-label maxlength="40" autocomplete="off" placeholder="اسم الجهاز، مثل: آيباد البيت" aria-label="اسم الجهاز">
                <p role="status" aria-live="polite"></p>
                <div class="speech-sync-actions"><button type="button" class="primary" data-join>${ICONS.on}ربط</button></div>${relockButton()}</div>`;
            const status = dialog.querySelector('[role=status]'), go = dialog.querySelector('[data-join]');
            go.onclick = async () => {
                go.disabled = true; status.textContent = 'جارٍ الربط…';
                try { await join(dialog.querySelector('[data-code]').value, dialog.querySelector('[data-label]').value); status.textContent = ''; await run(); }
                catch (error) { status.textContent = error?.message && /[؀-ۿ]/.test(error.message) ? error.message : 'تعذّر الربط. تحقق من الاتصال والرمز.'; }
                go.disabled = false;
            };
        }
        dialog.querySelector('[data-relock]')?.addEventListener('click', () => root.SpeechEntry?.relock());
        dialog.querySelector('[data-close]').onclick = () => dialog.close();
    }
    // Hands the device back to parents: the app opens on the start screen again (name + number, or 013).
    const relockButton = () => root.SpeechEntry ? `<div class="speech-sync-actions"><button type="button" data-relock>قفل التطبيق (شاشة الدخول)</button></div>` : '';
    function open() {
        style();
        if (!dialog) { dialog = document.createElement('dialog'); dialog.className = 'speech-sync'; dialog.dir = 'rtl'; dialog.setAttribute('aria-labelledby', 'speech-sync-title'); document.body.append(dialog); dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }); }
        fill(); dialog.showModal();
    }
    // Next to «ملف الطفل» (itself next to «خطة التدخل»), shown and hidden with it.
    const made = new WeakMap();
    function attach() {
        for (const file of document.querySelectorAll('[data-child-file]')) {
            // Made once per «ملف الطفل» button and kept beside it when an app re-sorts its header.
            const mine = made.get(file); if (mine) { if (file.nextElementSibling !== mine) file.after(mine); continue; }
            const b = document.createElement('button'); made.set(file, b); b.type = 'button'; b.className = file.className; b.dataset.speechSync = ''; b.setAttribute('aria-haspopup', 'dialog');
            b.hidden = file.hidden; b.onclick = open;
            new MutationObserver(() => { b.hidden = file.hidden; }).observe(file, { attributes: true, attributeFilter: ['hidden'] });
            file.after(b); paint();
        }
        document.querySelectorAll('.suite-account-browser').forEach(host => { if (!host.querySelector('.speech-sync-section') && state() && waiting().length) extend(host); });
    }
    function init() {
        if (root.SuiteAccounts) root.SuiteAccounts.extend = extend;
        attach(); new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });
        // A join link (…/?join=CODE) opens the window ready to connect, even before the therapist switch is opened.
        if (new URLSearchParams(location.search).has('join') && !state()) setTimeout(open, 400);
        run(); setInterval(run, 60000);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') run(); });
    }
    root.SpeechSync = { run, join, joinChild, parentKey, expect, disconnect, state, link, waiting, sync };
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(globalThis);
