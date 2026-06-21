# CostYou — Restaurant Costing

Cost your menu with confidence. CostYou lets restaurant owners track ingredient
pack costs and wastage, build recipes (including nested sub-recipes), and compute
per–menu-item cost, profit margin, and portion cost in real time.

Built with **Next.js 15 (App Router)**, **Prisma + PostgreSQL (Supabase)**,
**NextAuth**, and **Tailwind CSS + shadcn/ui**.

## Features

- **Multi-tenant accounts** — email/password auth via NextAuth; every restaurant,
  ingredient, recipe, and menu item is scoped to the signed-in user.
- **Ingredients** — pack quantity, unit, pack cost, and wastage %.
- **Recipes** — composed of ingredients and other recipes (sub-recipes), with
  yield quantity/unit and process-loss %.
- **Menu items** — a sellable item built on a recipe plus optional extra lines.
- **Costing engine** — recursive recipe costing with cycle detection, memoization,
  unit conversion (mass/volume/count), wastage, and process loss.
- **Profit analysis** — cost per yield unit, profit margin, margin %, and portion cost.

## Tech stack

| Layer    | Choice                                            |
| -------- | ------------------------------------------------- |
| Framework| Next.js 15 (App Router, Turbopack)                |
| Database | PostgreSQL (Supabase) via Prisma ORM              |
| Auth     | NextAuth (Credentials provider, JWT sessions)     |
| UI       | Tailwind CSS v4, shadcn/ui, Radix, lucide-react   |
| Tests    | Vitest                                            |

## Getting started

### 1. Prerequisites

- Node.js 18.18+ (20+ recommended)
- A PostgreSQL database — a free [Supabase](https://supabase.com) project works well.

### 2. Install

```bash
npm install
```

### 3. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

- `DATABASE_URL` — pooled connection string (Supabase PgBouncer, port 6543), used at runtime.
- `DIRECT_URL` — direct connection (port 5432), used for migrations & seeding.
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`.
- `NEXTAUTH_URL` — `http://localhost:3000` locally; your deployed URL in production.

### 4. Set up the database

```bash
npx prisma generate          # generate the Prisma client
npx prisma db push           # create tables from prisma/schema.prisma
npm run seed                 # optional: seed demo data
```

The seed creates a demo account you can sign in with:

- **Email:** `demo@example.com`
- **Password:** `demo12345`

> `npm run seed` runs `prisma db seed` (configured in `package.json`). If you
> prefer, run `npx prisma db seed` directly.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account (or use the
demo login), and head to the dashboard.

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the dev server                 |
| `npm run build`    | Production build                     |
| `npm run start`    | Start the production server          |
| `npm run lint`     | Lint with ESLint                     |
| `npm run test`     | Run unit tests (Vitest)              |
| `npm run test:watch` | Run tests in watch mode            |

## Testing

The costing engine is covered by unit tests:

```bash
npm run test
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repo into [Vercel](https://vercel.com/new).
3. Add the environment variables from `.env.example`
   (`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) in the
   Vercel project settings. Set `NEXTAUTH_URL` to your production URL.
4. Deploy. `prisma generate` runs automatically via the `postinstall` script.
5. Apply the schema to your production database once:
   `npx prisma db push` (run locally against the production `DIRECT_URL`, or via a
   one-off job).

## Project structure

```
prisma/schema.prisma     Data model (User, Restaurant, Ingredient, Recipe, MenuItem)
prisma/seed.ts           Demo data seeder
src/lib/costing.ts       Costing engine (+ costing.test.ts)
src/lib/auth.ts          NextAuth options + ownership helpers
src/lib/prisma.ts        Prisma client singleton
src/app/api/...          REST endpoints (auth-scoped)
src/app/dashboard/...    Authenticated UI (ingredients, recipes, menu costing)
src/app/login, /register Auth pages
src/middleware.ts        Protects /dashboard routes
```

## Notes on the costing model

- Costs are computed per the recipe's **yield unit**. Sub-recipes are resolved
  recursively with cycle detection.
- **Unit conversions** work within a kind (mass: G/KG; volume: ML/L/TSP/TBSP/CUP;
  count: PCS). Converting across kinds (e.g. grams ↔ pieces) throws a clear error
  rather than producing a silently wrong number.
- **Wastage %** reduces an ingredient's usable quantity; **process-loss %** reduces
  a recipe's effective yield.
