// Backend hooks the design calls. Step 1: local (on-device) implementation.
// Step 2 swaps these for Supabase; the game code does not change.

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
export { store };

export const DAILIES = [
  { id: 'rare3',   title: 'Catch 3 shiny fish', reward: 'x2 score', test: (r) => r.counts.rare >= 3 },
  { id: 'combo6',  title: 'Hit a x6 combo',     reward: 'x2 score', test: (r) => r.maxCombo >= 6 },
  { id: 'legend1', title: 'Land a legendary',   reward: 'x2 score', test: (r) => r.counts.legendary >= 1 },
  { id: 'fish20',  title: 'Catch 20 fish',      reward: 'x2 score', test: (r) => r.fish >= 20 },
  { id: 'crab2',   title: 'Shoo 2 crabs',       reward: 'x2 score', test: (r) => r.shooed >= 2 },
];

function endsIn() {
  const now = new Date();
  const mid = new Date(now); mid.setUTCHours(24, 0, 0, 0);
  const ms = mid - now;
  return Math.floor(ms / 3600000) + 'h ' + Math.floor((ms % 3600000) / 60000) + 'm';
}

const MOCK_NAMES = ['ReelOtter', 'BubblyTrout', 'SaltyGuppy', 'TurboPike', 'FrostySquid', 'LuckyWalrus', 'NeonMinnow', 'SneakyBass', 'MegaPuffer', 'WigglyCarp'];

export const LocalAPI = {
  async startGame() {
    return { runId: 'local-' + Date.now() };
  },
  async getDailyChallenge() {
    const day = Math.floor(Date.now() / 86400000);
    const d = DAILIES[day % DAILIES.length];
    return { id: d.id, title: d.title, reward: d.reward, endsIn: endsIn() };
  },
  async submitScore(name, run) {
    const list = store.get('hooked.scores', []);
    list.push({ name, score: run.score, fish: run.fish, at: Date.now() });
    store.set('hooked.scores', list.slice(-200));
    const lb = await this.getLeaderboard('all');
    return { rank: lb.me ? lb.me.rank : null };
  },
  async getLeaderboard(kind = 'all') {
    const mine = store.get('hooked.scores', []);
    const since = kind === 'daily' ? Date.now() - 86400000 : 0;
    const seeds = MOCK_NAMES.map((n, i) => ({ name: n, score: 2400 - i * 190, fish: 60 - i * 4, mock: true }));
    const all = seeds.concat(mine.filter((m) => m.at >= since).map((m) => ({ ...m, me: true })))
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));
    const me = all.find((e) => e.me) || null;
    return { entries: all.slice(0, 50), me };
  },
  track() {},
};

export let API = LocalAPI;
export function setAPI(a) { API = a; }

// ------------------------------------------------------------------ Supabase backend
// Publishable key: safe to ship in the browser. All writes go through the `hooked` edge function,
// which validates every run server-side; the database tables are private.
export const BACKEND = {
  url: 'https://gbdluiufwjdutslyljkw.supabase.co/functions/v1/hooked',
  key: 'sb_publishable_vYeqtms6tqclS2xm4evZSA_BudmJvbz',
};

function deviceId() {
  let id = store.get('hooked.device', null);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
    store.set('hooked.device', id);
  }
  return id;
}

async function call(action, extra = {}, timeoutMs = 8000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(BACKEND.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: BACKEND.key },
      body: JSON.stringify({ action, device: deviceId(), ...extra }),
      signal: ctl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || 'Server error'); e.status = res.status; throw e; }
    return data;
  } finally { clearTimeout(timer); }
}

// Where did this visit come from? ?src=tiktok etc. Remembered for the session so challenges carry it.
export function visitSource() {
  const m = /[?&]src=([a-z0-9_-]{1,20})/i.exec(location.search);
  let src = m ? m[1].toLowerCase() : null;
  if (!src && location.pathname.startsWith('/c/')) src = 'challenge';
  if (src) { try { sessionStorage.setItem('hooked.src', src); } catch (e) {} return src; }
  try { return sessionStorage.getItem('hooked.src'); } catch (e) { return null; }
}

function deviceKind() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows|Macintosh|Linux|CrOS/.test(ua)) return 'desktop';
  return 'other';
}

// ---- analytics: small batched queue, flushed every couple of seconds and when the page is hidden
const trackCtx = { code: null };
export function setTrackContext(c) { Object.assign(trackCtx, c); }
let queue = [], flushTimer = null;
function flush() {
  clearTimeout(flushTimer); flushTimer = null;
  if (!queue.length) return;
  const events = queue.splice(0, 25);
  try {
    fetch(BACKEND.url, {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: BACKEND.key },
      body: JSON.stringify({ action: 'track', device: deviceId(), events }),
    }).catch(() => {});
  } catch (e) {}
  if (queue.length) flushTimer = setTimeout(flush, 500);
}
function remoteTrack(name, meta = {}) {
  queue.push({ name, src: visitSource() || undefined, code: trackCtx.code || undefined, device: deviceKind(), meta });
  if (name === 'finish' || name === 'share' || queue.length >= 10) flush();
  else if (!flushTimer) flushTimer = setTimeout(flush, 2000);
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
}

export const RemoteAPI = {
  async startGame(challengeCode) {
    try { return await call('start', { challenge: challengeCode || undefined }, 4000); }
    catch (e) { return LocalAPI.startGame(); } // offline: play anyway, score stays on the device
  },
  async getDailyChallenge() {
    try { return await call('daily', {}, 4000); } catch (e) { return LocalAPI.getDailyChallenge(); }
  },
  async submitScore(name, run) {
    if (!run.runId || String(run.runId).startsWith('local-')) {
      await LocalAPI.submitScore(name, run);
      throw new Error('Offline: score saved on this phone only.');
    }
    const { runId, ...clean } = run;
    const payload = { score: clean.score, fish: clean.fish, duration: +clean.duration.toFixed(2), maxCombo: clean.maxCombo, shooed: clean.shooed, cans: clean.cans, counts: clean.counts, catches: clean.catches, dailyDone: clean.dailyDone };
    return call('submit', { runId, name, run: payload });
  },
  async getLeaderboard(kind = 'all') {
    return call('leaderboard', { board: kind });
  },
  // Returns a share URL for a saved run: https://<site>/c/ABC2345
  async createChallenge(name, run, runId) {
    const c = await call('challenge', { runId, src: visitSource() || undefined });
    return { url: `${location.origin}/c/${c.code}`, code: c.code };
  },
  async getChallenge(code) {
    return call('getChallenge', { code }, 5000);
  },
  track(name, meta) { return remoteTrack(name, meta); },
};

// Use the real backend unless ?offline is in the URL.
if (!/[?&]offline\b/.test(location.search)) API = RemoteAPI;
