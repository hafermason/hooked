import { CFG } from './config.js';
import { loadSprites, fishInner, OTTER_SVG, KING_SVG, PALETTES } from './sprites.js';
import { API, DAILIES, store } from './api.js';
import { Game } from './game.js';
import { sfx } from './sfx.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ------------------------------------------------------------ fit 390x844 stage to any screen
function fit() {
  const s = Math.min(window.innerWidth / 390, window.innerHeight / 844);
  $('#stage').style.transform = `scale(${s})`;
}
window.addEventListener('resize', fit);
fit();

// ------------------------------------------------------------ screens
let current = 'title';
function show(id) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.toggle('on', el.id === id));
  current = id;
}

// ------------------------------------------------------------ title decoration
function decorateTitle() {
  $('#t-otter').innerHTML = `<svg viewBox="0 0 140 140" width="150" height="150" style="overflow:visible" role="img" aria-label="Round otter in a pink beanie holding a fishing rod">${OTTER_SVG}</svg>`;
  const fish = [
    { x: 28, y: 452, w: 84, flip: 1, p: 'orange', anim: 'swim 3.2s ease-in-out 0s infinite' },
    { x: 206, y: 488, w: 66, flip: -1, p: 'shiny', anim: 'swim 2.6s ease-in-out .4s infinite', shiny: 1 },
    { x: 20, y: 742, w: 70, flip: 1, p: 'cyan', anim: 'swim 3.6s ease-in-out .9s infinite' },
    { x: 282, y: 760, w: 92, flip: -1, p: 'legend', anim: 'swim 3s ease-in-out .2s infinite, glow 1.6s ease-in-out infinite', shiny: 1 },
  ];
  const sparkle = (st) => `<svg viewBox="0 0 20 20" width="${st[0]}" height="${st[0]}" style="position:absolute;${st[1]};animation:twinkle 1.2s ease-in-out ${st[2]}s infinite" aria-hidden="true"><path d="M10 0 L13 7 L20 10 L13 13 L10 20 L7 13 L0 10 L7 7 Z" fill="#fff" stroke="#1A0B3D" stroke-width="2" stroke-linejoin="round"/></svg>`;
  $('#t-fish').innerHTML = fish.map((f) => {
    const [b, be, fi] = PALETTES[f.p];
    return `<div style="position:absolute;left:${f.x}px;top:${f.y}px;animation:${f.anim}">
      <svg viewBox="0 0 120 80" width="${f.w}" height="${f.w * 2 / 3}" style="display:block;overflow:visible;transform:scaleX(${f.flip})" aria-hidden="true">${fishInner(b, be, fi, false)}</svg>
      ${f.shiny ? sparkle([18, 'right:-6px;top:-8px', 0]) + sparkle([12, 'left:6px;bottom:-4px', 0.5]) : ''}</div>`;
  }).join('');
  $('#t-bubbles').innerHTML = [[30, 10, 6, 0], [80, 16, 8, 2], [140, 8, 5, 1], [200, 14, 7, 3], [252, 9, 6, 4], [318, 18, 9, 1.5], [356, 10, 6.5, 2.5], [112, 12, 7.5, 4.5]]
    .map(([x, s, d, dl]) => `<div style="position:absolute;left:${x}px;top:860px;width:${s}px;height:${s}px;border-radius:50%;border:2px solid rgba(255,255,255,.85);background:rgba(255,255,255,.18);animation:rise ${d}s linear ${dl}s infinite"></div>`).join('');
  const weed = (w, front) => `<svg viewBox="0 0 40 200" width="${front ? 40 : 34}" height="${w[1]}" preserveAspectRatio="none" style="position:absolute;left:${w[0]}px;bottom:-10px;${front ? '' : 'opacity:.45;'}transform-origin:50% 100%;animation:sway ${w[2]}s ease-in-out ${w[3]}s infinite" aria-hidden="true">${front ? `<path d="M20 200 Q2 160 20 120 Q38 80 20 40 Q10 20 20 2" fill="none" stroke="#1A0B3D" stroke-width="18" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : ''}<path d="M20 200 Q2 160 20 120 Q38 80 20 40 Q10 20 20 2" fill="none" stroke="${front ? w[4] : '#12C9B0'}" stroke-width="${front ? 10 : 12}" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
  $('#t-weedBack').innerHTML = [[60, 220, 5, 0], [150, 170, 6, 1], [250, 240, 5.5, .5], [330, 190, 6.5, 1.5]].map((w) => weed(w, false)).join('');
  $('#t-weedFront').innerHTML = [[-6, 150, 3.4, 0, '#B6FF2E'], [22, 100, 3, .6, '#2EE68A'], [340, 130, 3.6, .3, '#B6FF2E'], [362, 90, 3.1, .9, '#FF6FB5']].map((w) => weed(w, true)).join('');
}

// ------------------------------------------------------------ challenge-a-friend link
const params = new URLSearchParams(location.search);
let challenge = null; // { score, fish, name }
async function loadChallenge() {
  const id = params.get('c');
  if (id && API.getChallenge) { try { challenge = await API.getChallenge(id); } catch (e) {} }
  if (!challenge && params.get('beat')) challenge = { score: +params.get('beat') || 0, fish: +params.get('fish') || 0, name: params.get('from') || '' };
  if (challenge) {
    $('#beatChip').style.display = 'flex';
    $('#beatScore').textContent = fmt(challenge.score);
    $('#beatWho').textContent = challenge.name ? 'from ' + challenge.name : '';
  }
}

// ------------------------------------------------------------ title data
let daily = null;
async function refreshTitle() {
  $('#bestScore').textContent = fmt(store.get('hooked.best', 0));
  try {
    const d = await API.getDailyChallenge();
    const local = DAILIES.find((x) => x.id === d.id);
    daily = { ...d, test: local ? local.test : null };
    $('#dailyTitle').textContent = d.title;
    $('#dailyReward').textContent = d.reward;
    $('#dailyEnds').textContent = d.endsIn;
  } catch (e) {}
}

// ------------------------------------------------------------ game
const hooks = {
  onGameOver: (run) => { sfx.play('over'); showGameOver(run); },
  onBossIntro: (score, bonus) => showBoss(score, bonus),
  onBossIntroEnd: () => { $('#boss').hidden = true; $('#boss').innerHTML = ''; },
  onEvent: (name) => { window.dispatchEvent(new CustomEvent('hooked:event', { detail: name })); },
};
let game;
let runId = null;

async function play() {
  sfx.unlock();
  $('#pause').hidden = true;
  show('game');
  try { runId = (await API.startGame()).runId; } catch (e) { runId = 'local-' + Date.now(); }
  API.track('play');
  game.start({ daily, runId });
}

// ------------------------------------------------------------ boss overlay (design screen 3)
function showBoss(score, bonus) {
  const sp = [[40, 330, 22], [330, 350, 16], [20, 560, 14], [350, 520, 24], [290, 610, 14], [70, 640, 18], [200, 340, 12], [170, 600, 20], [360, 420, 12]];
  const cs = ['#FFFFFF', '#FFE14D', '#00E5FF', '#FF2E93', '#B6FF2E'];
  const el = $('#boss');
  el.innerHTML = `
  <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 56%,#7B2CFF 0%,#3B0D99 45%,#12052E 100%);overflow:hidden">
    <div style="position:absolute;left:-230px;top:106px;width:850px;height:850px;border-radius:50%;opacity:.55;background:repeating-conic-gradient(from 0deg,#FF2E93 0deg 10deg,transparent 10deg 20deg,#FFE14D 20deg 30deg,transparent 30deg 40deg,#00E5FF 40deg 50deg,transparent 50deg 60deg,#B6FF2E 60deg 70deg,transparent 70deg 80deg);-webkit-mask-image:radial-gradient(circle,#000 0%,transparent 62%);mask-image:radial-gradient(circle,#000 0%,transparent 62%);animation:spin 14s linear infinite"></div>
    <div style="position:absolute;left:12px;top:58px;opacity:.45;background:#fff;border:5px solid #1A0B3D;border-radius:22px;padding:4px 16px 6px;display:flex;flex-direction:column"><span style="font-weight:700;font-size:12px;letter-spacing:2px;color:#B3006A">SCORE</span><span class="lil" style="font-size:30px;line-height:1">${fmt(score)}</span></div>
    <div class="center abs" style="top:142px;animation:slam 1s cubic-bezier(.2,1.4,.4,1) both">
      <div style="position:relative;width:352px">
        <svg viewBox="0 0 60 70" width="54" height="64" style="position:absolute;left:-26px;top:34px" aria-hidden="true"><path d="M60 0 L0 8 L18 36 L0 64 L60 56 Z" fill="#B3006A" stroke="#1A0B3D" stroke-width="5" stroke-linejoin="round"/></svg>
        <svg viewBox="0 0 60 70" width="54" height="64" style="position:absolute;right:-26px;top:34px;transform:scaleX(-1)" aria-hidden="true"><path d="M60 0 L0 8 L18 36 L0 64 L60 56 Z" fill="#5B1FD6" stroke="#1A0B3D" stroke-width="5" stroke-linejoin="round"/></svg>
        <div style="position:relative;background:linear-gradient(90deg,#FF2E93,#FF7A1A 35%,#8B2CFF);border:6px solid #1A0B3D;border-radius:18px;box-shadow:0 8px 0 #1A0B3D;padding:12px 10px 14px;display:flex;flex-direction:column;align-items:center;gap:2px">
          <div class="ols lil" style="font-size:30px;line-height:1;color:#fff;letter-spacing:1px">THE RAINBOW KING</div>
          <div class="ol lil" style="font-size:66px;line-height:1;color:#FFE14D;letter-spacing:2px;-webkit-text-stroke-width:9px">APPEARS!</div>
        </div>
      </div>
    </div>
    <div style="position:absolute;left:30px;top:380px;animation:kingswim 2.6s ease-in-out infinite">
      <svg viewBox="0 0 240 160" width="330" height="220" style="display:block;overflow:visible;animation:kingglow 1.4s ease-in-out infinite" role="img" aria-label="The Rainbow King">${KING_SVG}</svg>
    </div>
    ${sp.map((p, i) => `<svg viewBox="0 0 20 20" width="${p[2]}" height="${p[2]}" style="position:absolute;left:${p[0]}px;top:${p[1]}px;animation:twinkleR ${1 + (i % 3) * 0.4}s ease-in-out ${(i % 4) * 0.3}s infinite" aria-hidden="true"><path d="M10 0 L13 7 L20 10 L13 13 L10 20 L7 13 L0 10 L7 7 Z" fill="${cs[i % 5]}" stroke="#1A0B3D" stroke-width="1.5" stroke-linejoin="round"/></svg>`).join('')}
    <div class="center abs" style="top:650px;animation:pulse .9s ease-in-out infinite">
      <div style="display:flex;align-items:center;gap:10px;background:#B6FF2E;border:5px solid #1A0B3D;border-radius:999px;box-shadow:0 6px 0 #1A0B3D,inset 0 -6px 0 #6FD400;padding:10px 22px">
        <span style="font-weight:700;font-size:16px;letter-spacing:1px">HOOK HIM FOR</span><span class="ols lil" style="font-size:36px;line-height:1;color:#fff">+${fmt(bonus)}</span>
      </div>
    </div>
    <div style="position:absolute;left:0;top:0;width:390px;height:44px;background:#0A0218"></div>
    <div style="position:absolute;left:0;top:800px;width:390px;height:44px;background:#0A0218"></div>
    <div style="position:absolute;right:14px;top:62px;display:flex;align-items:center;gap:6px;background:rgba(10,2,24,.75);color:#fff;border:2px solid #00E5FF;border-radius:999px;padding:4px 12px;font-weight:700;font-size:13px;letter-spacing:2px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="3" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>SLOW-MO</div>
    <div style="position:absolute;inset:0;background:#fff;pointer-events:none;animation:flash 1.2s ease-out both"></div>
  </div>`;
  el.hidden = false;
}

// ------------------------------------------------------------ game over (design screen 4)
let lastRun = null;
function showGameOver(run) {
  lastRun = run;
  const prevBest = store.get('hooked.best', 0);
  if (run.score > prevBest) store.set('hooked.best', run.score);
  API.track('finish', { score: run.score, fish: run.fish });
  const T = CFG.fish.types;
  const rows = [
    ['Common', run.counts.common, run.counts.common * T.common.base, PALETTES.orange, 'none'],
    ['Shiny', run.counts.rare, run.counts.rare * T.rare.base, PALETTES.shiny, 'none'],
    ['Legendary', run.counts.legendary, run.counts.legendary * T.legendary.base, PALETTES.legend, 'drop-shadow(0 0 4px #FFE14D)'],
    ['Rainbow King', run.counts.king, run.counts.king * CFG.boss.bonus, ['#FFE14D', '#fff', '#00E5FF'], 'drop-shadow(0 0 5px #FF2E93)'],
  ];
  const beat = challenge && run.score > challenge.score;
  const name = store.get('hooked.name', '');
  const el = $('#over');
  el.innerHTML = `
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,#19B8FF 0%,#6A2BEA 50%,#2B0A73 100%)"></div>
  ${[[30, 12, 7, 0], [90, 18, 9, 2], [160, 10, 6, 1], [230, 14, 8, 3], [300, 10, 7, 4], [350, 20, 10, 1.5]].map(([x, s, d, dl]) => `<div style="position:absolute;left:${x}px;top:860px;width:${s}px;height:${s}px;border-radius:50%;border:2px solid rgba(255,255,255,.8);background:rgba(255,255,255,.15);animation:rise ${d}s linear ${dl}s infinite"></div>`).join('')}
  <div class="card" style="left:18px;top:${challenge ? 96 : 104}px;width:354px;padding:46px 20px 20px;gap:${challenge ? 10 : 12}px">
    <div style="position:relative;display:flex;flex-direction:column;align-items:center">
      <span style="font-weight:700;font-size:14px;letter-spacing:3px;color:#B3006A">FINAL SCORE</span>
      <span class="ol lil" style="font-size:72px;line-height:1.05;color:#FFE14D">${fmt(run.score)}</span>
      ${run.score > prevBest && run.score > 0 ? `<div style="position:absolute;right:-8px;top:10px;background:#FF2E93;color:#fff;border:4px solid #1A0B3D;border-radius:14px;padding:4px 10px;font-family:'Lilita One';font-size:18px;line-height:1.05;text-align:center;box-shadow:0 4px 0 #1A0B3D;animation:wob 1s ease-in-out infinite">NEW<br>BEST!</div>` : ''}
    </div>
    ${challenge ? `<div style="text-align:center;font-weight:700;font-size:15px;color:${beat ? '#2E9E00' : '#B3006A'}">${beat ? `YOU BEAT ${esc(challenge.name || 'YOUR FRIEND').toUpperCase()}! (${fmt(challenge.score)})` : `${fmt(challenge.score - run.score)} SHORT OF ${esc(challenge.name || 'YOUR FRIEND').toUpperCase()}`}</div>` : `
    <div style="display:flex;justify-content:center;align-items:center;gap:8px;font-weight:700;font-size:15px">
      <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 10 L10 16 L16 6 L22 16 L28 10 L25 24 L7 24 Z" fill="#FFE14D" stroke="#1A0B3D" stroke-width="3" stroke-linejoin="round"/></svg>
      <span>BEST ${fmt(Math.max(prevBest, run.score))}</span></div>`}
    <div style="background:#F3EDFF;border:4px solid #1A0B3D;border-radius:20px;padding:10px 14px;display:flex;flex-direction:column;gap:4px">
      ${rows.map(([label, n, pts, p, glow]) => `
      <div style="display:flex;align-items:center;gap:10px;height:30px">
        <svg viewBox="0 0 120 80" width="34" height="23" style="overflow:visible;filter:${glow}" aria-hidden="true"><path d="M26 40 L3 14 Q-2 40 3 66 Z" fill="${p[2]}" stroke="#1A0B3D" stroke-width="8" stroke-linejoin="round"/><ellipse cx="62" cy="40" rx="42" ry="28" fill="${p[0]}" stroke="#1A0B3D" stroke-width="8"/><circle cx="84" cy="34" r="8" fill="#1A0B3D"/></svg>
        <span style="flex:1;font-weight:600;font-size:16px">${label}</span>
        <span style="font-weight:700;font-size:16px;width:40px;text-align:right">x${n}</span>
        <span class="lil" style="font-size:18px;width:64px;text-align:right;color:#5B1FD6">+${fmt(pts)}</span>
      </div>`).join('')}
      <div style="display:flex;align-items:center;gap:10px;height:30px;border-top:3px dashed #C9B8F5;padding-top:6px">
        <svg width="34" height="24" viewBox="0 0 24 24" fill="#FF7A1A" stroke="#1A0B3D" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 L4 14 h7 l-2 8 9-12 h-7 z"/></svg>
        <span style="flex:1;font-weight:600;font-size:16px">Best combo</span>
        <span class="lil" style="font-size:18px;color:#B3006A">x${run.maxCombo}</span>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <label for="hk-name" style="font-weight:700;font-size:13px;letter-spacing:1px">NAME FOR THE LEADERBOARD</label>
      <div style="display:flex;gap:8px">
        <input id="hk-name" type="text" maxlength="16" placeholder="Your name" autocomplete="nickname" enterkeyhint="done" value="${esc(name)}" style="flex:1;min-width:0;height:48px;box-sizing:border-box;border:4px solid #1A0B3D;border-radius:14px;padding:0 12px;font-family:'Fredoka';font-weight:600;font-size:18px;color:#1A0B3D;background:#fff">
        <button id="saveBtn" type="button" class="btn" style="height:48px;padding:0 16px;border:4px solid #1A0B3D;border-radius:14px;background:#FFE14D;box-shadow:0 4px 0 #1A0B3D;font-family:'Lilita One';font-size:18px;color:#1A0B3D">SAVE</button>
      </div>
      <div id="saveMsg" style="font-weight:600;font-size:12px;min-height:14px;color:#5B1FD6"></div>
    </div>
    <button id="challengeBtn" type="button" class="btn" style="height:74px;flex:none;border:6px solid #1A0B3D;border-radius:26px;background:#FF2E93;box-shadow:0 8px 0 #1A0B3D,inset 0 -8px 0 #C4006B,inset 0 6px 0 rgba(255,255,255,.45);display:flex;align-items:center;justify-content:center;gap:12px;animation:pulseSm 1.3s ease-in-out infinite">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
      <span id="challengeLabel" class="ols lil" style="font-size:24px;white-space:nowrap;line-height:1;color:#fff">CHALLENGE A FRIEND</span>
    </button>
    <div style="display:flex;gap:10px">
      <button id="againBtn" class="btn big green" style="flex:1">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A0B3D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>PLAY AGAIN</button>
      <button id="overLbBtn" class="btn big cyan" aria-label="Leaderboard" style="width:60px">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A0B3D" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg></button>
    </div>
  </div>
  <div class="center abs" style="top:${challenge ? 66 : 74}px;animation:drop .6s cubic-bezier(.2,1.5,.4,1) both">
    <div style="transform:rotate(-5deg);background:#8B2CFF;border:6px solid #1A0B3D;border-radius:18px;box-shadow:0 7px 0 #1A0B3D;padding:8px 22px">
      <span class="ols lil" style="font-size:40px;line-height:1;color:#fff;letter-spacing:1px">OUT OF WORMS!</span>
    </div>
  </div>`;
  show('over');
  run.saved = false;
  $('#saveBtn').onclick = () => saveScore(run);
  $('#hk-name').onkeydown = (e) => { if (e.key === 'Enter') { e.target.blur(); saveScore(run); } };
  $('#challengeBtn').onclick = () => shareChallenge(run);
  $('#againBtn').onclick = play;
  $('#overLbBtn').onclick = () => showBoard('all', 'over');
}

async function saveScore(run) {
  if (run.saved) return run.savedResult;
  const name = ($('#hk-name') && $('#hk-name').value.trim()) || store.get('hooked.name', '') || 'Player';
  store.set('hooked.name', name);
  $('#saveBtn').textContent = '…';
  try {
    const res = await API.submitScore(name, { ...run, runId });
    run.saved = true; run.savedResult = res;
    $('#saveBtn').textContent = 'SAVED!';
    $('#saveMsg').textContent = res && res.rank ? `You're #${res.rank} on the leaderboard!` : '';
    return res;
  } catch (e) {
    $('#saveBtn').textContent = 'SAVE';
    $('#saveMsg').textContent = (e && e.message) || 'Could not save. Try again.';
    return null;
  }
}

async function shareChallenge(run) {
  const name = ($('#hk-name') && $('#hk-name').value.trim()) || store.get('hooked.name', '') || '';
  let url;
  try { url = API.createChallenge ? await API.createChallenge(name, run, runId) : null; } catch (e) { url = null; }
  if (!url) url = `${location.origin}${location.pathname}?beat=${run.score}&fish=${run.fish}${name ? '&from=' + encodeURIComponent(name) : ''}`;
  const text = `I caught ${run.fish} fish and scored ${fmt(run.score)} in Hooked! Beat me.`;
  const label = $('#challengeLabel');
  const done = (msg) => { label.textContent = msg; setTimeout(() => { if (label.isConnected) label.textContent = 'CHALLENGE A FRIEND'; }, 2200); };
  API.track('share', { score: run.score });
  if (navigator.share) {
    try { await navigator.share({ title: 'Hooked!', text, url }); done('SENT!'); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + ' ' + url); done('LINK COPIED!'); }
  catch (e) { prompt('Copy this link:', text + ' ' + url); }
}

// ------------------------------------------------------------ leaderboard (design screen 5)
let boardBack = 'title';
async function showBoard(kind = 'all', from) {
  if (from) boardBack = from;
  const el = $('#board');
  el.innerHTML = `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#FF4FA3 0%,#FF8A6B 20%,#19B8FF 38%,#6A2BEA 75%,#2B0A73 100%)"></div>
    <div class="center abs" style="top:400px"><div class="ol lil" style="font-size:30px;color:#fff">LOADING…</div></div>`;
  show('board');
  let d;
  try { d = await API.getLeaderboard(kind); } catch (e) { d = { entries: [], me: null, error: true }; }
  if (current !== 'board') return;
  const cols = ['#FF2E93', '#00E5FF', '#B6FF2E', '#FF7A1A', '#B98CFF', '#FFE14D'];
  const e = d.entries || [], me = d.me;
  const pod = (x, rank) => x ? `
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="position:relative;animation:lbbob ${2 + rank * 0.3}s ease-in-out infinite">
        ${rank === 1 ? `<svg width="40" height="30" viewBox="0 0 40 30" style="position:absolute;left:${(62 - 40) / 2}px;top:-24px" aria-hidden="true"><path d="M3 8 L12 16 L20 2 L28 16 L37 8 L33 28 L7 28 Z" fill="#FFE14D" stroke="#1A0B3D" stroke-width="3.5" stroke-linejoin="round"/></svg>` : ''}
        <div class="lil" style="width:${rank === 1 ? 62 : 52}px;height:${rank === 1 ? 62 : 52}px;border-radius:50%;background:${cols[(rank - 1) % 6]};border:5px solid #1A0B3D;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:26px">${esc((x.name || '?')[0].toUpperCase())}</div>
      </div>
      <div style="font-weight:700;font-size:14px;color:#fff;text-align:center;max-width:112px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 2px 0 #1A0B3D">${esc(x.name)}</div>
      <div style="width:100%;height:${rank === 1 ? 104 : rank === 2 ? 80 : 64}px;box-sizing:border-box;background:${rank === 1 ? '#FFE14D' : rank === 2 ? '#E6ECFF' : '#FFB36B'};border:5px solid #1A0B3D;border-radius:18px 18px 6px 6px;box-shadow:inset 0 -8px 0 rgba(26,11,61,.18);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
        <span class="ols lil" style="font-size:34px;line-height:1;color:#fff">${rank}</span>
        <span style="font-weight:700;font-size:15px">${fmt(x.score)}</span>
      </div>
    </div>` : '<div></div>';
  const isMe = (x) => x.me || (me && me.id && x.id === me.id);
  const rows = e.slice(3, 50).map((x, i) => {
    const mine = isMe(x);
    return `<div role="listitem" style="display:flex;align-items:center;gap:10px;min-height:46px;padding:0 10px;border-radius:14px;background:${mine ? '#FF2E93' : i % 2 ? '#F3EDFF' : '#fff'};color:${mine ? '#fff' : '#1A0B3D'};border:4px solid ${mine ? '#1A0B3D' : 'transparent'};box-sizing:border-box">
      <span class="lil" style="width:30px;font-size:18px;text-align:right">${x.rank}</span>
      <span class="lil" style="width:30px;height:30px;flex:none;border-radius:50%;background:${cols[x.rank % 6]};border:3px solid #1A0B3D;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:14px;color:#1A0B3D">${esc((x.name || '?')[0].toUpperCase())}</span>
      <span style="flex:1;min-width:0;font-weight:700;font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.name)}</span>
      <span style="font-weight:600;font-size:13px;opacity:.8">${x.fish} fish</span>
      <span class="lil" style="width:64px;font-size:18px;text-align:right">${fmt(x.score)}</span>
    </div>`;
  }).join('');
  const above = me && e.find((x) => x.rank === me.rank - 1);
  el.innerHTML = `
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,#FF4FA3 0%,#FF8A6B 20%,#19B8FF 38%,#6A2BEA 75%,#2B0A73 100%)"></div>
  <button id="lbBack" class="btn round-btn" aria-label="Back" style="left:14px;top:18px">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A0B3D" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg></button>
  <div class="abs" style="left:0;top:16px;width:390px;display:flex;flex-direction:column;align-items:center;gap:6px">
    <h1 class="ol lil" style="margin:0;font-size:42px;line-height:1;color:#FFE14D;pointer-events:none">LEADERBOARD</h1>
    <div class="tabs"><button data-k="all" class="${kind === 'all' ? 'on' : ''}">ALL-TIME</button><button data-k="daily" class="${kind === 'daily' ? 'on' : ''}">TODAY</button></div>
  </div>
  ${e.length ? `
  <div style="position:absolute;left:16px;top:112px;width:358px;height:226px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-items:end">${pod(e[1], 2)}${pod(e[0], 1)}${pod(e[2], 3)}</div>
  <div style="position:absolute;left:12px;top:346px;width:366px;height:380px;box-sizing:border-box;background:#fff;border:5px solid #1A0B3D;border-radius:24px;box-shadow:0 6px 0 #1A0B3D;overflow:hidden">
    <div class="lb" role="list" style="height:100%;overflow-y:auto;padding:8px;box-sizing:border-box;display:flex;flex-direction:column;gap:4px">${rows || '<div style="padding:20px;text-align:center;font-weight:600">Only the podium so far. Go fishing!</div>'}</div>
  </div>` : `<div class="center abs" style="top:380px"><div class="card" style="position:relative;padding:20px 26px;align-items:center;gap:6px"><div class="lil" style="font-size:26px">${d.error ? 'Offline' : 'No catches yet today'}</div><div style="font-weight:600">${d.error ? 'Could not reach the leaderboard.' : 'Be the first on the board!'}</div></div></div>`}
  <div style="position:absolute;left:12px;top:744px;width:366px;height:74px;box-sizing:border-box;background:#FF2E93;border-radius:22px;padding:0 10px 0 14px;display:flex;align-items:center;gap:10px;color:#fff;animation:shine 1.6s ease-in-out infinite">
    <div style="display:flex;flex-direction:column;align-items:center;line-height:1"><span style="font-weight:700;font-size:11px;letter-spacing:2px">YOU</span><span class="ols lil" style="font-size:30px">#${me ? me.rank : '-'}</span></div>
    <div style="flex:1;display:flex;flex-direction:column;line-height:1.15;min-width:0">
      <span style="font-weight:700;font-size:17px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(me ? me.name : store.get('hooked.name', '') || 'You')}</span>
      <span style="font-weight:600;font-size:13px">${me ? `${fmt(me.score)} pts${above ? ` · ${fmt(above.score - me.score)} to #${above.rank}` : ' · top of the pile!'}` : 'Save a score to get ranked'}</span>
    </div>
    <button id="climbBtn" class="btn" style="height:50px;padding:0 16px;box-sizing:border-box;border:4px solid #1A0B3D;border-radius:16px;background:#B6FF2E;box-shadow:0 4px 0 #1A0B3D;font-family:'Lilita One';font-size:20px;color:#1A0B3D">CLIMB</button>
  </div>`;
  $('#lbBack').onclick = () => { if (boardBack === 'over' && lastRun) show('over'); else { refreshTitle(); show('title'); } };
  $('#climbBtn').onclick = play;
  el.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => showBoard(b.dataset.k)));
}

// ------------------------------------------------------------ pause
function pause() { if (game.state === 'play') { game.pause(); $('#pause').hidden = false; } }
$('#pauseBtn').onclick = pause;
$('#resumeBtn').onclick = () => { $('#pause').hidden = true; game.resume(); };
$('#quitBtn').onclick = () => { $('#pause').hidden = true; game.quit(); refreshTitle(); show('title'); };
const muteLabel = () => ($('#muteBtn').textContent = sfx.muted ? 'SOUND OFF' : 'SOUND ON');
$('#muteBtn').onclick = () => { sfx.toggle(); muteLabel(); };
muteLabel();
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

$('#playBtn').onclick = play;
$('#lbBtn').onclick = () => showBoard('all', 'title');

// ------------------------------------------------------------ boot
(async function boot() {
  decorateTitle();
  await Promise.all([
    loadSprites(),
    document.fonts ? Promise.all([document.fonts.load("40px 'Lilita One'"), document.fonts.load("700 12px 'Fredoka'")]).catch(() => {}) : null,
  ]);
  game = new Game($('#cv'), hooks);
  window.__hooked = { game, API };
  await refreshTitle();
  await loadChallenge();
  $('#loading').remove();
})();
