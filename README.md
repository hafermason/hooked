# Hooked! · Ice Fishing Frenzy

Mobile web game built on the Claude Design screens.

- `src/config.js`: every tuning number (speeds, spawn rates, points, boss, difficulty ramp)
- `src/game.js`: canvas game loop · `src/main.js`: screens · `src/api.js`: backend calls
- `supabase/`: database migration + `hooked` edge function (score validation, leaderboards, daily challenge)

Dev: `npm run dev` then open http://localhost:5173 (add `?offline` to skip the backend).
Deploy: `npm run deploy` builds `dist/` and uploads the Cloudflare Worker in `worker/` (free plan). Live at https://hooked.hafermason.workers.dev

## Publishing to the App Store and Google Play

The game is wrapped as native apps with Capacitor (`ios/`, `android/`, `capacitor.config.json`).
Builds run in the cloud on Codemagic (`codemagic.yaml`), so no Mac is needed.

- `npm run build && npx cap sync`: copy the latest game into both native projects
- `node tools/make-art.mjs && npx capacitor-assets generate ...`: regenerate icon + splash from the game art
- Codemagic workflows: **ios-testflight** (uploads to TestFlight), **android-play** (uploads to Google Play internal testing)
- Store pages: https://hooked.hafermason.workers.dev/privacy and /support
- The Android upload keystore is NOT in this repo (kept by the owner, uploaded to Codemagic as `hooked_upload_key`).
