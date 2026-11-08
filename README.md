# Hooked! · Ice Fishing Frenzy

Mobile web game built on the Claude Design screens.

- `src/config.js`: every tuning number (speeds, spawn rates, points, boss, difficulty ramp)
- `src/game.js`: canvas game loop · `src/main.js`: screens · `src/api.js`: backend calls
- `supabase/`: database migration + `hooked` edge function (score validation, leaderboards, daily challenge)

Dev: `npm run dev` then open http://localhost:5173 (add `?offline` to skip the backend).
Deploy: Cloudflare Pages (free) builds with `npm run build` into `dist/` (see `wrangler.toml`). Every push to `main` deploys.
