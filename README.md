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
- `npm run build` / `npm start` – production build/serve

## Project Log (for Michael/Navarre)
- 2024-xx-xx: Scaffolded Next.js + TS + Tailwind app; git initialized (main).

## Near-Term Plan
- Build a Yahtzee rules/score engine with tests.
- Create UI for rolling/holding dice, selecting score categories, and passing the turn.
- Add a simple leaderboard + API routes (likely Vercel Postgres).
- Apply playful/anime-inspired theme with smooth Framer Motion animations; add sound toggle.
- Gate staging site behind a simple password during development.

## GitHub / Deployment
- Repo not yet connected to GitHub; add a remote and push when ready (e.g., `git remote add origin git@github.com:<your-account>/yahtzee.git && git push -u origin main`).
- Deployment target: Vercel (free, vercel.app URL). Password gate will live in Next.js middleware using an env var.
