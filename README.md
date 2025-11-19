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
- 2024-xx-xx: Replaced starter page with interactive UI (dice tray with holds, roll controls, scorecard selection, player totals); added Framer Motion for animations.

## Near-Term Plan
- Build a Yahtzee rules/score engine with tests.
- Create UI for rolling/holding dice, selecting score categories, and passing the turn.
- Add a simple leaderboard + API routes (likely Vercel Postgres).
- Apply playful/anime-inspired theme with smooth Framer Motion animations; add sound toggle.
- Gate staging site behind a simple password during development.

## GitHub / Deployment
- Remote: `git@github.com:michael-bruzzese/yahtzee-practice.git` (main).
- Deployment target: Vercel (free, vercel.app URL). Password gate will live in Next.js middleware using an env var.
