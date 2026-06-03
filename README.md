# Americano Padel

Run an Americano padel tournament from start to finish: create an event, add players, auto-generate rounds, enter scores, and share live standings.

## Features

- Create tournament (fixed scoring to 24 points, or timed matches)
- 4–16 players (multiples of 4)
- Automatic round pairing with partner/opponent rotation
- Auto- or manual-advance to the next round
- Optional 4-digit organizer PIN
- Shareable public and manage links
- Live leaderboard with polling

## Setup

### 1. Database (Neon recommended)

Create a PostgreSQL database on [Neon](https://neon.tech) (or Vercel Postgres) and copy the connection string.

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://..."
```

### 3. Install and migrate

```bash
npm install
npx prisma db push
```

For production migrations, use `npm run db:migrate` instead.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Create a PostgreSQL database (Neon or Vercel Postgres) and add `DATABASE_URL` in project environment variables (use the pooled connection string with `?sslmode=require` for Neon).
4. Deploy. The build runs `prisma migrate deploy` automatically to create tables.

If you already created tables with `prisma db push`, mark the initial migration as applied once:

```bash
npx prisma migrate resolve --applied 20250603000000_init
```

## Organizer flow

1. **Create** — name, rounds, scoring mode, courts, optional PIN.
2. **Players** — add 4, 8, 12, or 16 players; **Start tournament**.
3. **Scores** — tap each match on the manage page; enter team points.
4. **Rounds** — next round generates automatically when all scores are in (if enabled), or use **Generate round N**.
5. **End** — freeze results and open the final standings page.

## Links

| Link | Who |
|------|-----|
| `/t/[id]` | Players — live standings (read-only) |
| `/t/[id]/manage` | Organizer — scores, rounds, end tournament |
| `/t/[id]/final` | Everyone — final results after end |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:push` | Sync schema to database |
| `npm run db:studio` | Prisma Studio |
