/* In-app navigation for one standalone app: activity menu, workplace settings and header order.
 * There are no links to other apps or websites, and no account switching. */
(() => {
 'use strict';
 const appId=document.currentScript.dataset.app;
 const base=new URL('../',document.currentScript.src);
 const svg=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
 const icons={
  settings:svg('<path d="m9 3-.7 2.2-2 .9-2.1-.5-2 3.4 1.5 1.7v2.6L2.2 15l2 3.4 2.1-.5 2 .9L9 21h4l.7-2.2 2-.9 2.1.5 2-3.4-1.5-1.7v-2.6L19.8 9l-2-3.4-2.1.5-2-.9L13 3z"/><circle cx="11" cy="12" r="3"/>'),
  list:svg('<path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01"/>'),
  report:svg('<path d="M9 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-4M9 2h6v4H9zM8 16v-3m4 3V9m4 7v-5"/>'),
  download:svg('<path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>'),
  info:svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>'),
  home:svg('<path d="M3 11l9-8 9 8M5 10v11h5v-7h4v7h5V10"/>'),
  games:svg('<path d="M7 7h10a4 4 0 0 1 4 3l1 7a2 2 0 0 1-3 2l-4-3H9l-4 3a2 2 0 0 1-3-2l1-7a4 4 0 0 1 4-3Z"/><path d="M7 10v4m-2-2h4m7-1h.01M18 13h.01"/>')
 };
 function button(label,icon){const b=document.createElement('button');b.type='button';b.className='suite-icon';b.innerHTML=icons[icon];b.title=label;b.setAttribute('aria-label',label);return b;}
 // Physical left-to-right order also defines keyboard order.
 const controlOrder={settings:0,activities:10,download:30,end:35,info:40,family:45,report:50,back:70};
 function controlKind(node){
  if(node.dataset.suiteControl)return node.dataset.suiteControl;
  for(const [kind,selector]of Object.entries({back:'.game-back,#go-home,#activityHomeBtn,#home-link',report:'[data-child-report],#open-report,[aria-label="تقرير الطفل"]',family:'[data-family-lesson],[aria-label="تدريب العائلة"]',info:'[aria-label="معلومات التطبيق"]',end:'[data-session-end]',download:'[data-open-download],#pwaDownloadToggle,#open-offline,#install',activities:'[data-suite-menu]',settings:'[data-suite-settings]'}))if(node.matches(selector))return kind;
  return null;
 }
 function orderControls(host){
  const homeGroup=host.querySelector('#homeHeaderTools');if(homeGroup)orderControls(homeGroup);
  const controls=[...host.children].filter(node=>{
   const kind=controlKind(node);if(kind){
    node.dataset.suiteControl=kind;const label=node.getAttribute('aria-label')||node.title||node.textContent.trim();node.setAttribute('aria-label',label);if(!node.title)node.title=label;
    const glyph=kind==='back'?(node.getAttribute('href')==='games.html'?'games':'home'):kind;
    if(icons[glyph]&&!node.querySelector('[data-suite-glyph]')){
     const template=document.createElement('template');template.innerHTML=icons[glyph];const icon=template.content.firstElementChild;icon.dataset.suiteGlyph=glyph;
     const old=node.querySelector('svg,i');if(old)old.replaceWith(icon);else node.prepend(icon);
    }
   }
   return kind||node===homeGroup;
  });
  const rank=node=>node===homeGroup?35:controlOrder[node.dataset.suiteControl];
  const ordered=[...controls].sort((a,b)=>rank(a)-rank(b));
  if(controls.some((node,index)=>node!==ordered[index]))for(const node of ordered)host.append(node);
 }
 let bar,trigger,settings;
 function pause(){window.dispatchEvent(new Event('suite-navigation-open'));window.dispatchEvent(new Event(`${appId}-profile-open`));}
 function closeBar(){if(!bar)return;bar.hidden=true;document.querySelectorAll('[data-suite-menu]').forEach(b=>b.setAttribute('aria-expanded','false'));}
 // Reports cover this app only; links to other apps' reports are not shown.
 function reportLinks(host){if(!host)return;host.replaceChildren();host.hidden=true;}
 function activityItems(){
  if(appId==='taffaha')return [['الرئيسية',()=>window.TaffahaApp.go('home')],['تدريب المقاطع',()=>window.TaffahaApp.go('practice')],['الصورة وعدد المقاطع',()=>window.TaffahaApp.test('count')],['المقاطع والصورة',()=>window.TaffahaApp.test('picture')],['تقرير الطفل',()=>window.TaffahaReports.open()]];
  if(appId==='senb')return [['الرئيسية',()=>navigateTo('home')],['لوحة بناء الجمل',()=>navigateTo('workplace')],['مهام التكرار',()=>openActivitySetup('repetition')],['اختبار الطفل',()=>openActivitySetup('test')],['البطاقة الناقصة',()=>openActivitySetup('game')],['تقرير الطفل',()=>window.SenbSessionReports.openReport()]];
  const local=(page)=>()=>{location.href=new URL(page,base);};
  return [['الرئيسية',()=>typeof app!=='undefined'?app.switchView('home'):local('index.html')()],['بدء العمل',()=>typeof app!=='undefined'?app.switchView('workplace'):local('index.html?workplace=1')()],['المطابقة',local('matching.html')],['الذاكرة',local('memory.html')],['البطاقات السريعة',local('rapid.html')],['استمع واختر',local('test.html')],['تقرير الطفل',()=>window.VocReports.open()]];
 }
 function openMenu(b){
  if(bar&&!bar.hidden){closeBar();return;}closeSettings();pause();trigger=b;
  if(!bar){bar=document.createElement('nav');bar.id='suite-activity-menu';bar.className='suite-activity-menu';bar.setAttribute('aria-label','التنقل داخل التطبيق');bar.hidden=true;document.body.append(bar);}
  bar.replaceChildren(...activityItems().map(([label,action])=>{const item=document.createElement('button');item.type='button';item.textContent=label;item.onclick=()=>{closeBar();action();};return item;}));
  bar.hidden=false;bar.style.top=Math.min(b.closest('header')?.getBoundingClientRect().bottom||b.getBoundingClientRect().bottom,innerHeight-60)+'px';b.setAttribute('aria-expanded','true');bar.querySelector('button').focus();
 }
 function closeSettings(restoreFocus=false){
  if(!settings)return;document.body.style.removeProperty('--voc-settings-space');settings.panel.hidden=true;settings.button.setAttribute('aria-expanded','false');
  if(restoreFocus)settings.button.focus();
 }
 function initSettings(){
  const host=appId==='taffaha'?document.querySelector('.topbar nav'):appId==='senb'?document.querySelector('.header-actions'):document.querySelector('#workplace-view > header');
  if(!host)return;
  const toggle=button('إعدادات مساحة العمل','settings');toggle.dataset.suiteSettings='';toggle.setAttribute('aria-controls','suite-workplace-settings');toggle.setAttribute('aria-expanded','false');toggle.hidden=true;host.append(toggle);
  const panel=document.createElement('div');panel.id='suite-workplace-settings';panel.className='suite-settings-panel';panel.setAttribute('role','group');panel.setAttribute('aria-label','إعدادات مساحة العمل');panel.hidden=true;document.body.append(panel);
  settings={button:toggle,panel,active:false,entries:[]};
  const workplace=appId==='taffaha'?document.body:document.getElementById(appId==='senb'?'workplaceView':'workplace-view');
  const isWorkplace=()=>appId==='taffaha'?['practice','test'].includes(document.body.dataset.screen):!workplace.classList.contains('hidden');
  function sync(){
   const active=isWorkplace();toggle.hidden=!active;if(active===settings.active)return;settings.active=active;closeSettings();
   if(active){
    const nodes=appId==='senb'?[document.getElementById('clearBoardBtn'),document.getElementById('workplaceHeaderToolbar')]:[...host.children].filter(node=>node!==toggle&&!node.matches('[data-suite-menu],[data-session-end],#stars-container'));
    settings.entries=nodes.filter(Boolean).map(node=>{const marker=document.createComment('workplace control');node.before(marker);panel.append(node);return {node,marker};});
    for(const control of panel.querySelectorAll('button[title]'))if(!control.hasAttribute('aria-label'))control.setAttribute('aria-label',control.title);
   }else{for(const {node,marker}of settings.entries){marker.replaceWith(node);}settings.entries=[];}
   orderControls(host);orderControls(panel);
  }
  function position(){panel.style.top=Math.min(host.closest('header').getBoundingClientRect().bottom+8,innerHeight-80)+'px';panel.style.maxHeight=Math.max(100,innerHeight-parseFloat(panel.style.top)-16)+'px';if(appId==='voc'&&!panel.hidden)document.body.style.setProperty('--voc-settings-space',(panel.getBoundingClientRect().height+24)+'px');}
  toggle.onclick=()=>{if(!panel.hidden){closeSettings();return;}closeBar();panel.hidden=false;position();toggle.setAttribute('aria-expanded','true');panel.querySelector('button:not([hidden]):not(:disabled)')?.focus();};
  document.addEventListener('click',event=>{
   if(panel.hidden)return;
   if(!panel.contains(event.target)&&!toggle.contains(event.target))closeSettings();
   else if(panel.contains(event.target)&&event.target.closest('button,a,[role="button"]'))queueMicrotask(closeSettings);
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden&&!document.querySelector('dialog[open],[role="dialog"]:not(.hidden):not([hidden])')){event.preventDefault();closeSettings(true);}});
  new MutationObserver(sync).observe(workplace,{attributes:true,attributeFilter:['class','data-screen']});
  window.addEventListener('resize',()=>{if(!panel.hidden)position();});window.addEventListener('pagehide',()=>closeSettings());sync();
 }
 function init(){
  // The brand is not a link out of the app.
  const brand=document.querySelector('.app-home-brand,.topbar .brand');
  if(brand?.matches('a')){const replacement=document.createElement('div');replacement.className=brand.className;const link=document.createElement('a');link.href=brand.href;const image=brand.querySelector('img');if(image)replacement.append(image);while(brand.firstChild)link.append(brand.firstChild);replacement.append(link);brand.replaceWith(replacement);}
  const hosts=appId==='taffaha'?document.querySelectorAll('.topbar nav'):appId==='senb'?document.querySelectorAll('.header-actions'):document.querySelectorAll('.app-home-tools,#workplace-view > header,.game-header');
  for(const host of hosts){
   const list=button('قائمة الأنشطة','list');list.dataset.suiteMenu='';list.setAttribute('aria-controls','suite-activity-menu');list.setAttribute('aria-expanded','false');list.onclick=()=>openMenu(list);host.append(list);
  }
  initSettings();
  new MutationObserver(changes=>{if(changes.some(change=>change.target.matches?.('dialog[open],.modal-backdrop:not(.hidden),[role="dialog"]:not(.hidden):not([hidden])')))closePanels();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class','hidden']});
  for(const host of hosts){host.classList.add('suite-toolbar');orderControls(host);new MutationObserver(()=>orderControls(host)).observe(host,{childList:true,subtree:true});}
  document.addEventListener('click',e=>{if(bar&&!bar.hidden&&!bar.contains(e.target)&&!e.target.closest('[data-suite-menu]'))closeBar();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&bar&&!bar.hidden){closeBar();trigger?.focus();}else if(bar&&!bar.hidden&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){const buttons=[...bar.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);if(index<0)return;e.preventDefault();buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length].focus();}});
  window.addEventListener('resize',closeBar);window.addEventListener('pagehide',closeBar);
  // Old links may still carry account parameters; drop them quietly.
  const params=new URLSearchParams(location.search);
  if(params.has('reportChild')||params.has('createProfile')){params.delete('reportChild');params.delete('createProfile');history.replaceState(history.state,'',location.pathname+(params.size?'?'+params:'')+location.hash);}
 }
 const closePanels=()=>{closeBar();closeSettings();};
 window.addEventListener('suite-navigation-open',closePanels);
 window.AppNavigation={reportLinks,register(){},closeSettings,closePanels};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
