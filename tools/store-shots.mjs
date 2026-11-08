// Captures staged in-game moments at iPhone resolution, then frames them with captions
// for the App Store (1290x2796) and Google Play (1080x2160). Run after `npm run build`:
//   node tools/store-shots.mjs
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'store');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png' };

// tiny static server for dist/ (with /c/* -> index.html like the Worker)
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p.startsWith('/c/')) p = '/index.html';
  const f = path.join(p.startsWith('/__store/') ? ROOT : DIST, p.replace('/__store/', ''));
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
  res.end(readFileSync(f));
}).listen(5199);
const BASE = 'http://localhost:5199';

const NAMES = ['ReelQueen', 'IceKing', 'Bubbles', 'LuckyLure', 'NeonPike', 'FrostByte', 'TroutSnout', 'Captain Cod', 'Mia', 'Jayden', 'SalmonSam', 'Guppy', 'Otterly', 'Finn', 'Nova', 'CrabShooer'];
const board = () => ({
  entries: NAMES.concat(NAMES.map((n) => n + '2')).slice(0, 24).map((name, i) => ({ rank: i + 1, name, score: Math.round(9840 - i * 310 - (i * i) % 47), fish: 96 - i * 3, me: i === 6 })),
  me: { rank: 7, name: 'You', score: 7954, fish: 78 },
});

async function page(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  await ctx.addInitScript(() => { localStorage.setItem('hooked.best', '4210'); localStorage.setItem('hooked.name', '"You"'); });
  const p = await ctx.newPage();
  await p.route('**/functions/v1/hooked', (route) => {
    const b = JSON.parse(route.request().postData() || '{}');
    const j = (x) => route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: x });
    if (b.action === 'daily') return j({ id: 'rare3', title: 'Catch 3 shiny fish', reward: 'x2 score', endsIn: '14h 22m' });
    if (b.action === 'getChallenge') return j({ code: 'SAMK4ZQ', name: 'Sam', score: 4210, fish: 31, attempts: 6, beaten: 2 });
    if (b.action === 'start') return j({ runId: '11111111-2222-3333-4444-555555555555' });
    if (b.action === 'leaderboard') return j(board());
    return j({ ok: true });
  });
  return p;
}

// Put the running game into a hand-staged moment, then freeze it.
const stage = (p, fn) => p.evaluate(fn);
const freeze = (p) => p.evaluate(() => { window.__hooked.game.state = 'paused'; });

const shots = [];
async function snap(p, name) { const file = path.join(OUT, 'raw', name + '.png'); await p.screenshot({ path: file }); shots.push(name); }

const browser = await chromium.launch();

// 1 · gameplay: legendary on the hook, big combo
{
  const p = await page(browser);
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  await p.click('#playBtn', { force: true }); await p.waitForTimeout(500);
  await stage(p, () => {
    const g = window.__hooked.game;
    g.t = 30; g.run.score = 6840; g.run.fish = 24; g.worms = 3; g.combo = 7; g.streak = 6; g.hintT = 99;
    g.fish = [
      { type: 'common', pal: 'orange', w: 72, x: 110, by: 470, y: 470, vx: 60, ph: 0, fq: 2, amp: 0, esc: 0 },
      { type: 'rare', pal: 'shiny', w: 70, x: 230, by: 600, y: 600, vx: -80, ph: 0, fq: 2, amp: 0, esc: 0 },
      { type: 'common', pal: 'cyan', w: 76, x: 90, by: 690, y: 690, vx: 70, ph: 0, fq: 2, amp: 0, esc: 0 },
      { type: 'common', pal: 'yellow', w: 60, x: 330, by: 330, y: 330, vx: -70, ph: 0, fq: 2, amp: 0, esc: 0 },
    ];
    g.jellies = []; g.sharks = []; g.crabs = []; g.junk = []; g.cans = [];
    g.hook.x = 290; g.hook.y = 300; g.aimX = 290; g.aimY = 300;
    g.hook.carry = { type: 'legendary', pal: 'legend', w: 90, pull: 520, struggle: 0 };
    g.pops = []; g.pop('+1,400', 300, 150, '#FFE14D', 44, 99); g.pop('LEGENDARY!', 92, 108, '#B98CFF', 28, 99); g.pop('x7 COMBO', 120, 178, '#FF6FB5', 22, 99); g.pops.forEach((q) => { q.life = q.max * 0.5; });
    g.happy = 5;
  });
  await p.waitForTimeout(120); await freeze(p); await p.waitForTimeout(100);
  await snap(p, '1-gameplay'); await p.context().close();
}

// 2 · hazards: shark, jellyfish, crab
{
  const p = await page(browser);
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  await p.click('#playBtn', { force: true }); await p.waitForTimeout(500);
  await stage(p, () => {
    const g = window.__hooked.game;
    g.t = 60; g.run.score = 3210; g.run.fish = 13; g.worms = 2; g.combo = 4; g.streak = 3; g.hintT = 99;
    g.fish = [{ type: 'common', pal: 'pink', w: 70, x: 120, by: 380, y: 380, vx: 60, ph: 0, fq: 2, amp: 0, esc: 0 }];
    g.jellies = [{ x: 130, by: 520, y: 520, vx: 0, ph: 0 }];
    g.sharks = [{ x: 250, y: 640, vx: -300, warn: 0 }];
    g.crabs = [{ x: 200, y: 266, vx: 50, rot: 0, a: 1, hint: true }];
    g.junk = [{ kind: 'boot', x: 330, y: 420, vy: 0, ph: 0, rot: 0.3, vr: 0 }];
    g.cans = [];
    g.hook.x = 300; g.hook.y = 540; g.aimX = 300; g.aimY = 540; g.hook.carry = { type: 'common', pal: 'orange', w: 66, pull: 900, struggle: 0 };
    g.hook.inv = 0; g.pops = []; g.pop('DODGE!', 300, 470, '#FF5A3D', 36, 99); g.pops.forEach((q) => { q.life = q.max * 0.5; });
  });
  await p.waitForTimeout(120); await freeze(p); await p.waitForTimeout(100);
  await snap(p, '2-hazards'); await p.context().close();
}

// 3 · boss intro
{
  const p = await page(browser);
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  await p.click('#playBtn', { force: true }); await p.waitForTimeout(500);
  await stage(p, () => { const g = window.__hooked.game; g.run.score = 8120; g.startBossIntro(); });
  await p.waitForTimeout(1500);
  await snap(p, '3-boss'); await p.context().close();
}

// 4 · challenge a friend
{
  const p = await page(browser);
  await p.goto(BASE + '/c/SAMK4ZQ', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await snap(p, '4-challenge'); await p.context().close();
}

// 5 · leaderboard
{
  const p = await page(browser);
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  await p.click('#lbBtn', { force: true }); await p.waitForTimeout(1200);
  await snap(p, '5-leaderboard'); await p.context().close();
}

// 6 · title
{
  const p = await page(browser);
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  await snap(p, '6-title'); await p.context().close();
}

// ---- frame each shot with a caption
const CAPTIONS = {
  '1-gameplay': ['HOOK IT.', 'PULL IT UP!', 'Drag to fish under the ice'],
  '2-hazards': ['DODGE SHARKS', '& JELLYFISH', 'Tap crabs before they snip your line'],
  '3-boss': ['CATCH THE', 'RAINBOW KING', 'A giant boss every 30 fish'],
  '4-challenge': ['CHALLENGE', 'YOUR FRIENDS', 'Send a link. Beat their score.'],
  '5-leaderboard': ['CLIMB THE', 'LEADERBOARD', 'Daily and all-time rankings'],
  '6-title': ['ICE FISHING', 'FRENZY', 'Free. Quick runs. Big combos.'],
};
const BGS = {
  '1-gameplay': ['#FF4FA3', '#FF8A6B'], '2-hazards': ['#19B8FF', '#6A2BEA'], '3-boss': ['#8B2CFF', '#2B0A73'],
  '4-challenge': ['#FF2E93', '#FF7A1A'], '5-leaderboard': ['#00C2E0', '#5B1FD6'], '6-title': ['#22F0E0', '#19B8FF'],
};
function frameHtml(name, W, H) {
  const [a, b, sub] = CAPTIONS[name];
  const [c1, c2] = BGS[name];
  const phoneH = Math.round(H * 0.70), phoneW = Math.round(phoneH * 390 / 844);
  const fs = Math.round(W * 0.115);
  return `<!doctype html><html><head><style>
@font-face{font-family:'Lilita One';src:url(${BASE}/__store/public/fonts/LilitaOne.ttf)}
@font-face{font-family:'Fredoka';src:url(${BASE}/__store/public/fonts/Fredoka-700Bold.ttf);font-weight:700}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
body{background:linear-gradient(170deg,${c1},${c2});position:relative;font-family:'Lilita One'}
.rays{position:absolute;inset:-50%;background:repeating-conic-gradient(from 0deg at 50% 60%,rgba(255,255,255,.10) 0 9deg,transparent 9deg 18deg)}
h1{position:absolute;left:0;right:0;top:${Math.round(H * 0.035)}px;margin:0;text-align:center;font-weight:400;font-size:${fs}px;line-height:1.02;color:#fff;letter-spacing:1px;
paint-order:stroke fill;-webkit-text-stroke:${Math.round(fs * 0.16)}px #1A0B3D;text-shadow:0 ${Math.round(fs * 0.09)}px 0 #1A0B3D}
h1 span{color:#FFE14D}
p{position:absolute;left:0;right:0;top:${Math.round(H * 0.035 + fs * 2.2)}px;margin:0;text-align:center;font:700 ${Math.round(W * 0.042)}px Fredoka;color:#fff;text-shadow:0 3px 0 rgba(26,11,61,.6)}
.phone{position:absolute;left:${Math.round((W - phoneW) / 2)}px;bottom:${Math.round(H * 0.035)}px;width:${phoneW}px;height:${phoneH}px;border-radius:${Math.round(phoneW * 0.12)}px;
border:${Math.round(W * 0.012)}px solid #1A0B3D;box-shadow:0 ${Math.round(W * 0.02)}px 0 #1A0B3D,0 ${Math.round(W * 0.05)}px ${Math.round(W * 0.06)}px rgba(0,0,0,.35);overflow:hidden;background:#1A0B3D}
.phone img{width:100%;height:100%;object-fit:cover;display:block}
</style></head><body><div class="rays"></div>
<h1>${a}<br><span>${b}</span></h1><p>${sub}</p>
<div class="phone"><img src="${BASE}/__store/store/raw/${name}.png"></div></body></html>`;
}

const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const fp = await ctx.newPage();
for (const [dir, W, H] of [['apple', 1290, 2796], ['google', 1080, 2160]]) {
  await fp.setViewportSize({ width: W, height: H });
  for (const name of shots) {
    await fp.setContent(frameHtml(name, W, H), { waitUntil: 'networkidle' });
    await fp.evaluate(() => document.fonts.ready);
    await fp.screenshot({ path: path.join(OUT, dir, name + '.png') });
  }
}
await browser.close();
server.close();
console.log('wrote', shots.length, 'shots to store/apple and store/google');
