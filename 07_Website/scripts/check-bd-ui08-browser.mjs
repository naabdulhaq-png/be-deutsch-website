import fs from 'node:fs';
import path from 'node:path';

const site = path.resolve(import.meta.dirname, '..');
const output = path.resolve(site, '..');
const browserEndpoint = process.env.BD_UI08_CDP_ENDPOINT ?? 'http://127.0.0.1:9248';
const siteEndpoint = process.env.BD_UI08_SITE_ENDPOINT ?? 'http://127.0.0.1:4328';
const target = await fetch(`${browserEndpoint}/json/new?about:blank`, { method: 'PUT' }).then(response => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0;
const pending = new Map();
const browserErrors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.text);
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') browserErrors.push(message.params.entry.text);
  if (!message.id || !pending.has(message.id)) return;
  const task = pending.get(message.id); pending.delete(message.id);
  message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
});
const cdp = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const evaluate = async expression => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;
async function navigate(route, width = 1440, height = 960, mobile = false) {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height });
  await cdp('Page.navigate', { url: `${siteEndpoint}${route}` });
  await wait(550);
}
await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Log.enable');
const checks = [];
const check = (name, pass, evidence) => { checks.push({ name, pass: Boolean(pass), evidence }); if (!pass) process.exitCode = 1; };

await navigate('/a2/unit-1/listening/l01/');
await wait(450);
const approvedAudio = await evaluate(`Array.from(document.querySelectorAll('audio')).map(node=>({src:node.getAttribute('src'),duration:node.duration}))`);
check('Approved Unit 1 audio remains playable', approvedAudio.length === 2 && approvedAudio.every(item => item.src?.endsWith('.mp3') && item.duration > 0), approvedAudio);

await navigate('/a2/unit-2/vocabulary/v01/');
await evaluate(`document.querySelector('[data-support-language="ar"]')?.click();const input=document.querySelector('[data-vocab-search]');input.value='Verwandte';input.dispatchEvent(new Event('input',{bubbles:true}))`);
const vocabulary = await evaluate(`({language:document.body.dataset.supportLanguage,direction:document.body.dataset.supportDirection,visible:Array.from(document.querySelectorAll('[data-vocab-card]')).filter(node=>!node.hidden).map(node=>node.id),rtl:Array.from(document.querySelectorAll('[data-support-values]')).filter(node=>node.getAttribute('dir')==='rtl').length,germanDir:document.querySelector('[data-vocab-card] [lang="de"]')?.getAttribute('dir')})`);
check('Vocabulary search finds exact source record', vocabulary.visible.length === 1 && vocabulary.visible[0] === 'A2-U02-V01-X01', vocabulary.visible);
check('Arabic support renders RTL without replacing German', vocabulary.language === 'ar' && vocabulary.direction === 'rtl' && vocabulary.rtl > 0, vocabulary);

await navigate('/a2/unit-2/grammar/g01/');
await evaluate(`document.querySelector('#A2-U02-G01-E01 [data-exercise-hint]')?.click();const answer=document.querySelector('#A2-U02-G01-E01 input[value="sind"]');answer.checked=true;answer.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#A2-U02-G01-E01 [data-check-exercise]')?.click()`);
const grammar = await evaluate(`({rows:document.querySelectorAll('.bd08-structure tbody tr').length,hint:!document.querySelector('#A2-U02-G01-E01 [data-hint-panel]').hidden,feedback:document.querySelector('#A2-U02-G01-E01 [data-exercise-feedback]').dataset.state,stored:JSON.parse(localStorage.getItem('be-deutsch:a2-draft-progress:v1')||'{}')['A2-U02-G01-E01'],previous:document.querySelector('.lesson-nav-gradient .previous')?.getAttribute('href'),next:document.querySelector('.lesson-nav-gradient .next')?.getAttribute('href')})`);
check('Grammar Design D table renders', grammar.rows === 4, grammar.rows);
check('Hint and correct-answer feedback work', grammar.hint && grammar.feedback === 'correct', grammar);
check('Draft progress persists under separate key', grammar.stored?.completed === true && grammar.stored.attempts >= 1, grammar.stored);
check('Previous and next navigation is functional', Boolean(grammar.previous && grammar.next), { previous: grammar.previous, next: grammar.next });

await navigate('/a2/unit-2/listening/l01/');
await evaluate(`document.querySelectorAll('[data-passage-select]')[1]?.click();document.querySelector('[data-passage-panel]:not([hidden]) details summary')?.click()`);
const listening = await evaluate(`({selected:document.querySelector('[data-passage-select][aria-pressed="true"]')?.dataset.passageSelect,visible:document.querySelector('[data-passage-panel]:not([hidden])')?.id,open:document.querySelectorAll('[data-passage-panel]:not([hidden]) details[open]').length,audio:document.querySelectorAll('.bd08-listening audio').length,pending:document.body.innerText.includes('Audio recording pending')})`);
check('Listening selection and transcript disclosure work', listening.selected === listening.visible && listening.open === 1, listening);
check('New Listening is honestly pending without audio', listening.audio === 0 && listening.pending, listening);

await navigate('/a2/unit-2/podcast/a2-p02/');
await evaluate(`document.querySelectorAll('[data-chapter-select]')[3]?.click()`);
const podcast = await evaluate(`({selected:document.querySelector('[data-chapter-select][aria-pressed="true"]')?.dataset.chapterSelect,visible:document.querySelector('[data-chapter-panel]:not([hidden])')?.dataset.chapterPanel,chapters:document.querySelectorAll('[data-chapter-select]').length,audio:document.querySelectorAll('.bd08-podcast audio,.bd08-chapters audio').length,pending:document.body.innerText.includes('No playable file yet')})`);
check('Podcast six-chapter navigation works', podcast.chapters === 6 && podcast.selected === 'C04' && podcast.visible === 'C04', podcast);
check('New Podcast is honestly pending without audio', podcast.audio === 0 && podcast.pending, podcast);

await navigate('/a2/review-index/');
await evaluate(`const input=document.querySelector('[data-review-search]');input.value='BD-A2-AUDIO-D-P02';input.dispatchEvent(new Event('input',{bubbles:true}))`);
const review = await evaluate(`({total:document.querySelectorAll('[data-review-row]').length,visible:Array.from(document.querySelectorAll('[data-review-row]')).filter(node=>!node.hidden).map(node=>node.querySelector('code')?.textContent),status:document.querySelector('[data-review-count]')?.textContent})`);
check('Reviewer index filters all 753 exact IDs', review.total === 753 && review.visible.length === 1 && review.visible[0] === 'BD-A2-AUDIO-D-P02', review);

await navigate('/a2/unit-2/grammar/g01/', 390, 844, true);
await evaluate(`document.querySelector('[data-bd-drawer-open]')?.click()`);
await wait(400);
const mobile = await evaluate(`({width:innerWidth,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,drawer:getComputedStyle(document.querySelector('#bd-course-drawer')).transform,backdrop:document.querySelector('.bd-ui02__backdrop').hidden})`);
check('Mobile drawer opens without horizontal overflow', mobile.width === 390 && !mobile.overflow && mobile.drawer === 'matrix(1, 0, 0, 1, 0, 0)' && mobile.backdrop === false, mobile);
check('No material console errors', browserErrors.length === 0, browserErrors);

const report = { generated: new Date().toISOString(), total: checks.length, passed: checks.filter(item => item.pass).length, failed: checks.filter(item => !item.pass).length, checks };
fs.mkdirSync(path.join(output, 'reports'), { recursive: true });
fs.writeFileSync(path.join(output, 'reports', 'BROWSER_INTERACTION_CHECKS.json'), JSON.stringify(report, null, 2) + '\n');
for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}`);
console.log(`Browser interaction checks: ${report.passed}/${report.total}`);
socket.close();

