import { spawn, spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(process.argv[2] ?? 'release-dist');
const evidenceRoot = path.resolve(process.argv[3] ?? path.join(os.tmpdir(), 'bd-browser-evidence'));
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = new Map([['.html','text/html; charset=utf-8'],['.css','text/css'],['.js','text/javascript'],['.json','application/json'],['.xml','application/xml'],['.svg','image/svg+xml'],['.png','image/png'],['.webp','image/webp'],['.avif','image/avif'],['.mp3','audio/mpeg'],['.woff2','font/woff2']]);
const serverErrors = [];
const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const target = path.resolve(siteRoot, relative);
  if (!target.startsWith(siteRoot + path.sep) || !existsSync(target)) { serverErrors.push(url.pathname); response.writeHead(404).end('Not found'); return; }
  const stat = statSync(target);
  const headers = { 'Accept-Ranges':'bytes', 'Content-Type':mime.get(path.extname(target).toLowerCase()) ?? 'application/octet-stream' };
  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.range ?? '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    if (start > end || start >= stat.size) { response.writeHead(416, { 'Content-Range':`bytes */${stat.size}` }).end(); return; }
    response.writeHead(206, { ...headers, 'Content-Range':`bytes ${start}-${end}/${stat.size}`, 'Content-Length':end-start+1 });
    createReadStream(target, { start, end }).pipe(response); return;
  }
  response.writeHead(200, { ...headers, 'Content-Length':stat.size });
  createReadStream(target).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const chromeCandidates = process.platform === 'win32'
  ? [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
  : [process.env.CHROME_PATH, 'google-chrome-stable', 'google-chrome', 'chromium'];
let chrome = null;
for (const candidate of chromeCandidates.filter(Boolean)) {
  if (path.isAbsolute(candidate) ? existsSync(candidate) : spawnSync('sh', ['-lc', `command -v ${candidate}`]).status === 0) { chrome = candidate; break; }
}
if (!chrome) throw new Error('No supported Chrome/Chromium executable found');
const profile = mkdtempSync(path.join(os.tmpdir(), 'bd-chrome-'));
const chromeProcess = spawn(chrome, ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'], { stdio:['ignore','pipe','pipe'] });
const activePort = path.join(profile, 'DevToolsActivePort');
for (let attempt=0; attempt<200 && !existsSync(activePort); attempt+=1) await new Promise(resolve => setTimeout(resolve, 50));
if (!existsSync(activePort)) throw new Error('Chrome DevTools port did not become ready');
const [debugPort, browserPath] = readFileSync(activePort, 'utf8').trim().split(/\r?\n/);
const socket = new WebSocket(`ws://127.0.0.1:${debugPort}${browserPath}`);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once:true }); socket.addEventListener('error', reject, { once:true }); });
let nextId = 0;
const pending = new Map();
const events = [];
socket.addEventListener('message', message => {
  const data = JSON.parse(message.data);
  if (data.id) { const item = pending.get(data.id); if (item) { pending.delete(data.id); data.error ? item.reject(new Error(JSON.stringify(data.error))) : item.resolve(data.result); } }
  else events.push(data);
});
function send(method, params={}, sessionId) { return new Promise((resolve,reject) => { const id=++nextId; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})); }); }
async function evaluate(sessionId, expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise:true, returnByValue:true }, sessionId);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Browser evaluation failed');
  return result.result.value;
}
async function page(route, width, height) {
  const { targetId } = await send('Target.createTarget', { url:'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten:true });
  await send('Page.enable', {}, sessionId); await send('Runtime.enable', {}, sessionId); await send('Log.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile:width<700 }, sessionId);
  const navigation = await send('Page.navigate', { url:base+route }, sessionId);
  if (navigation.errorText) throw new Error(`${route}: ${navigation.errorText}`);
  for (let attempt=0; attempt<200; attempt+=1) { if (await evaluate(sessionId, `document.readyState === 'complete' && (!document.fonts || document.fonts.status === 'loaded')`)) break; await new Promise(resolve => setTimeout(resolve, 50)); }
  await new Promise(resolve => setTimeout(resolve, 150));
  return { targetId, sessionId };
}
async function closePage(item) { await send('Target.closeTarget', { targetId:item.targetId }); }
async function screenshot(item, name) { const data=(await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},item.sessionId)).data; writeFileSync(path.join(evidenceRoot, `${name}.png`), Buffer.from(data,'base64')); }

mkdirSync(evidenceRoot, { recursive:true });
const scenarios = [
  ['home-desktop','/',1440,1000],['home-mobile','/',390,844],['a1-vocabulary-desktop','/vocabulary/',1440,1000],['a1-vocabulary-mobile','/vocabulary/',390,844],
  ['a1-grammar','/grammar/',1280,900],['a1-listening','/listening/',390,844],['a1-podcast','/podcasts/',1280,900],['a2-overview','/a2/',1440,1000],
  ['a2-overview-mobile','/a2/',390,844],['a2-unit-1','/a2/unit-1/',1280,900],['a2-unit-10','/a2/unit-10/',1280,900],['a2-grammar','/a2/unit-2/grammar/g01/',1280,900],
  ['a2-listening','/a2/unit-2/listening/l01/',1280,900],['a2-podcast','/a2/unit-2/podcast/a2-p02/',390,844]
];
const captures=[];
for (const [name,route,width,height] of scenarios) {
  const item=await page(route,width,height);
  const metrics=await evaluate(item.sessionId, `({title:document.title,width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,logo:[...document.images].find(i=>i.src.includes('be_deutsch_ring_mark'))?.getBoundingClientRect().toJSON()??null})`);
  await screenshot(item,name); captures.push({name,route,...metrics,overflow:metrics.width>metrics.viewport+1}); await closePage(item);
}

const home=await page('/',390,844);
const mobile=await evaluate(home.sessionId, `(()=>{const menu=document.querySelector('.d3-mobile-nav');menu.querySelector('summary').click();const first=menu.querySelector('a');first.focus();const s=getComputedStyle(first),root=getComputedStyle(document.documentElement);return {open:menu.open,links:[...menu.querySelectorAll('a')].filter(a=>a.getClientRects().length).length,focus:{style:s.outlineStyle,width:s.outlineWidth,color:s.outlineColor},tokens:{emerald:root.getPropertyValue('--bd-emerald').trim(),orange:root.getPropertyValue('--bd-orange').trim(),orangeControl:root.getPropertyValue('--bd-orange-control').trim()},languages:document.querySelectorAll('.d3-mobile-languages').length,primaryTargets:[...document.querySelectorAll('.d3-button,.d3-mobile-nav summary')].map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height}})}})()`);
await screenshot(home,'mobile-menu-open'); await closePage(home);
const vocabulary=await page('/vocabulary/',1440,900);
const vocab=await evaluate(vocabulary.sessionId, `(()=>{const action=document.querySelector('#continue-learning'),hero=document.querySelector('.course-hero'),progress=document.querySelector('.course-summary'),s=getComputedStyle(action),a=hero.getBoundingClientRect(),b=progress.getBoundingClientRect();const parse=v=>(v.match(/[\\d.]+/g)||[]).slice(0,3).map(Number),chan=v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4,lum=v=>{const [r,g,b]=parse(v).map(chan);return .2126*r+.7152*g+.0722*b},ratio=(Math.max(lum(s.color),lum(s.backgroundColor))+.05)/(Math.min(lum(s.color),lum(s.backgroundColor))+.05);return {action:{text:action.textContent.trim(),background:s.backgroundColor,color:s.color,height:action.getBoundingClientRect().height,contrast:ratio},heroProgressOverlap:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))}})()`);
await closePage(vocabulary);
const listening=await page('/a2/unit-2/listening/l01/',1280,900);
const media=await evaluate(listening.sessionId, `(async()=>{const audio=document.querySelector('audio[controls]');if(audio.readyState<1)await Promise.race([new Promise(r=>audio.addEventListener('loadedmetadata',r,{once:true})),new Promise((_,j)=>setTimeout(()=>j(new Error('metadata timeout')),10000))]);audio.currentTime=Math.min(1,audio.duration/2);await new Promise(r=>setTimeout(r,200));document.querySelector('[data-support-language="fa"]').click();const values=document.querySelector('[data-support-values]');return {audio:{duration:audio.duration,currentTime:audio.currentTime,seekable:audio.seekable.length,controls:audio.controls},rtl:{direction:document.querySelector('[data-support-direction]').dataset.supportDirection,selected:document.querySelector('[data-support-language="fa"]').getAttribute('aria-pressed'),computed:getComputedStyle(values).direction},languageButtons:new Set([...document.querySelectorAll('[data-support-language]')].map(element=>element.dataset.supportLanguage)).size}})()`);
await screenshot(listening,'persian-rtl'); await closePage(listening);
const arabic=await page('/a2/unit-2/listening/l01/',1280,900); await evaluate(arabic.sessionId, `document.querySelector('[data-support-language="ar"]').click()`); await screenshot(arabic,'arabic-rtl'); const arabicDirection=await evaluate(arabic.sessionId, `document.querySelector('[data-support-direction]').dataset.supportDirection`); await closePage(arabic);
const overviewPage=await page('/a2/',1440,900); const overview=await evaluate(overviewPage.sessionId, `({units:new Set([...document.querySelectorAll('a[href^="/a2/unit-"]')].map(node=>node.getAttribute('href')).filter(value=>/^\\/a2\\/unit-\\d+\\/$/.test(value))).size,stats:[...document.querySelectorAll('.d3-a2-stats strong')].map(node=>node.textContent.trim())})`); await closePage(overviewPage);
const unitPage=await page('/a2/unit-10/',1280,900); const unit10=await evaluate(unitPage.sessionId, `({categories:['vocabulary','grammar','listening','podcast'].map(category=>Boolean(document.querySelector('main a[href*="/'+category+'/"]'))),selectors:new Set([...document.querySelectorAll('select[data-bd-course-switch] option')].map(node=>node.value).filter(value=>/^\\/a2\\/unit-\\d+\\/$/.test(value))).size})`); await closePage(unitPage);
const grammarPage=await page('/a2/unit-10/grammar/g01/',1280,900); const grammar=await evaluate(grammarPage.sessionId, `(()=>{const before={exercises:document.querySelectorAll('[data-draft-exercise]').length,previous:document.querySelector('.lesson-nav-gradient .previous')?.getAttribute('href'),next:document.querySelector('.lesson-nav-gradient .next')?.getAttribute('href')};const answer=document.querySelector('#A2-U10-G01-E01 input[value="komme"]');answer.checked=true;answer.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#A2-U10-G01-E01 [data-check-exercise]').click();return {...before,feedback:document.querySelector('#A2-U10-G01-E01 [data-exercise-feedback]').dataset.state}})()`); await closePage(grammarPage);
const podcastPage=await page('/a2/unit-2/podcast/a2-p02/',1280,900); const podcast=await evaluate(podcastPage.sessionId, `(async()=>{await Promise.all([...document.querySelectorAll('audio')].map(audio=>new Promise(resolve=>{if(audio.readyState>=1)return resolve();const done=()=>resolve();audio.addEventListener('loadedmetadata',done,{once:true});audio.addEventListener('error',done,{once:true});audio.load();setTimeout(done,5000)})));return {audio:[...document.querySelectorAll('audio')].map(node=>({duration:node.duration,readyState:node.readyState,controls:node.controls,src:node.currentSrc})),questions:document.querySelectorAll('[id*="-Q0"]').length,chapters:document.querySelectorAll('[data-chapter-select]').length}})()`); await closePage(podcastPage);
const a1Page=await page('/grammar/lesson-01/',1280,900); const a1=await evaluate(a1Page.sessionId, `({title:document.querySelector('h1')?.textContent.trim(),interactive:document.querySelectorAll('button,input,select,textarea').length,a2Links:document.querySelectorAll('a[href="/a2/"]').length})`); await closePage(a1Page);

const runtimeFailures=events.filter(event => event.method==='Runtime.exceptionThrown' || (event.method==='Log.entryAdded' && event.params?.entry?.level==='error'));
const result={
  status:'PASS',runner:process.platform,chrome,captures,serverErrors,runtimeFailures:runtimeFailures.map(item=>item.method),mobile,vocabulary:vocab,media,arabicDirection,functional:{overview,unit10,grammar,podcast,a1},
};
const logoSource=readFileSync(path.join(repositoryRoot,'07_Website/src/assets/branding/be_deutsch_ring_mark.svg'),'utf8');
result.logo={whiteCenter:/fill="#FFFFFF"/.test(logoSource),orangeRing:/stroke="#FF7A00"/.test(logoSource),black:/fill="#000000"/.test(logoSource),red:/fill="#DD0000"/.test(logoSource),yellow:/fill="#FFCC00"/.test(logoSource)};
const failures=[];
if(captures.length!==14||captures.some(c=>c.overflow)||serverErrors.length||runtimeFailures.length)failures.push('rendering');
if(!mobile.open||mobile.links<8||mobile.focus.style==='none'||mobile.tokens.emerald.toLowerCase()!=='#0d6b3b'||mobile.tokens.orange.toLowerCase()!=='#ff7a00'||mobile.tokens.orangeControl.toLowerCase()!=='#c94d00'||mobile.primaryTargets.some(t=>t.w<44||t.h<44))failures.push('navigation-design-accessibility');
if(vocab.action.color!=='rgb(255, 255, 255)'||vocab.action.background!=='rgb(201, 77, 0)'||vocab.action.contrast<4.5||vocab.action.height<48||vocab.heroProgressOverlap!==0)failures.push('vocabulary-design');
if(!media.audio.controls||media.audio.duration<=0||media.audio.currentTime<=0||media.audio.seekable<1||media.rtl.direction!=='rtl'||media.rtl.selected!=='true'||media.rtl.computed!=='rtl'||media.languageButtons!==5||arabicDirection!=='rtl')failures.push('media-languages-rtl');
if(overview.units!==10||JSON.stringify(overview.stats)!==JSON.stringify(['300','40','384','24','5'])||!unit10.categories.every(Boolean)||unit10.selectors!==10||grammar.exercises!==4||!grammar.previous||!grammar.next||grammar.feedback!=='correct'||podcast.audio.length!==7||!podcast.audio.every(item=>item.duration>0&&item.readyState>=1&&item.controls&&item.src.endsWith('.mp3'))||podcast.questions!==6||podcast.chapters!==6||!a1.title||a1.interactive<1||a1.a2Links<1)failures.push('learner-journeys-scoring');
if(Object.values(result.logo).some(value=>!value))failures.push('logo');
result.failures=failures; result.status=failures.length?'FAIL':'PASS';
writeFileSync(path.join(evidenceRoot,'BROWSER_ACCESSIBILITY_RESULTS.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
socket.close(); chromeProcess.kill(); await Promise.race([new Promise(resolve=>chromeProcess.once('exit',resolve)),new Promise(resolve=>setTimeout(resolve,3000))]); await new Promise(resolve=>server.close(resolve));
for(let attempt=0;attempt<5;attempt+=1){try{rmSync(profile,{recursive:true,force:true});break}catch{await new Promise(resolve=>setTimeout(resolve,250));}}
if(failures.length) process.exitCode=1;
