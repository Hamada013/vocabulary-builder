(() => {
    'use strict';
    const P = window.VocProgress;
    function init() {
        const dialog = document.createElement('dialog'); dialog.className = 'suite-account-dialog'; dialog.id = 'child-dialog';
        dialog.setAttribute('aria-labelledby', 'child-title');
        dialog.innerHTML = `<div class="account-head"><h2 id="child-title">حسابات الأطفال</h2><div class="account-head-tools"><button type="button" id="child-close" aria-label="إغلاق" title="إغلاق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div></div><form class="account-add"><label for="child-name">فتح أو إضافة طفل</label><div class="account-add-row"><input id="child-name" name="name" autocomplete="off" maxlength="60" required dir="auto" placeholder="اسم الطفل"><button type="submit">دخول / إضافة</button></div></form><div id="saved-children"></div>`;
        document.body.append(dialog);
        let authorized = false, opening = false;
        const enter = name => {
            name = String(name).normalize('NFKC').trim().replace(/\s+/g, ' ').slice(0, 60);
            if (!name) { dialog.querySelector('input').focus(); return; }
            if (P.active()?.name.toLocaleLowerCase() === name.toLocaleLowerCase()) { window.AppNavigation?.register(); dialog.close(); return; }
            if (!authorized) return;
            authorized = false;
            window.dispatchEvent(new Event('voc-profile-beforechange'));
            const previous = P.active()?.id;
            if (!P.signIn(name)) return;
            window.AppNavigation?.register();
            if (previous !== P.active().id && P.storageOK()) { window.SuiteWelcome?.skipNextLoad(); location.reload(); }
            else {
                dialog.close();
                document.querySelectorAll('[data-child-profile]').forEach(button => { button.querySelector('.child-name').textContent = P.active().name; button.setAttribute('aria-label', `ملف الطفل: ${P.active().name}`); });
                document.querySelectorAll('[data-child-report]').forEach(report => { report.disabled = !P.active(); report.setAttribute('aria-label', P.isAdmin() ? 'تقرير جميع الأطفال' : 'تقرير الطفل'); report.title = report.getAttribute('aria-label'); });
                window.dispatchEvent(new Event('voc-profile-memorychange'));
            }
        };
        const open = async (requestedName) => {
            if (opening || dialog.open) return;
            opening = true; authorized = false;
            window.dispatchEvent(new Event('voc-profile-open'));
            const owner = P.active()?.id || null;
            const needsGate = !!owner || P.children().length > 0;
            try {
                if (needsGate && !await (window.ChildAccountGate?.request() || Promise.resolve(false))) return;
                if (owner !== (P.active()?.id || null)) return;
                authorized = true;
                dialog.querySelector('#child-name').value = typeof requestedName === 'string' ? requestedName : '';
                dialog.querySelector('#child-close').hidden = !P.active();
                const savedChildren = dialog.querySelector('#saved-children');
                window.SuiteAccounts.render(savedChildren,P.children(),child=>{
                    const button=document.createElement('button');button.type='button';button.className='voc-choice';button.textContent=child.name;button.onclick=()=>enter(child.name);
                    return window.SuiteAccounts.row(child,button);
                });
                dialog.showModal(); dialog.querySelector('#child-name').focus();
            } finally { opening = false; }
        };
        dialog.querySelector('form').addEventListener('submit', event => { event.preventDefault(); enter(dialog.querySelector('input').value); });
        dialog.querySelector('#child-close').addEventListener('click', () => { if (P.active()) dialog.close(); });
        dialog.addEventListener('close', () => { authorized = false; });
        dialog.addEventListener('cancel', event => { if (!P.active()) event.preventDefault(); });
        for (const host of document.querySelectorAll('.app-home-tools, #workplace-view > header, .game-header')) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'child-button'; button.dataset.childProfile = ''; if (P.isAdmin()) button.classList.add('admin-profile');
            button.setAttribute('aria-label', `ملف الطفل: ${P.active()?.name || 'دخول'}`);
            const icon = document.createElement('i'); icon.className = P.isAdmin() ? 'fas fa-user-shield' : 'fas fa-user'; icon.setAttribute('aria-hidden', 'true');
            const name = document.createElement('span'); name.className = 'child-name'; name.textContent = P.active()?.name || 'اسم الطفل'; button.append(icon, name);
            // The active child's drawn head replaces the generic person icon (accounts.js loads after this file).
            const showHead = () => { const chip = !P.isAdmin() && P.active() && window.SuiteAccounts?.avatarFor(P.active()); if (!chip) return; const holder = document.createElement('span'); holder.className = 'suite-account-chip'; holder.append(chip); button.firstElementChild.replaceWith(holder); };
            if (window.SuiteAccounts) showHead(); else window.addEventListener('DOMContentLoaded', showHead, { once: true });
            window.addEventListener('suite-avatar-change', showHead);
            button.addEventListener('click', open); host.append(button);
            const report = document.createElement('button'); report.type = 'button'; report.className = 'child-report-button'; report.dataset.childReport = '';
            report.setAttribute('aria-label', P.isAdmin() ? 'تقرير جميع الأطفال' : 'تقرير الطفل'); report.title = report.getAttribute('aria-label');
            report.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-4M9 2h6v4H9zM8 16v-3m4 3V9m4 7v-5"/></svg>';
            report.disabled = !P.active(); report.onclick = () => { window.dispatchEvent(new Event('voc-profile-open')); window.VocReports.open(); }; host.append(report);

        }
        if (P.currentRound() && !new URLSearchParams(location.search).has('plan')) {
            const resume = document.createElement('a'); resume.className = 'child-button'; resume.textContent = 'متابعة مسار الألعاب'; resume.href = P.planURL();
            document.querySelector('.app-home-tools, .game-header')?.append(resume);
        }
        window.VocProfile = { open };
        const welcoming=window.SuiteWelcome?.connect(P,name=>{authorized=true;enter(name);});
        if (!welcoming && !P.active() && !new URLSearchParams(location.search).has('reportChild') && !new URLSearchParams(location.search).has('createProfile')) open();
    }
    window.addEventListener('voc-storage-error', () => {
        if (document.querySelector('.voc-storage-error')) return;
        const alert = document.createElement('p'); alert.className = 'voc-storage-error'; alert.setAttribute('role', 'alert');
        alert.textContent = 'تعذّر حفظ التقدم على الجهاز. تحقق من مساحة التخزين وإعدادات المتصفح.'; document.body.append(alert);
    });
    document.addEventListener('DOMContentLoaded', init);
})();
