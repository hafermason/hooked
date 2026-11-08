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
