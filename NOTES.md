# Working Notes

Keep this file updated at the end of each session so future work has context.

## Current status (2025-02-10)
- Dev server: works, but the sandbox blocks binding to localhost ports (`listen EPERM`). Run `npm run dev -- --hostname 127.0.0.1 --port 3000` outside the sandbox or with elevated permissions.
- Tests: `npm test` (Vitest). Do not pass `--runInBand`; Vitest does not support that flag.
- Leaderboard persistence: wired to Neon Postgres (`POSTGRES_URL` in `.env.local`). Verified by hitting `/api/scores` (GET and POST) while `next dev` was running; rows persisted and read back successfully.
- UX: Added player-edit modal (restarts game with personalized names) and a pass-to-next-player overlay that locks controls until the next player acknowledges.
- Visuals/flow: Avatars refreshed with richer art (bigger smiles, sharper colors), table stays on the left, and the scoring column (scorecard + leaderboard) now lives on the right so players can log scores without scrolling.
- Audio/UX: Dice rolls now trigger a subtle “clackity clack” effect, Yahtzees fire applause, and the auto-pass overlay returns right after scoring so turns advance smoothly.
- Leaderboard: auto-submits at game completion—no button required—and refreshes immediately when a round ends.
- Pending: capture polish ideas (better animation timing, richer dice physics/audio, art refinements) as they arise.

## TODO / Next steps
- Add new items here with bullet points and dates as you work (e.g., player renaming UI, onboarding tips, etc.).

## How to use this log
- Add a short entry when you stop: what you touched, what broke, what to do next, and any env/command quirks.
- If you file GitHub issues, cross-link them here for quick pickup.
