import { writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1]]);
  return pairs;
}, []));
const browserEndpoint = args.browser ?? 'http://127.0.0.1:9222';
const siteEndpoint = args.site ?? 'http://127.0.0.1:4173';
const output = args.output;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const target = await fetch(`${browserEndpoint}/json/new?about:blank`, { method: 'PUT' }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let messageId = 0;
const pending = new Map();
const browserErrors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.text);
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') browserErrors.push(message.params.entry.text);
  if (!message.id || !pending.has(message.id)) return;
  const task = pending.get(message.id); pending.delete(message.id);
  message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
});
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++messageId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const response = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  }
  return response.result.value;
};
const navigate = async (route, width = 1440, height = 960, mobile = false) => {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height });
  await cdp('Page.navigate', { url: `${siteEndpoint}${route}` });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await wait(100);
    if (await evaluate('document.readyState === "complete"')) break;
  }
};
const waitForPath = async (pathname) => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await evaluate(`location.pathname === ${JSON.stringify(pathname)} && document.readyState === 'complete'`)) {
      await wait(100);
      return true;
    }
    await wait(100);
  }
  return false;
};
const checks = [];
const check = (name, pass, evidence) => { checks.push({ name, pass: Boolean(pass), evidence }); };

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Log.enable');

await navigate('/');
const homepage = await evaluate(`({a2:[...document.querySelectorAll('a[href="/a2/"]')].filter(node=>node.offsetParent!==null).length,label:[...document.querySelectorAll('a[href="/a2/"]')].map(node=>node.textContent.trim()).filter(Boolean)})`);
check('Homepage visibly links to the complete A2 course', homepage.a2 > 0, homepage);
await evaluate(`document.querySelector('a[href="/a2/"]')?.click()`);
check('Homepage A2 link navigates to the course overview', await waitForPath('/a2/'), await evaluate('location.pathname'));

const overview = await evaluate(`({units:[...document.querySelectorAll('a[href^="/a2/unit-"]')].map(node=>node.getAttribute('href')).filter((value,index,all)=>all.indexOf(value)===index),stats:[...document.querySelectorAll('.bd08-stats strong')].map(node=>node.textContent.trim())})`);
check('A2 overview visibly exposes all ten units', overview.units.length === 10, overview.units);
check('A2 overview exposes the approved headline inventory', JSON.stringify(overview.stats) === JSON.stringify(['300','40','384','24','5']), overview.stats);

await evaluate(`document.querySelector('a[href="/a2/unit-1/"]')?.click()`);
check('Overview Unit 1 link works', await waitForPath('/a2/unit-1/'), await evaluate('location.pathname'));
const unit1 = await evaluate(`({overviewLinks:document.querySelectorAll('a[href="/a2/"]').length,options:[...document.querySelectorAll('select[data-bd-course-switch] option')].map(node=>node.value),obsolete:document.body.innerText.includes('Only approved Unit 1 is available')})`);
check('Unit 1 provides ten-unit navigation and no false restriction', unit1.overviewLinks > 0 && new Set(unit1.options.filter((value)=>/^\/a2\/unit-\d+\/$/.test(value))).size === 10 && !unit1.obsolete, unit1);
await evaluate(`const select=document.querySelector('select[aria-label="Switch A2 unit"]');select.value='/a2/unit-10/';select.dispatchEvent(new Event('change',{bubbles:true}))`);
check('Unit selector reaches Unit 10', await waitForPath('/a2/unit-10/'), await evaluate('location.pathname'));

const unit10 = await evaluate(`({categories:['vocabulary','grammar','listening','podcast'].map(category=>Boolean(document.querySelector('main a[href*="/'+category+'/"]'))),next:document.querySelector('.lesson-nav-gradient .next')?.getAttribute('href')})`);
check('Unit 10 exposes all learner content areas', unit10.categories.every(Boolean), unit10);

await navigate('/a2/unit-10/grammar/g01/');
const grammarBefore = await evaluate(`({exercises:document.querySelectorAll('[data-draft-exercise]').length,ids:[...document.querySelectorAll('[data-draft-exercise]')].map(node=>node.id),previous:document.querySelector('.lesson-nav-gradient .previous')?.getAttribute('href'),next:document.querySelector('.lesson-nav-gradient .next')?.getAttribute('href')})`);
await evaluate(`const answer=document.querySelector('#A2-U10-G01-E01 input[value="komme"]');answer.checked=true;answer.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#A2-U10-G01-E01 [data-check-exercise]')?.click()`);
const grammarAfter = await evaluate(`document.querySelector('#A2-U10-G01-E01 [data-exercise-feedback]')?.dataset.state`);
check('Grammar activities render, score and preserve previous/next flow', grammarBefore.exercises === 4 && grammarBefore.previous && grammarBefore.next && grammarAfter === 'correct', { grammarBefore, grammarAfter });

await navigate('/a2/unit-2/vocabulary/v01/');
const languageResults = [];
for (const language of ['en', 'ps', 'fa', 'ar', 'uk']) {
  languageResults.push(await evaluate(`document.querySelector('[data-support-language="${language}"]')?.click();({language:document.body.dataset.supportLanguage,direction:document.body.dataset.supportDirection,selected:document.querySelector('[data-support-language="${language}"]')?.getAttribute('aria-pressed'),translated:document.querySelectorAll('[data-support-values][lang="${language}"]').length})`));
}
check('All five support languages can be selected', languageResults.every((item, index) => item.language === ['en','ps','fa','ar','uk'][index] && item.selected === 'true'), languageResults);
check('Arabic and Persian translated elements render RTL', languageResults[2].direction === 'rtl' && languageResults[3].direction === 'rtl' && languageResults[3].translated > 0, languageResults.slice(2, 4));

await navigate('/a2/unit-2/listening/l01/');
const listening = await evaluate(`({audio:[...document.querySelectorAll('audio')].map(node=>({duration:node.duration,readyState:node.readyState,controls:node.controls,src:node.currentSrc})),questions:document.querySelectorAll('[id*="-Q0"]').length,transcript:document.querySelectorAll('.bd08-transcript').length})`);
await evaluate(`(()=>{const audio=document.querySelector('audio');if(audio&&audio.duration>6)audio.currentTime=5})()`);
await wait(250);
const listeningSeekTime = await evaluate(`document.querySelector('audio')?.currentTime`);
check('Listening audio, seeking, transcript and questions are learner-usable', listening.audio.length === 2 && listening.audio.every((item)=>item.duration>0&&item.readyState>=1&&item.controls&&item.src.endsWith('.mp3')) && listening.questions > 0 && listening.transcript && listeningSeekTime >= 4.5, { ...listening, seekTime: listeningSeekTime });

await navigate('/a2/unit-2/podcast/a2-p02/');
await evaluate(`Promise.all([...document.querySelectorAll('audio')].map((audio)=>new Promise((resolve)=>{if(audio.readyState>=1)return resolve(true);const done=()=>resolve(audio.readyState>=1);audio.addEventListener('loadedmetadata',done,{once:true});audio.addEventListener('error',done,{once:true});audio.load();setTimeout(done,5000)})))`);
const podcast = await evaluate(`({audio:[...document.querySelectorAll('audio')].map(node=>({duration:node.duration,readyState:node.readyState,controls:node.controls,src:node.currentSrc})),questions:document.querySelectorAll('[id*="-Q0"]').length,chapterButtons:document.querySelectorAll('[data-chapter-select]').length})`);
check('Podcast master, six chapters and questions are learner-usable', podcast.audio.length === 7 && podcast.audio.every((item)=>item.duration>0&&item.readyState>=1&&item.controls&&item.src.endsWith('.mp3')) && podcast.questions === 6 && podcast.chapterButtons === 6, podcast);

await navigate('/a2/unit-5/', 390, 844, true);
const mobile = await evaluate(`({width:innerWidth,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,menuVisible:getComputedStyle(document.querySelector('[data-bd-drawer-open]')).display!=='none',selectors:document.querySelectorAll('select[data-bd-course-switch]').length})`);
check('Mobile A2 navigation has no horizontal overflow', mobile.width === 390 && !mobile.overflow && mobile.menuVisible && mobile.selectors > 0, mobile);

await navigate('/grammar/lesson-01/');
const a1 = await evaluate(`({title:document.querySelector('h1')?.textContent.trim(),interactive:document.querySelectorAll('button,input,select,textarea').length,homeA2:document.querySelectorAll('a[href="/a2/"]').length})`);
check('Representative A1 lesson remains functional', Boolean(a1.title) && a1.interactive > 0 && a1.homeA2 > 0, a1);
check('Browser console contains no material errors', browserErrors.length === 0, browserErrors);

const result = { schemaVersion: '1.0.0', status: checks.every((item)=>item.pass) ? 'PASS' : 'FAIL', total: checks.length, passed: checks.filter((item)=>item.pass).length, failed: checks.filter((item)=>!item.pass).length, checks };
if (output) writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
socket.close();
if (result.failed) process.exitCode = 1;
