# Yahtzee (playful web)

Pass-and-play Yahtzee for up to two players with playful visuals, smooth dice animations, and a simple score/leaderboard. Built iteratively as a learning project.

## Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS for styling
- ESLint for linting

## Getting Started (local)
```bash
npm install       # if you haven’t yet
npm run dev       # start dev server
```
Then open http://localhost:3000.

## Scripts
- `npm run dev` – run locally
- `npm run lint` – lint the project
- `npm test` – run rule-engine tests (Vitest)
- `npm run build` / `npm start` – production build/serve

## Project Log (for Michael/Navarre)
- 2024-xx-xx: Scaffolded Next.js + TS + Tailwind app; git initialized (main); linked to GitHub `yahtzee-practice`.
- 2024-xx-xx: Added Yahtzee rules/score engine with pure functions and tests (Vitest); basic game state transitions (roll/hold/select).
- 2024-xx-xx: Replaced starter page with interactive UI (dice tray with holds, roll controls, scorecard selection, player totals), added Framer Motion + sound toggle; added leaderboard endpoints and password gate.

## Near-Term Plan
- Hook leaderboard UI to real persistence (Vercel Postgres) via env vars.
- Add basic onboarding tooltip and richer animations/sounds as desired.
- Deploy to Vercel with password gate turned on (`APP_PASSWORD`).

## GitHub / Deployment
- Remote: `git@github.com:michael-bruzzese/yahtzee-practice.git` (main).
- Deployment target: Vercel (free, vercel.app URL). Password gate runs in `src/proxy.ts` using an env var.

## Password Gate (staging)
- Set `APP_PASSWORD` in env (e.g., Vercel env vars or `.env.local`) to require Basic Auth. Without it, the site is open.
- When set, the browser will prompt for a password (username is `user`, password is `APP_PASSWORD`). Implemented in `src/proxy.ts`.

## Leaderboard Persistence
- API routes: `GET /api/scores` (top 20), `POST /api/scores` with `{ players: [{ name, score }] }`.
- DB: configure `POSTGRES_URL` (or `DATABASE_URL`) to use Postgres (e.g., Vercel Postgres). Table auto-creates: `leaderboard (id serial, name text, score int, created_at timestamptz)`.
- Without a DB connection string, the app falls back to in-memory scores (resets on restart).
