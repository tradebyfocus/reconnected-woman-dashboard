# The Reconnected Woman — Analytics Dashboard

Kelly Mitchell's personal analytics dashboard. Single-page, single-user, read-only.
Pulls live data from **Google Analytics 4** and **Google Search Console** on each load.

## Tech

- Next.js 16 (App Router), TypeScript strict
- Vanilla CSS, no Tailwind, no chart libraries (hand-rolled SVG)
- Google Analytics Data API v1 (`@google-analytics/data`)
- Google Search Console API (`googleapis`)
- Password-gated via HttpOnly signed cookie (`rw-auth`, 30-day session)

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

## Environment variables

See `.env.example`. All six must be set in Vercel before the dashboard will work.

## Deploy

Push to `main` → Vercel auto-deploys.
