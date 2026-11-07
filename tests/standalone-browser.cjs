// Standalone app checks: own launch logo, first child's name at launch, this app's own accounts,
// no links out of the app, and an offline download served from this app's own worker.
// Run: node tests/standalone-browser.cjs   (APP_ENGINE=webkit for Safari's engine)
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.APP_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
const APP=JSON.parse(fs.readFileSync(path.join(__dirname,'app.json'),'utf8'));
// GitHub Pages serves the repository under /<repository>/.
const prefix=`/${APP.repository}/`;
const context={self:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/pwa-release.js'),'utf8'),context);
const release=JSON.parse(JSON.stringify(context.self.APP_RELEASE));
release.media=['.webp','.m4a'].flatMap(ext=>release.media.filter(a=>a.url.endsWith(ext)).slice(0,3));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.m4a':'audio/mp4','.txt':'text/plain'};
let port,serving=true;
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!serving)return res.writeHead(503).end();
  if(!pathname.startsWith(prefix))return res.writeHead(404).end();
  let file=pathname.slice(prefix.length)||'index.html';if(file.endsWith('/'))file+='index.html';
  if(file.split('/').includes('..'))return res.writeHead(403).end();
  const body=file==='assets/pwa-release.js'?Buffer.from('self.APP_RELEASE='+JSON.stringify(release)+';'):await fs.promises.readFile(path.join(root,file));
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));port=server.address().port;
 const base=`http://127.0.0.1:${port}${prefix}`,engine=process.env.APP_ENGINE==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 // Headless Chromium accepts Background Fetch but never runs it; test the worker's own queue.
 // APP_NATIVE_FETCH=1 with a real Chrome keeps the browser download path.
 if(!process.env.APP_NATIVE_FETCH)await ctx.addInitScript(()=>{try{delete ServiceWorkerRegistration.prototype.backgroundFetch;}catch{}});
 const page=await ctx.newPage();page.setDefaultTimeout(45000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  assert.equal(manifest.name,APP.name);assert.equal(manifest.scope,'./');
  await page.goto(base,{waitUntil:'domcontentloaded'});
  // Launch animation: this app's logo and name, no name form.
  const welcome=page.locator('#suite-welcome');await welcome.waitFor({state:'attached'});
  assert.equal(new URL(await welcome.locator('img').getAttribute('src')).pathname,prefix+APP.logo,'Launch shows the app\'s own logo');
  assert.equal((await welcome.locator('.suite-welcome-brand').textContent()).trim(),APP.name);
  // The first launch asks for the child's name and creates this app's first account.
  await welcome.locator('form:not([hidden]) input').waitFor({timeout:15000});
  await welcome.locator('input').fill('ليان');await welcome.locator('button[type=submit]').click();
  await page.waitForFunction(()=>window.SuiteWelcome&&!window.SuiteWelcome.pending,null,{timeout:15000});
  assert.equal(await page.locator('#suite-welcome').count(),0);
  // Accounts are stored only under this app's key.
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),APP.storageKey);
  assert.equal(saved.children.find(child=>child.id===saved.active)?.name,'ليان','The named child is the active account');
  assert.equal(await page.evaluate(()=>localStorage.getItem('voc-children-v1')),null,'No shared suite storage');
  // An accounts button, but no app switching and no links out of the app.
  await page.waitForTimeout(300);
  assert.ok(await page.locator('[data-child-profile],[data-senb-child-profile],#open-profile').first().isVisible(),'Accounts button on the home screen');
  for(const selector of ['[data-suite-apps]','[data-suite-control=suiteHome]','#suite-app-picker','.vss-account'])
   assert.equal(await page.locator(selector).count(),0,`Removed: ${selector}`);
  const links=await page.evaluate(()=>[...document.querySelectorAll('a[href]')].map(a=>a.href).filter(href=>!href.startsWith('mailto:')));
  for(const href of links)assert.ok(href.startsWith(base),`Link stays inside the app: ${href}`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Home fits the phone width');
  const alerts=(await page.locator('[role=alert]:visible').allTextContents()).map(text=>text.trim()).filter(Boolean);
  assert.deepEqual(alerts,[],'No error message on the home screen');
  // Offline: this app's worker installs at its own scope and saves the chosen media.
  const registration=await page.evaluate(async()=>{await window.AppUpdates.ready();const r=await navigator.serviceWorker.getRegistration();return {scope:r.scope,script:r.active.scriptURL};});
  assert.equal(registration.scope,base);assert.equal(registration.script,base+'sw.js');
  // The home header's download icon opens the dialog; the download reaches 100%.
  await page.locator('[data-open-download]').click();
  await page.locator('#offline-dialog[open]').waitFor();
  await page.locator('[data-offline-download]').click();
  await page.locator('[data-offline-card][data-state=ready]').waitFor({state:'attached',timeout:60000});
  assert.equal((await page.locator('[data-offline-status]').textContent()).trim(),'100%');
  const cacheNames=await page.evaluate(()=>caches.keys());
  assert.ok(cacheNames.length&&cacheNames.every(name=>name.startsWith(APP.repository+':')),`Caches belong to this app only: ${cacheNames}`);
  serving=false;
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.title(),APP.title,'The app opens offline');
  const media=await page.evaluate(async url=>(await fetch(url)).status,base+release.media[0].url);
  assert.equal(media,200,'Downloaded media plays offline');
  serving=true;
  assert.deepEqual(errors,[]);
  console.log(`PASS ${APP.repository}: own launch logo, first child's name, own accounts, no links out, scoped worker and offline media (${engine.name()}).`);
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
