/* Child level controls shared by كلمة, جملة and مقطع (identical copies):
 *   ChildLevel.chips(value, onChange)        three buttons (سهل · متوسط · متقدم) for a new child
 *   ChildLevel.menu(value, onChange, label)  a coloured pill that opens a styled list, for each child's row
 * No browser-default dropdowns: the list is rounded and white with a green check on the chosen level,
 * and works with the keyboard (arrows, Enter, Escape) and outside taps. */
((root) => {
    'use strict';
    const NAMES = { easy: 'سهل', moderate: 'متوسط', advanced: 'متقدم' };
    const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
    const chevron = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
    let openMenu = null;
    const closeOpen = () => openMenu?.close();
    if (root.document) {
        document.addEventListener('pointerdown', event => { if (openMenu && !openMenu.wrap.contains(event.target)) closeOpen(); });
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && openMenu) { event.preventDefault(); event.stopPropagation(); openMenu.close(true); } }, true);
    }
    function chips(value, onChange) {
        const group = document.createElement('div'); group.className = 'child-level-chips'; group.setAttribute('role', 'radiogroup'); group.setAttribute('aria-label', 'مستوى الطفل');
        const label = document.createElement('span'); label.className = 'child-level-chips-label'; label.textContent = 'المستوى'; group.append(label);
        const buttons = Object.entries(NAMES).map(([id, name]) => {
            const button = document.createElement('button'); button.type = 'button'; button.setAttribute('role', 'radio'); button.dataset.level = id; button.textContent = name;
            button.onclick = () => set(id);
            button.onkeydown = event => { const step = { ArrowLeft: 1, ArrowRight: -1 }[event.key]; if (!step) return; event.preventDefault(); const ids = Object.keys(NAMES), next = ids[(ids.indexOf(id) + step + ids.length) % ids.length]; set(next); group.querySelector(`[data-level="${next}"]`).focus(); };
            group.append(button); return button;
        });
        function set(id) { value = id; buttons.forEach(button => { button.setAttribute('aria-checked', String(button.dataset.level === id)); button.tabIndex = button.dataset.level === id ? 0 : -1; }); onChange?.(id); }
        set(NAMES[value] ? value : 'easy');
        group.value = () => value; group.reset = () => set('easy');
        return group;
    }
    function menu(value, onChange, label = 'المستوى') {
        const wrap = document.createElement('div'); wrap.className = 'child-level-menu';
        const trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'child-level-pill'; trigger.setAttribute('aria-haspopup', 'listbox'); trigger.setAttribute('aria-expanded', 'false');
        const list = document.createElement('div'); list.className = 'child-level-list'; list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', label); list.hidden = true;
        const options = Object.entries(NAMES).map(([id, name]) => {
            const option = document.createElement('button'); option.type = 'button'; option.setAttribute('role', 'option'); option.dataset.level = id; option.tabIndex = -1;
            option.innerHTML = `<span>${name}</span>${check}`;
            option.onclick = () => { close(true); if (id !== value && onChange?.(id) !== false) show(id); };
            list.append(option); return option;
        });
        function show(id) { value = id; trigger.dataset.level = id; trigger.innerHTML = `<span>${NAMES[id]}</span>${chevron}`; trigger.setAttribute('aria-label', `${label}: ${NAMES[id]}`); trigger.title = label; options.forEach(option => option.setAttribute('aria-selected', String(option.dataset.level === id))); }
        function open() {
            closeOpen(); list.hidden = false; trigger.setAttribute('aria-expanded', 'true'); openMenu = { wrap, close };
            // Open upwards when there is no room below (the list sits inside a scrolling dialog).
            list.classList.remove('above'); const box = list.getBoundingClientRect(), bounds = wrap.closest('dialog')?.getBoundingClientRect();
            if (box.bottom > Math.min(root.innerHeight, bounds?.bottom || root.innerHeight) - 8) list.classList.add('above');
            options.find(option => option.dataset.level === value).focus();
        }
        function close(focus = false) { list.hidden = true; trigger.setAttribute('aria-expanded', 'false'); if (openMenu?.wrap === wrap) openMenu = null; if (focus) trigger.focus(); }
        trigger.onclick = () => list.hidden ? open() : close();
        trigger.onkeydown = event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); open(); } };
        list.onkeydown = event => {
            const at = options.indexOf(document.activeElement);
            if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); options[(at + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length].focus(); }
            else if (event.key === 'Tab') close();
        };
        show(NAMES[value] ? value : 'easy'); wrap.append(trigger, list);
        return wrap;
    }
    root.ChildLevel = { NAMES, chips, menu };
})(globalThis);
