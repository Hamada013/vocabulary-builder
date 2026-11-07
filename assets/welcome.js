/* Launch animation: this app's own logo and name, then a short greeting. No accounts. */
((root)=>{
 'use strict';
 const RELOAD='speech-app-launch-reload';
 function shouldWelcome({url,base,app,referrer='',navigation='navigate',reload,now=Date.now()}){
  const destination=new URL(url),scope=new URL(base),params=destination.searchParams;
  if(navigation==='back_forward'||/\/report\.html$/.test(destination.pathname)||params.has('plan'))return false;
  const valid=token=>token?.app===app&&token.path===destination.pathname&&token.expires>=now&&token.expires<=now+30000;
  if(navigation==='reload'&&valid(reload))return false;
  // Moving between this app's own pages never replays the launch.
  if(navigation==='navigate'&&referrer){try{const from=new URL(referrer);if(from.origin===scope.origin&&from.pathname.startsWith(scope.pathname))return false;}catch{}}
  return true;
 }
 if(typeof module!=='undefined')module.exports={shouldWelcome};
 if(!root.document)return;
 const script=document.currentScript,app=script.dataset.app,base=new URL('../',script.src);
 const brands={voc:['كلمة','images/logo.webp'],senb:['جملة','assets/icons/logo.webp'],taffaha:['مقطع','assets/icons/logo.webp']};
 if(!brands[app])return;
 let reload;
 try{reload=JSON.parse(sessionStorage.getItem(RELOAD));sessionStorage.removeItem(RELOAD);}catch{}
 const stateKey='speechWelcomeReload';
 try{reload||=history.state?.[stateKey];if(history.state?.[stateKey]){const state={...history.state};delete state[stateKey];history.replaceState(Object.keys(state).length?state:null,'');}}catch{}
 const enabled=shouldWelcome({url:location.href,base:base.href,app,referrer:document.referrer,navigation:performance.getEntriesByType('navigation')[0]?.type,reload});
 let dialog,controller,complete=!enabled;
 function skipNextLoad(){
  const token={app,path:location.pathname,expires:Date.now()+30000};
  try{sessionStorage.setItem(RELOAD,JSON.stringify(token));}catch{}
  // History also survives an automatic reload when session storage is blocked.
  try{history.replaceState({...history.state,[stateKey]:token},'');}catch{}
 }
 function finish(){
  if(complete)return;complete=true;controller?.abort();dialog?.close?.();dialog?.remove();
  document.documentElement.classList.remove('suite-launch-pending');
  root.dispatchEvent(new Event('suite-welcome-done'));
 }
 root.SuiteWelcome={get pending(){return !complete;},connect(){return enabled&&!complete;},skipNextLoad};
 if(!enabled)return;
 document.documentElement.classList.add('suite-launch-pending');
 const wait=(ms,signal)=>new Promise((resolve,reject)=>{
  const abort=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
  const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
  if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});
 });
 async function play(){
  controller?.abort();controller=new AbortController();const {signal}=controller,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{
   dialog.dataset.phase='loading';const greeting=dialog.querySelector('[data-welcome-word]');greeting.textContent='';
   const stylesheet=[...document.querySelectorAll('link[rel=stylesheet]')].find(link=>link.href===new URL('welcome.css',script.src).href);
   const styled=!stylesheet||stylesheet.sheet?Promise.resolve():new Promise(resolve=>{stylesheet.addEventListener('load',resolve,{once:true});stylesheet.addEventListener('error',resolve,{once:true});});
   const image=dialog.querySelector('img');
   await Promise.race([Promise.all([styled,image.decode?.().catch(()=>{})]),wait(2500,signal)]);
   if(signal.aborted)return;dialog.dataset.phase='logo';
   await wait(reduced?150:1100,signal);dialog.dataset.phase='greeting';
   if(reduced)greeting.textContent='مرحبا';
   else for(const letter of 'مرحبا'){greeting.textContent+=letter;await wait(105,signal);}
   dialog.querySelector('[data-welcome-status]').textContent='مرحبا';await wait(reduced?250:600,signal);
   finish();
  }catch(error){if(error.name!=='AbortError')finish();}
 }
 function init(){
  if(complete)return;
  dialog=document.createElement('dialog');dialog.id='suite-welcome';dialog.dir='rtl';dialog.setAttribute('aria-labelledby','suite-welcome-heading');dialog.dataset.app=app;
  dialog.innerHTML='<div class="suite-welcome-panel"><div class="suite-welcome-art" aria-hidden="true"><span class="suite-welcome-orbit"></span><span class="suite-welcome-spark"></span><img width="176" height="176" alt=""></div><p class="suite-welcome-brand"></p><h1 id="suite-welcome-heading" aria-label="مرحبا"><span data-welcome-word aria-hidden="true"></span></h1><p class="suite-welcome-status" data-welcome-status role="status" aria-live="polite"></p></div>';
  const logo=dialog.querySelector('img');logo.style.objectFit='contain';logo.src=new URL(brands[app][1],base).href;logo.onerror=()=>{logo.hidden=true;};
  dialog.querySelector('.suite-welcome-brand').textContent=brands[app][0];
  dialog.addEventListener('cancel',event=>event.preventDefault());
  document.body.append(dialog);if(typeof dialog.showModal!=='function'){finish();return;}dialog.showModal();void play();
 }
 root.addEventListener('pagehide',()=>controller?.abort());
 root.addEventListener('pageshow',event=>{if(event.persisted&&!complete&&dialog?.open)void play();});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(globalThis);
