/* Camera mirror for imitation practice, shared by كلمة and جملة (identical copies).
 * A camera button in the header splits the play area into two equal squares: the card on one side,
 * the front camera (mirrored) on the other. The adult can record the child saying the word and play
 * it back in a loop. Recordings live only in memory: nothing is saved or sent, and the camera is
 * switched off when the mirror closes, the page is hidden or left.
 *   SuiteMirror.attach({ toggleHost, card, label })  adds the header button; card() returns the element to pair with
 *   SuiteMirror.close()                              closes the mirror and stops the camera */
((root) => {
    'use strict';
    const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    const ICONS = {
        camera: svg('<path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.6"/>'),
        record: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="currentColor"/></svg>',
        stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor"/></svg>',
        replay: svg('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5"/>'),
        live: svg('<circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/>')
    };
    const MAX_MS = 20000;
    let state = null;

    function button(cls, label, icon) {
        const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.setAttribute('aria-label', label); b.title = label; b.innerHTML = icon; return b;
    }
    function attach({ toggleHost, card, label = 'المرآة: الكاميرا الأمامية للتقليد' }) {
        if (!toggleHost || toggleHost.querySelector('.mirror-toggle')) return null;
        const toggle = button('mirror-toggle suite-icon', label, ICONS.camera);
        toggle.setAttribute('aria-pressed', 'false');
        toggle.addEventListener('click', () => state ? close() : open(card(), toggle));
        toggleHost.append(toggle);
        if (!navigator.mediaDevices?.getUserMedia) toggle.hidden = true;
        return toggle;
    }

    function open(cardElement, toggle) {
        if (!cardElement || state) return;
        const split = document.createElement('div'); split.className = 'mirror-split';
        const marker = document.createComment('mirror card');
        cardElement.before(marker); cardElement.before(split);
        const cardBox = document.createElement('div'); cardBox.className = 'mirror-square mirror-card'; cardBox.append(cardElement);
        const camBox = document.createElement('section'); camBox.className = 'mirror-square mirror-camera'; camBox.setAttribute('aria-label', 'المرآة');
        const live = document.createElement('video'); live.className = 'mirror-live'; live.muted = true; live.playsInline = true; live.autoplay = true; live.setAttribute('playsinline', ''); live.setAttribute('aria-label', 'الكاميرا الأمامية');
        const replay = document.createElement('video'); replay.className = 'mirror-replay'; replay.playsInline = true; replay.loop = true; replay.hidden = true; replay.setAttribute('playsinline', ''); replay.setAttribute('aria-label', 'إعادة التسجيل');
        const status = document.createElement('p'); status.className = 'mirror-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
        const bar = document.createElement('div'); bar.className = 'mirror-bar';
        const rec = button('mirror-rec', 'تسجيل', ICONS.record), watch = button('mirror-watch', 'إعادة التسجيل', ICONS.replay), back = button('mirror-back-live', 'الكاميرا المباشرة', ICONS.live);
        const time = document.createElement('span'); time.className = 'mirror-time'; time.setAttribute('aria-hidden', 'true');
        watch.disabled = true; back.hidden = true;
        bar.append(watch, rec, back, time);
        const note = document.createElement('small'); note.className = 'mirror-note'; note.textContent = 'لا يُحفظ أي تسجيل';
        camBox.append(live, replay, status, bar, note);
        split.append(cardBox, camBox);
        state = { split, marker, cardElement, toggle, live, replay, status, rec, watch, back, time, stream: null, recorder: null, chunks: [], url: null, timer: null, started: 0 };
        toggle.setAttribute('aria-pressed', 'true'); toggle.classList.add('is-on'); document.body.classList.add('mirror-on');
        rec.addEventListener('click', () => state?.recorder ? stopRecording() : startRecording());
        watch.addEventListener('click', showReplay);
        back.addEventListener('click', showLive);
        root.dispatchEvent(new Event('suite-mirror-change'));
        void startCamera();
    }

    async function startCamera() {
        const s = state; if (!s || s.stream) return;
        s.status.textContent = 'جارٍ فتح الكاميرا…';
        try {
            let stream;
            try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }, audio: true }); }
            catch (error) { if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') throw error; stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }); }
            if (state !== s) { stream.getTracks().forEach(track => track.stop()); return; }
            s.stream = stream; s.live.srcObject = stream; await s.live.play().catch(() => {});
            s.status.textContent = ''; s.rec.disabled = !root.MediaRecorder;
        } catch (error) {
            if (state !== s) return;
            s.status.textContent = error?.name === 'NotAllowedError' ? 'اسمح باستخدام الكاميرا من إعدادات المتصفح ثم أعد المحاولة.' : 'تعذر فتح الكاميرا على هذا الجهاز.';
            s.rec.disabled = true;
        }
    }
    function stopCamera() {
        const s = state; if (!s) return;
        if (s.recorder) { try { s.recorder.stop(); } catch {} s.recorder = null; }
        clearInterval(s.timer);
        s.stream?.getTracks().forEach(track => track.stop()); s.stream = null; s.live.srcObject = null;
    }
    function mimeType() {
        for (const type of ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']) if (root.MediaRecorder?.isTypeSupported?.(type)) return type;
        return '';
    }
    function startRecording() {
        const s = state; if (!s?.stream || s.recorder) return;
        showLive();
        const type = mimeType(); let recorder;
        try { recorder = new MediaRecorder(s.stream, type ? { mimeType: type } : undefined); } catch { s.status.textContent = 'التسجيل غير متاح على هذا الجهاز.'; return; }
        s.chunks = []; s.recorder = recorder; s.started = Date.now();
        recorder.ondataavailable = event => { if (event.data?.size) s.chunks.push(event.data); };
        recorder.onstop = () => {
            if (state !== s || !s.chunks.length) return;
            if (s.url) URL.revokeObjectURL(s.url);
            s.url = URL.createObjectURL(new Blob(s.chunks, { type: recorder.mimeType || type || 'video/mp4' })); s.chunks = [];
            s.watch.disabled = false; showReplay();
        };
        recorder.start();
        s.rec.innerHTML = ICONS.stop; s.rec.setAttribute('aria-label', 'إيقاف التسجيل'); s.rec.title = 'إيقاف التسجيل'; s.rec.classList.add('is-recording');
        s.split.classList.add('is-recording'); s.watch.disabled = true;
        const tick = () => { const ms = Date.now() - s.started; s.time.textContent = `${Math.floor(ms / 1000)} ث`; if (ms >= MAX_MS) stopRecording(); };
        tick(); s.timer = setInterval(tick, 250);
    }
    function stopRecording() {
        const s = state; if (!s?.recorder) return;
        clearInterval(s.timer); s.time.textContent = '';
        try { s.recorder.stop(); } catch {}
        s.recorder = null;
        s.rec.innerHTML = ICONS.record; s.rec.setAttribute('aria-label', 'تسجيل'); s.rec.title = 'تسجيل'; s.rec.classList.remove('is-recording');
        s.split.classList.remove('is-recording');
    }
    function showReplay() {
        const s = state; if (!s?.url) return;
        s.replay.src = s.url; s.replay.hidden = false; s.live.hidden = true; s.back.hidden = false; s.watch.hidden = true;
        void s.replay.play().catch(() => {});
    }
    function showLive() {
        const s = state; if (!s) return;
        s.replay.pause(); s.replay.hidden = true; s.live.hidden = false; s.back.hidden = true; s.watch.hidden = false;
    }
    function close() {
        const s = state; if (!s) return;
        stopCamera();
        s.replay.pause(); s.replay.removeAttribute('src'); s.replay.load?.();
        if (s.url) URL.revokeObjectURL(s.url);
        s.marker.replaceWith(s.cardElement); s.split.remove();
        s.toggle.setAttribute('aria-pressed', 'false'); s.toggle.classList.remove('is-on'); document.body.classList.remove('mirror-on');
        state = null;
        root.dispatchEvent(new Event('suite-mirror-change'));
    }
    if (root.document) {
        root.addEventListener('pagehide', close);
        document.addEventListener('visibilitychange', () => { if (!state) return; if (document.hidden) { stopRecording(); stopCamera(); } else void startCamera(); });
    }
    root.SuiteMirror = { attach, close, isOpen: () => !!state };
})(globalThis);
