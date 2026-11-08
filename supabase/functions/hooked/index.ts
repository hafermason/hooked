// Hooked! game API (Supabase Edge Function).
// POST JSON { action, device, ... }  ->  JSON
//   daily        -> today's challenge
//   start        -> { runId }               (server clock starts the run)
//   submit       -> { rank, best }          (validates the run, then records it)
//   leaderboard  -> { entries, me }          (board: 'all' | 'daily')
// All tables live in the private `hooked` schema; clients never write to them directly.
import postgres from 'npm:postgres@3.4.4';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 3 });

// Must mirror src/config.js. Server is the source of truth for what a score may be.
const RULES = {
  base: { common: 10, rare: 50, legendary: 200, king: 500 } as Record<string, number>,
  maxCombo: 10,
  bossEvery: 30,
  dailyMult: 2,
  shooPoints: 10,
  canBonus: 100,
  // Fish can't be caught faster than they spawn: at most `fishOnScreen` already swimming,
  // plus one new fish every `minSpawnGap` seconds (config.fish.spawnEvery min x 0.7 jitter), plus a little slack for escapes.
  fishOnScreen: 7,
  minSpawnGap: 0.42,
  slackFish: 4,
  clockSlack: 4,          // seconds of network slack between server clock and claimed duration
  maxRunSeconds: 3 * 3600,
  startsPer10Min: 40,
};

const DAILIES = [
  { code: 'rare3', title: 'Catch 3 shiny fish' },
  { code: 'combo6', title: 'Hit a x6 combo' },
  { code: 'legend1', title: 'Land a legendary' },
  { code: 'fish20', title: 'Catch 20 fish' },
  { code: 'crab2', title: 'Shoo 2 crabs' },
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

const today = () => new Date().toISOString().slice(0, 10);

async function sha256(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hooked:' + s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
}

const BLOCK = /(fuck|shit|cunt|nigg|fag|bitch|whore|rape|nazi|hitler)/i;
function cleanName(raw: unknown) {
  const ok = (ch: string) => { const c = ch.codePointAt(0) || 0; return c >= 32 && !(c >= 127 && c <= 159) && !(c >= 0x200b && c <= 0x200f) && !(c >= 0x2028 && c <= 0x202e); };
  let n = Array.from(String(raw ?? '').normalize('NFKC')).filter(ok).join('').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (!n || BLOCK.test(n.replace(/[^a-z]/gi, ''))) n = 'Angler' + Math.floor(Math.random() * 900 + 100);
  return n;
}

async function playerFor(device: unknown) {
  if (typeof device !== 'string' || device.length < 16 || device.length > 80) throw new HttpError(400, 'bad device id');
  const h = await sha256(device);
  const [p] = await sql`
    insert into hooked.players (device_hash) values (${h})
    on conflict (device_hash) do update set last_seen_at = now()
    returning id, nickname, flagged`;
  return p;
}

async function daily() {
  const d = today();
  let [row] = await sql`select code, title, reward, multiplier from hooked.daily_challenge where day = ${d}`;
  if (!row) {
    const pick = DAILIES[Math.floor(Date.parse(d) / 86400000) % DAILIES.length];
    [row] = await sql`
      insert into hooked.daily_challenge (day, code, title) values (${d}, ${pick.code}, ${pick.title})
      on conflict (day) do update set day = excluded.day
      returning code, title, reward, multiplier`;
  }
  const ms = Date.parse(d + 'T00:00:00Z') + 86400000 - Date.now();
  return { id: row.code, title: row.title, reward: row.reward, multiplier: row.multiplier, endsIn: `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m` };
}

// ---------------------------------------------------------------- validation
type Catch = { t: number; type: string; combo: number; mult: number; pts: number };
type Run = { score: number; fish: number; duration: number; maxCombo: number; shooed: number; cans: number; canBonus?: number; counts: Record<string, number>; catches: Catch[]; dailyDone?: boolean };

const maxLandings = (seconds: number) => RULES.fishOnScreen + RULES.slackFish + Math.floor(seconds / RULES.minSpawnGap);

export function maxScoreFor(seconds: number) {
  // Absolute ceiling for a run of this length: every possible landing is a legendary at max combo with the
  // daily bonus, every 30th is a Rainbow King, plus a shoo/can bonus every couple of seconds.
  const landings = maxLandings(seconds);
  const kings = Math.floor(landings / (RULES.bossEvery + 1));
  const top = RULES.maxCombo * RULES.dailyMult;
  return (landings - kings) * RULES.base.legendary * top + kings * RULES.base.king * top
    + Math.ceil(seconds / 2) * Math.max(RULES.shooPoints, RULES.canBonus);
}

function validate(run: Run, serverSeconds: number, dailyCode: string): string | null {
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  if (!run || !Array.isArray(run.catches)) return 'malformed run';
  for (const k of ['score', 'fish', 'duration', 'maxCombo', 'shooed', 'cans'] as const) if (!num(run[k]) || run[k] < 0) return 'malformed ' + k;
  if (run.catches.length > maxLandings(run.duration)) return 'more catches than fish could spawn';
  // sliding window: no burst of catches faster than fish could appear
  for (let i = 0, j = 0; i < run.catches.length; i++) {
    while (run.catches[i].t - run.catches[j].t > 5) j++;
    if (i - j + 1 > maxLandings(5)) return 'catch burst faster than fish can spawn';
  }
  const d = run.duration;
  if (d > serverSeconds + RULES.clockSlack) return `run claims ${d.toFixed(1)}s but only ${serverSeconds.toFixed(1)}s passed`;
  if (run.score > maxScoreFor(d)) return 'score above the maximum possible for the run length';

  let prevT = -Infinity, prevCombo = 0, prevMult = 1, sum = 0, fish = 0, kings = 0, best = 1;
  const counts: Record<string, number> = { common: 0, rare: 0, legendary: 0, king: 0 };
  let dailyMet = dailyCode === 'crab2' && run.shooed >= 2;
  for (const c of run.catches) {
    if (!num(c.t) || !num(c.combo) || !num(c.mult) || !num(c.pts)) return 'malformed catch';
    if (!(c.type in RULES.base)) return 'unknown fish type';
    if (c.t < 0 || c.t > d + 0.5) return 'catch outside the run';
    if (c.t < prevT) return 'catches out of order';
    if (!Number.isInteger(c.combo) || c.combo < 1 || c.combo > RULES.maxCombo || c.combo > prevCombo + 1) return 'impossible combo';
    if (c.mult !== 1 && c.mult !== RULES.dailyMult) return 'bad multiplier';
    if (c.mult < prevMult) return 'multiplier went backwards';
    if (c.mult > 1 && !dailyMet) return 'daily bonus before the daily was completed';
    if (c.type === 'king') { kings++; if (kings > Math.floor(fish / RULES.bossEvery)) return 'Rainbow King before 30 fish'; }
    else fish++;
    if (c.pts !== RULES.base[c.type] * c.combo * c.mult) return 'catch points do not add up';
    counts[c.type]++;
    sum += c.pts;
    best = Math.max(best, Math.min(RULES.maxCombo, c.combo + 1));
    prevT = c.t; prevCombo = c.combo; prevMult = c.mult;
    // daily progress after this catch (shoo-based dailies are checked from the totals)
    if (!dailyMet) {
      dailyMet = (dailyCode === 'rare3' && counts.rare >= 3) || (dailyCode === 'legend1' && counts.legendary >= 1)
        || (dailyCode === 'fish20' && fish >= 20) || (dailyCode === 'combo6' && best >= 6)
        || (dailyCode === 'crab2' && run.shooed >= 2);
    }
  }
  if (dailyCode === 'crab2' && run.shooed >= 2) dailyMet = true;
  if (fish !== run.fish) return 'fish count mismatch';
  if (run.shooed > d / 2 + 2) return 'too many crabs shooed';
  if (run.cans > d / 6 + 2) return 'too many cans';
  const extra = run.score - sum - run.shooed * RULES.shooPoints;
  if (extra < 0 || extra % RULES.canBonus !== 0 || extra / RULES.canBonus > run.cans) return 'score does not match the catches';
  if (run.maxCombo > best) return 'max combo higher than any combo reached';
  return null;
}

// ---------------------------------------------------------------- actions
async function start(device: unknown) {
  const p = await playerFor(device);
  const [{ n }] = await sql`select count(*)::int as n from hooked.runs where player_id = ${p.id} and started_at > now() - interval '10 minutes'`;
  if (n >= RULES.startsPer10Min) throw new HttpError(429, 'slow down');
  const [r] = await sql`insert into hooked.runs (player_id) values (${p.id}) returning id`;
  return { runId: r.id };
}

async function submit(device: unknown, body: any) {
  const p = await playerFor(device);
  const runId = String(body.runId || '');
  if (!/^[0-9a-f-]{36}$/i.test(runId)) throw new HttpError(400, 'missing run');
  const run: Run = body.run;
  const name = cleanName(body.name);

  return await sql.begin(async (tx) => {
    const [r] = await tx`select id, player_id, status, extract(epoch from now() - started_at)::float as secs from hooked.runs where id = ${runId} for update`;
    if (!r || r.player_id !== p.id) throw new HttpError(404, 'run not found');
    if (r.status === 'submitted') throw new HttpError(409, 'score already saved');
    if (r.secs > RULES.maxRunSeconds) throw new HttpError(410, 'run expired');
    const [dc] = await tx`select code from hooked.daily_challenge where day = (select (started_at at time zone 'utc')::date from hooked.runs where id = ${runId})`;
    const why = validate(run, r.secs, dc ? dc.code : '');
    if (why) {
      await tx`update hooked.runs set status = 'rejected', reject_reason = ${why}, finished_at = now() where id = ${runId}`;
      return { rejected: why };
    }
    await tx`update hooked.runs set status = 'submitted', finished_at = now() where id = ${runId}`;
    await tx`update hooked.players set nickname = ${name} where id = ${p.id}`;
    const counts = { common: run.counts?.common | 0, rare: run.counts?.rare | 0, legendary: run.counts?.legendary | 0, king: run.counts?.king | 0 };
    const [s] = await tx`
      insert into hooked.scores (run_id, player_id, nickname, score, fish, duration_s, max_combo, counts, daily_done)
      values (${runId}, ${p.id}, ${name}, ${run.score}, ${run.fish}, ${run.duration}, ${run.maxCombo}, ${tx.json(counts)}, ${!!run.dailyDone})
      returning id`;
    for (const [board, period] of [['all', 'all'], ['daily', today()]]) {
      await tx`
        insert into hooked.leaderboards (board, period, player_id, nickname, score, fish, score_id)
        values (${board}, ${period}, ${p.id}, ${name}, ${run.score}, ${run.fish}, ${s.id})
        on conflict (board, period, player_id) do update set
          nickname = excluded.nickname,
          score    = greatest(hooked.leaderboards.score, excluded.score),
          fish     = case when excluded.score > hooked.leaderboards.score then excluded.fish else hooked.leaderboards.fish end,
          score_id = case when excluded.score > hooked.leaderboards.score then excluded.score_id else hooked.leaderboards.score_id end,
          updated_at = case when excluded.score > hooked.leaderboards.score then now() else hooked.leaderboards.updated_at end`;
    }
    const [mine] = await tx`select score from hooked.leaderboards where board = 'all' and period = 'all' and player_id = ${p.id}`;
    const [{ rank }] = await tx`select count(*)::int + 1 as rank from hooked.leaderboards where board = 'all' and period = 'all' and score > ${mine.score}`;
    return { rank, best: mine.score };
  }).then((res: any) => {
    if (res && res.rejected) throw new HttpError(422, 'Score rejected: ' + res.rejected);
    return res;
  });
}

async function leaderboard(device: unknown, board: string) {
  const b = board === 'daily' ? 'daily' : 'all';
  const period = b === 'daily' ? today() : 'all';
  const p = typeof device === 'string' && device.length >= 16 ? await playerFor(device) : null;
  const rows = await sql`
    select player_id, nickname, score, fish,
           rank() over (order by score desc)::int as rank
    from hooked.leaderboards where board = ${b} and period = ${period}
    order by score desc, updated_at asc limit 50`;
  const entries = rows.map((r) => ({ rank: r.rank, name: r.nickname, score: r.score, fish: r.fish, me: !!p && r.player_id === p.id }));
  let me = entries.find((e) => e.me) || null;
  if (!me && p) {
    const [m] = await sql`select nickname, score, fish from hooked.leaderboards where board = ${b} and period = ${period} and player_id = ${p.id}`;
    if (m) {
      const [{ rank }] = await sql`select count(*)::int + 1 as rank from hooked.leaderboards where board = ${b} and period = ${period} and score > ${m.score}`;
      me = { rank, name: m.nickname, score: m.score, fish: m.fish, me: true };
    }
  }
  return { entries, me };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    switch (body.action) {
      case 'daily': return json(await daily());
      case 'start': return json(await start(body.device));
      case 'submit': return json(await submit(body.device, body));
      case 'leaderboard': return json(await leaderboard(body.device, body.board));
      default: return json({ error: 'unknown action' }, 400);
    }
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: 'server error' }, 500);
  }
});
