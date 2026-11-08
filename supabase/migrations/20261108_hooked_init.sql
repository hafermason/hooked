-- Hooked! backend. Lives in its own schema so it never touches other app tables.
-- The schema is NOT exposed through the REST API; only the `hooked` edge function
-- (server side, table owner) reads and writes it. RLS is enabled on every table
-- with read-only policies for public data, so even if the schema were exposed,
-- clients could never write scores directly.
create schema if not exists hooked;
revoke all on schema hooked from public, anon, authenticated;

create table hooked.players (
  id            uuid primary key default gen_random_uuid(),
  device_hash   text not null unique,              -- sha256 of a random id stored on the phone (anonymous play)
  nickname      text check (char_length(nickname) between 1 and 16),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  flagged       boolean not null default false     -- set when submissions keep failing validation
);

-- One row per started game; the server clock decides how long a run really lasted.
create table hooked.runs (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references hooked.players(id) on delete cascade,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  status        text not null default 'started' check (status in ('started','submitted','rejected')),
  reject_reason text
);
create index on hooked.runs (player_id, started_at desc);

create table hooked.scores (
  id          bigint generated always as identity primary key,
  run_id      uuid not null unique references hooked.runs(id) on delete cascade,
  player_id   uuid not null references hooked.players(id) on delete cascade,
  nickname    text not null,
  score       integer not null check (score >= 0),
  fish        integer not null check (fish >= 0),
  duration_s  numeric(8,2) not null,
  max_combo   integer not null,
  counts      jsonb not null default '{}'::jsonb,
  daily_done  boolean not null default false,
  day         date not null default (now() at time zone 'utc')::date,
  created_at  timestamptz not null default now()
);
create index on hooked.scores (score desc);

-- Best score per player per board/period. board='all' (period 'all') or board='daily' (period = UTC date).
create table hooked.leaderboards (
  board       text not null check (board in ('all','daily')),
  period      text not null,
  player_id   uuid not null references hooked.players(id) on delete cascade,
  nickname    text not null,
  score       integer not null,
  fish        integer not null,
  score_id    bigint references hooked.scores(id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (board, period, player_id)
);
create index on hooked.leaderboards (board, period, score desc, updated_at);

create table hooked.daily_challenge (
  day         date primary key,
  code        text not null,
  title       text not null,
  reward      text not null default 'x2 score',
  multiplier  integer not null default 2
);

alter table hooked.players         enable row level security;
alter table hooked.runs            enable row level security;
alter table hooked.scores          enable row level security;
alter table hooked.leaderboards    enable row level security;
alter table hooked.daily_challenge enable row level security;

-- Public, read-only data. No insert/update/delete policies exist for anon/authenticated
-- on any table, so all writes are denied to clients.
create policy "leaderboards are public" on hooked.leaderboards for select to anon, authenticated using (true);
create policy "daily challenge is public" on hooked.daily_challenge for select to anon, authenticated using (true);
-- players / runs / scores: no policies at all = no client access.
