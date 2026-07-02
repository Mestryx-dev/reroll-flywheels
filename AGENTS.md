# Flywheels Calc — Agent Guide

Web calculator for the **Flywheels** RP garage (vehicle lookup, repair lines, invoice cart) with an in-app **admin** at `/admin` for tariff editing. Repo: `Mestryx-dev/reroll-flywheels`.

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | **Vite 7** + **React 19** + **Tailwind v4** | SPA in `src/`; tokens in `src/index.css`, compositions in `src/lib/ui.ts` |
| API | **Hono** + **@hono/node-server** | `server/` → compiled to `dist-server/` |
| Database | **better-sqlite3** | File at `DATA_DIR/flywheels.db` (default `data/flywheels.db` locally, `/app/data` in Docker) |
| Package manager | **pnpm** | `pnpm@10`; native deps: `esbuild`, `better-sqlite3` |

## Deployed URLs (Dokploy — project **Reroll**)

| Environment | URL | Branch | Notes |
|-------------|-----|--------|-------|
| **Production** | https://flywheels-calc.mestryx.dev | `main` | Node monolith, port **3000**, volume `/app/data` |
| **Dev** | https://flywheels-calc-dev.mestryx.dev | `dev` | Same stack; auto-deploy on push |

**Admin:** `{origin}/admin` — **no auth** (direction decision). Do not add auth unless explicitly requested.

## Project structure

```
server/                 API (Hono + SQLite)
  index.ts              Entry: /api/* + static dist/
  config-service.ts     GET /api/config payload
  admin-service.ts      Admin CRUD + formulas
  admin-routes.ts       /api/admin/*
  sync-service.ts       Sheet sync preview/apply + sync_runs
  sync/sheet-parser.ts  Google Sheet + CSV parsing (shared with CLI)
  db.ts, seed.ts        Schema + first-boot seed from catalog.json
src/
  pages/AdminPage.tsx   /admin route (client-side via usePathname)
  context/ConfigContext.tsx   Public config from API; catalog.json fallback
  components/admin/     Admin UI sections
  lib/formulas.ts       Pricing + repair line totals (pass repairByRange explicitly)
  data/
    vehicles.csv        SSOT for vehicle list (edit + pnpm sync-data)
    catalog.json        Generated bundle; seeds DB on first boot
scripts/sync-from-sheet.ts   CLI: rebuild catalog.json from Sheet + CSV
docs/admin-plan.md      Architecture, phases, open decisions
```

## Data flow

```
Google Sheet (Data G/H, Calculette)  +  vehicles.csv
        ↓  admin sync or pnpm sync-data
SQLite (runtime SSOT for calculator + admin)
        ↓  GET /api/config
React calculator + catalog views
```

- **Réparations** line (`id: reparations`, `kind: range_based`) — price from `repair_by_range` table, not line.price.
- **Plaque** (`changement_de_plaque`, `kind: plate`) — separate card; excluded from repair invoice cart.
- **Fixed lines** (Ouvrable, Vidange, …) — use `repair_lines.price`.
- **Rachat** — removed from calculator and admin formulas.

Sheet ID: `FLYWHEELS_SHEET_ID` env or default `1eb4nnusdasnyUMIX9lf1JSgjJBeQLnAs3LWUuBkAm3s`.

## API (public + admin)

| Method | Path | Role |
|--------|------|------|
| GET | `/api/health` | Liveness + vehicle count |
| GET | `/api/config` | Full config for SPA |
| GET | `/api/admin/state` | Admin panel state |
| PUT | `/api/admin/formulas` | TTC / explosion / noyade rates |
| POST/PATCH/DELETE | `/api/admin/repair-lines` | CRUD invoice lines |
| PUT | `/api/admin/repair-by-range` | Gamme prices |
| POST | `/api/admin/sync/preview` | `{ sources: ["data" \| "calculette"] }` |
| POST | `/api/admin/sync/apply` | Same body; writes DB + sync_runs |
| GET | `/api/admin/sync/runs` | Recent sync audit |

## Commands

```bash
pnpm install
pnpm dev          # Vite (:5173+, often :5174) + API :4783 — see src/lib/dev-port.ts
pnpm build        # dist/ + dist-server/
pnpm start        # production Node on :3000
pnpm sync-data    # rebuild src/data/catalog.json from Sheet + CSV
```

**Local dev:** API must run for admin and live pricing. If `/api/*` returns HTML, the wrong host or process is serving the app (prod static legacy, or Vite without API).

**Docker:**

```bash
docker build -t flywheels-calc .
docker run -p 3000:3000 -v flywheels-data:/app/data flywheels-calc
```

Image must include `src/data/catalog.json` and `src/data/vehicles.csv` (Data sync reads CSV at runtime).

## Conventions

- **Code, comments, commits:** English.
- **User-facing app copy:** French.
- **No admin auth** — document in PR/release notes if that changes.
- **Pricing in UI:** use `ConfigContext` / props — do not read stale values from `runtime-catalog` singleton alone.
- **Imports:** top of file only (no inline imports).
- **Secrets:** never commit `.env`; Sheet is public export URL only.

## Verification before “done”

1. `pnpm build` — green (client + `tsconfig.server.json`).
2. `pnpm dev` — `/api/health` 200; calculator without amber fallback banner.
3. `/admin` — edit a repair line price → calculator reflects after navigation or reload.
4. Sync **Data** and **Calculette** — preview returns JSON (not 502).
5. Dokploy: container port **3000**, volume **`/app/data`**.

## Gotchas

- **Port 4783** for local API — avoids Next.js on 3000/3010 (`package.json` `dev` script).
- **Vite port** — if 5173 is busy, Vite uses 5174; proxy still targets 4783.
- **Data sync in Docker** fails without `vehicles.csv` in the image (502 on preview).
- **SQLite without volume** on Dokploy — DB re-seeds on redeploy; admin edits lost.
- **`scripts/sync-from-sheet.ts`** is the CLI; shared logic lives in `server/sync-service.ts` + `server/sync/sheet-parser.ts`.
- **Phase D / QA** checklist: `docs/admin-plan.md` §9.

## References

- Plan & phases: [docs/admin-plan.md](docs/admin-plan.md)
- Human README: [README.md](README.md)
- Google Sheet: [Flywheels sheet](https://docs.google.com/spreadsheets/d/1eb4nnusdasnyUMIX9lf1JSgjJBeQLnAs3LWUuBkAm3s/edit)
