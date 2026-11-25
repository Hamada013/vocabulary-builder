/* Identical feedback and count-up in every speech app. */
(() => {
 // Safari may retain :focus-visible when a pointer opens a dialog and script
 // moves focus. Track the input method without blurring controls or text fields.
 document.documentElement.dataset.suiteInput = 'pointer';
 const setInput = value => { document.documentElement.dataset.suiteInput = value; };
 document.addEventListener('pointerdown', () => setInput('pointer'), { capture: true, passive: true });
 document.addEventListener('keydown', event => {
  if (event.key === 'Tab' || (!event.altKey && !event.ctrlKey && !event.metaKey)) setInput('keyboard');
 }, true);
 const symbols={yes:'<path d="m5 12 4 4L19 6"/>',no:'<path d="m6 6 12 12M18 6 6 18"/>'};
 const svg=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
 let counting=null,feedback=null;
 function show(kind,correct,existing){
  (kind==='count'?counting:feedback)?.cancel();
  const dialog=existing||document.createElement('dialog');dialog.classList.add(kind==='count'?'suite-countdown':'suite-feedback');
  if(kind==='count')dialog.classList.add('voc-countdown');
  dialog.setAttribute('aria-label',kind==='count'?'استعد':correct?'أحسنت!':'حاول مرة أخرى');
  if(kind!=='count')dialog.dataset.result=correct?'correct':'wrong';
  dialog.replaceChildren();const mark=document.createElement('span');mark.className=kind==='count'?'suite-count voc-count-number session-count':'suite-answer';mark.setAttribute('role','status');mark.setAttribute('aria-live','assertive');dialog.append(mark);
  if(kind!=='count'){mark.innerHTML=svg(symbols[correct?'yes':'no']);mark.dataset.correct=correct;const label=document.createElement('p');label.textContent=correct?'أحسنت!':'حاول مرة أخرى';dialog.append(label);}
  if(!dialog.isConnected)document.body.append(dialog);
  let resolve,timer,done=false,count=0;const promise=new Promise(r=>resolve=r);
  const finish=success=>{if(done)return;done=true;clearTimeout(timer);dialog.removeEventListener('cancel',escape);dialog.removeEventListener('close',closed);if(dialog.open)dialog.close();if(!existing)dialog.remove();if(kind==='count')counting=null;else feedback=null;resolve(success);};
  const escape=e=>{e.preventDefault();finish(false);},closed=()=>finish(false);dialog.addEventListener('cancel',escape);dialog.addEventListener('close',closed);
  const handle={cancel:()=>finish(false),dialog};if(kind==='count')counting=handle;else feedback=handle;
  dialog.showModal();
  if(kind==='count'){const tick=()=>{if(++count>3)return finish(true);mark.textContent=String(count);mark.dataset.count=count;mark.style.animation='none';void mark.offsetWidth;mark.style.animation='';timer=setTimeout(tick,800);};tick();}
  else timer=setTimeout(()=>finish(true),800);
  return promise;
 }
 const cancel=()=>{counting?.cancel();feedback?.cancel();};
 window.FlowUI={countdown:()=>show('count'),feedback:(correct,dialog)=>show('feedback',correct,dialog),cancel,cancelCount:()=>counting?.cancel(),cancelFeedback:()=>feedback?.cancel(),counting:()=>!!counting};
 for(const event of ['pagehide','suite-navigation-open','voc-profile-open','senb-profile-open','taffaha-profile-open','voc-profile-beforechange','senb-profile-beforechange','taffaha-profile-beforechange'])window.addEventListener(event,cancel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
 // 2026-11: a soft chime made in the browser right before the spoken praise or «try again» (same notes as the sound
 // apps): a rising two-note bell for a right answer, one low short note for try again. No sound files, never loud.
 let audio=null;
 const note=(ctx,frequency,start,length,volume,type='sine')=>{const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+start;osc.type=type;osc.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+length);osc.connect(gain).connect(ctx.destination);osc.start(t);osc.stop(t+length+.02);};
 const chime=correct=>{try{audio||=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')void audio.resume();if(correct){note(audio,1046.5,0,.32,.09);note(audio,1318.5,.09,.42,.08);}else note(audio,392,0,.22,.05,'triangle');}catch{}};
 const wrap=()=>{const P=window.VocPrompts;if(!P||P.chimed)return;const praise=P.praise,retry=P.retry;P.praise=(...args)=>{chime(true);return praise(...args);};P.retry=(...args)=>{chime(false);return retry(...args);};P.chimed=true;};
 wrap();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wrap,{once:true});window.addEventListener('load',wrap,{once:true});
})();
