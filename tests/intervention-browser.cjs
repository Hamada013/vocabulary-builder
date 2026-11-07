// Therapist mode, intervention plan and PDF progress report, at phone or iPad size.
// Run: node tests/intervention-browser.cjs [WIDTHxHEIGHT]   (ENGINE=webkit for Safari's engine)
const {chromium,webkit}=require(process.env.APP_PLAYWRIGHT||'playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=require('path').resolve(__dirname,'..'),out=require('os').tmpdir(),[W,H]=(process.argv[2]||'390x844').split('x').map(Number),tag=`voc-plan-${W}x${H}`;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.m4a':'audio/mp4'};
const server=http.createServer(async(q,s)=>{try{let p=decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/^\/vocabulary-builder\//,'');if(!p||p.endsWith('/'))p+='index.html';const b=await fs.promises.readFile(path.join(root,p));s.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});s.end(b);}catch{s.writeHead(404).end();}});
server.listen(0,async()=>{const base=`http://127.0.0.1:${server.address().port}/vocabulary-builder/`;const b=await (process.env.ENGINE==='webkit'?webkit:chromium).launch();
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
  
  for(const id of ['S1.1','S1.2','S2.3','S3.5','S4.1']) await page.locator(`[data-toggle="${id}"]`).click();
  assert.equal(await page.locator('[data-toggle="S1.1"]').getAttribute('aria-pressed'),'true');
  await page.locator('#voc-tab-plan').click();
  await page.locator('[data-field=childName]').fill('ليان');await page.locator('[data-field=childName]').press('Tab');
  await page.locator('[data-field=therapist]').fill('أحمد غانم');await page.locator('[data-field=therapist]').press('Tab');
  for(const [id,l] of [['S1.1',40],['S1.1',80],['S1.2',60],['S2.3',20],['S4.1',80]]) await page.locator(`[data-rate="${id}"][data-level="${l}"]`).click();
  
  await page.locator('.voc-plan-body').evaluate(el=>el.scrollTo(0,99999));
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('vocabulary-builder-v1')).children.find(c=>c.intervention).intervention);
  assert.equal(saved.childName,'ليان');assert.equal(saved.goals.length,5);assert.equal(saved.goals.find(g=>g.id==='S1.1').history.length,2);assert.ok(saved.goals.find(g=>g.id==='S1.1').achieved);
  // levels unlocked in therapist mode
  const unlock=await page.evaluate(()=>VocProgress.wordLevelUnlocked({id:'x',previousId:'y',keys:['1_1','1_2']}));
  assert.equal(unlock,true,'Therapist mode unlocks levels');
  // PDF pages
  await page.evaluate(()=>{const o=HTMLCanvasElement.prototype.toDataURL;window.__pages=[];HTMLCanvasElement.prototype.toDataURL=function(...a){const d=o.apply(this,a);if(this.width===1240)window.__pages.push(o.call(this,'image/png'));return d;};});
  const dl=page.waitForEvent('download');await page.locator('[data-plan-pdf]').click();const file=await dl;assert.match(file.suggestedFilename(),/^خطة-التدخل-ليان-.+\.pdf$/);
  const pages=await page.evaluate(()=>window.__pages);assert.equal(pages.length,3,'In-progress page, achieved page, references');
  // reload keeps plan; exit therapist mode hides plan and relocks
  await page.reload();await page.waitForFunction(()=>!window.SuiteWelcome?.pending);
  assert.equal(await page.locator('[data-open-plan]').isVisible(),true,'Therapist mode lasts in this tab');
  await page.locator('[data-therapist]').click();await page.locator('.voc-therapist[open] [data-end]').click();
  assert.equal(await page.locator('[data-open-plan]').isVisible(),false);
  assert.equal(await page.evaluate(()=>VocProgress.wordLevelUnlocked({id:'x',previousId:'y',keys:['1_1','1_2']})),false,'Levels lock again');
  assert.deepEqual(errs,[]);console.log(`PASS intervention ${W}x${H}: password gate, hidden plan button, goal bank, 20–80% ratings, saved plan, unlocked levels, 3-page PDF.`);
 }catch(e){process.exitCode=1;console.error('FAIL',e.message);await page.screenshot({path:`${out}/${tag}-fail.png`});}finally{await b.close();server.close();}});
