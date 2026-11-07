// Therapist mode, intervention plan and PDF progress report, at phone or iPad size.
// Run: node tests/intervention-browser.cjs [WIDTHxHEIGHT]   (ENGINE=webkit for Safari's engine)
const {chromium,webkit}=require(process.env.APP_PLAYWRIGHT||'playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=require('path').resolve(__dirname,'..'),APP=JSON.parse(require('fs').readFileSync(require('path').join(__dirname,'app.json'),'utf8')),out=require('os').tmpdir(),[W,H]=(process.argv[2]||'390x844').split('x').map(Number),tag=`voc-plan-${W}x${H}`;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.m4a':'audio/mp4'};
const server=http.createServer(async(q,s)=>{try{let p=decodeURIComponent(new URL(q.url,'http://x').pathname).replace(`/${APP.repository}/`,'');if(!p||p.endsWith('/'))p+='index.html';const b=await fs.promises.readFile(path.join(root,p));s.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});s.end(b);}catch{s.writeHead(404).end();}});
server.listen(0,async()=>{const base=`http://127.0.0.1:${server.address().port}/${APP.repository}/`;const b=await (process.env.ENGINE==='webkit'?webkit:chromium).launch();
 const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:true,reducedMotion:'reduce',acceptDownloads:true});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 try{
  await page.goto(base);await page.waitForFunction(()=>!window.SuiteWelcome?.pending);
  assert.equal(await page.locator('[data-open-plan]').isVisible(),false,'Plan hidden before therapist mode');
  await page.locator('[data-therapist]').click();await page.locator('.voc-therapist[open] input').fill('111');await page.locator('.voc-therapist[open] button[type=submit]').click();
  assert.match(await page.locator('#voc-therapist-error').textContent(),/غير صحيحة/);
  
  await page.locator('.voc-therapist[open] input').fill('٠١٣');await page.locator('.voc-therapist[open] button[type=submit]').click();
  await page.locator('[data-open-plan]').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-therapist]').getAttribute('aria-pressed'),'true');
  await page.waitForTimeout(500);
  await page.locator('[data-open-plan]').click();await page.locator('.voc-plan[open]').waitFor();
  
  // Five goals across the bank: two from the first long-term goal, then one from each of the next three.
  const ids=await page.evaluate(()=>{const g=InterventionGoals.GOALS;return [g[0].short[0].id,g[0].short[1].id,g[1].short.at(-1).id,g[2].short.at(-1).id,g[3].short[0].id];});
  const [A,B,C,D,E]=ids;
  for(const id of ids) await page.locator(`[data-toggle="${id}"]`).click();
  assert.equal(await page.locator(`[data-toggle="${A}"]`).getAttribute('aria-pressed'),'true');
  await page.locator('#voc-tab-plan').click();
  await page.locator('[data-field=childName]').fill('ليان');await page.locator('[data-field=childName]').press('Tab');
  await page.locator('[data-field=therapist]').fill('أحمد غانم');await page.locator('[data-field=therapist]').press('Tab');
  for(const [id,l] of [[A,40],[A,80],[B,60],[C,20],[E,80]]) await page.locator(`[data-rate="${id}"][data-level="${l}"]`).click();
  
  await page.locator('.voc-plan-body').evaluate(el=>el.scrollTo(0,99999));
  const saved=await page.evaluate(key=>{const data=JSON.parse(localStorage.getItem(key));return InterventionGoals.APP.progress().intervention();},APP.storageKey);
  assert.equal(saved.childName,'ليان');assert.equal(saved.goals.length,5);assert.equal(saved.goals.find(g=>g.id===A).history.length,2);assert.ok(saved.goals.find(g=>g.id===A).achieved);
  assert.ok(await page.evaluate(key=>JSON.stringify(JSON.parse(localStorage.getItem(key))).includes('ليان'),APP.storageKey),'Plan is saved in this app\'s own store');
  const levels=await page.evaluate(()=>InterventionGoals.APP.unlocksLevels);
  // levels unlocked in therapist mode
  if(levels)assert.equal(await page.evaluate(()=>VocProgress.wordLevelUnlocked({id:'x',previousId:'y',keys:['1_1','1_2']})),true,'Therapist mode unlocks levels');
  // PDF pages
  await page.evaluate(()=>{const o=HTMLCanvasElement.prototype.toDataURL;window.__pages=[];HTMLCanvasElement.prototype.toDataURL=function(...a){const d=o.apply(this,a);if(this.width===1240)window.__pages.push(o.call(this,'image/png'));return d;};});
  const dl=page.waitForEvent('download');await page.locator('[data-plan-pdf]').click();const file=await dl;assert.match(file.suggestedFilename(),/^خطة-التدخل-ليان-.+\.pdf$/);
  const pages=await page.evaluate(()=>window.__pages);assert.equal(pages.length,3,'In-progress page, achieved page, references');
  // reload keeps plan; exit therapist mode hides plan and relocks
  await page.reload();await page.waitForFunction(()=>!window.SuiteWelcome?.pending);
  assert.equal(await page.locator('[data-open-plan]').isVisible(),true,'Therapist mode lasts in this tab');
  await page.locator('[data-therapist]').click();await page.locator('.voc-therapist[open] [data-end]').click();
  assert.equal(await page.locator('[data-open-plan]').isVisible(),false);
  if(levels)assert.equal(await page.evaluate(()=>VocProgress.wordLevelUnlocked({id:'x',previousId:'y',keys:['1_1','1_2']})),false,'Levels lock again');
  assert.deepEqual(errs,[]);console.log(`PASS intervention ${W}x${H}: password gate, hidden plan button, goal bank, 20–80% ratings, saved plan, ${levels?'unlocked levels, ':''}3-page PDF (${APP.name}).`);
 }catch(e){process.exitCode=1;console.error('FAIL',e.message);await page.screenshot({path:`${out}/${tag}-fail.png`});}finally{await b.close();server.close();}});
