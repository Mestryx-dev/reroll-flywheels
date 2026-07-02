# Admin & data layer — dev branch plan

Status: **draft for discussion** (2026-07-02)  
Audience: direction RP (tariffs), dev (implementation on `dev`)  
Scope: flywheels-calc — same site, admin route, editable business rules

---

## 1. Goals (from direction RP)

| Need | Description |
|------|-------------|
| **Tariff ownership** | Direction edits prices and billable lines; mechanics use the public calculator only. |
| **Same site** | Admin lives in the app (e.g. `/admin`) for now; auth/lock can come later. |
| **Editable lines** | CRUD on invoice lines (label, fixed price, default checked, optional qty) — like Ouvrable, Pneu, etc. |
| **Réparations by gamme** | Repair base price depends on vehicle **range** (Compacts → 275, Sports → 750, …); admin must edit the gamme table. |
| **Plaque price** | Single configurable price for plate change (today hardcoded in catalog / special line). |
| **Formulas** | Vehicle strip formulas (TTC, explosion, noyade, rachat) should be adjustable without code deploy. |
| **Sheet sync** | One-click import from Google Sheet **Data** (and optionally **Calculette**) to seed or refresh DB — not the only workflow long-term. |

Non-goals for first admin iteration:

- Full vehicle catalog editor (720 rows) — keep import/sync; optional later.
- Multi-user RBAC, audit trail, “validated in RP” workflow — phase 2.
- Replacing Google Sheet as the only SSOT before direction is comfortable with in-app editing.

---

## 2. Current architecture (baseline)

```
Google Sheet (Data cols G/H, Calculette)
        ↓  pnpm sync-data (build time)
vehicles.csv + catalog.json (bundled in SPA)
        ↓
Static nginx container (Dokploy, main)
```

**Runtime:** no API, no DB, no persistence.  
**Logic in code:**

- Fixed rates in `src/lib/formulas.ts`: TTC ×1.1, explosion ×0.1, noyade ×0.05, rachat ×0.5.
- `RepairLine[]`: fixed price per line, except **Réparations** → `repairByRange[vehicle.range]`.
- **Plaque**: special line id `changement_de_plaque`, excluded from repair cart; price from same line object.

**Pain already seen:** gamme prices missing or wrong when code diverged from Sheet; requires commit + redeploy to fix.

---

## 3. Target architecture (dev — recommended)

Monolith **light**: one Dokploy app, two processes or one Node server.

```text
┌─────────────────────────────────────────────────────────┐
│  Browser                                                 │
│  /          → calculator + catalog (public)              │
│  /admin     → direction UI (same React app)              │
└──────────────────────────┬──────────────────────────────┘
                           │ REST /api/*
┌──────────────────────────▼──────────────────────────────┐
│  API (Node + Hono or Fastify)                            │
│  - GET  /api/config        → published catalog + rules   │
│  - CRUD /api/admin/...     → lines, gammes, formulas     │
│  - POST /api/admin/sync    → pull Google Sheet → DB      │
│  - static: dist/ (SPA fallback)                          │
└──────────────────────────┬──────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ SQLite file │  (volume Dokploy)
                    │  + migrations
                    └─────────────┘
```

Why **SQLite** (not Postgres) on dev:

- Single app, solo/small direction team, ~20 gammes + ~15 lines + optional vehicles snapshot.
- One volume backup, simple rollback (copy file or snapshot row).
- Upgrade path: same schema → Postgres if we add auth service or second app later.

Why **not** stay static-only for admin:

- Direction needs **change without redeploy** and **add/remove lines**; bundled JSON cannot reflect that at runtime.
- Plaque price + gamme table + formula coefficients fit naturally in DB.

**Auth v0:** none or soft gate (env flag `ADMIN_ENABLED`, optional shared password header). Document “lock later” in ADR when enabling prod admin URL.

---

## 4. Data model (SQLite)

### 4.1 `pricing_formulas` (single row or key/value)

Configurable coefficients for vehicle strip (today hardcoded):

| Key | Default | Used for |
|-----|---------|----------|
| `ttc_rate` | 1.1 | priceTTC |
| `explosion_rate` | 0.1 | explosion |
| `noyade_rate` | 0.05 | noyade |
| `rachat_rate` | 0.5 | rachat |

Admin: form with 4 numbers + “Reset to defaults”.

### 4.2 `repair_lines`

Dynamic invoice lines (replaces static `repairs[]` in catalog.json for runtime).

| Column | Type | Notes |
|--------|------|--------|
| `id` | TEXT PK | slug, e.g. `ouvrable`, `reparations` |
| `label` | TEXT | Display name |
| `kind` | TEXT | `fixed` \| `range_based` \| `plate` |
| `price` | INTEGER | Fixed price (cents or whole $ — match existing `formatMoney`) |
| `default_checked` | BOOL | |
| `default_qty` | INTEGER NULL | e.g. Ouvrable default 1 |
| `sort_order` | INTEGER | UI order |
| `enabled` | BOOL | Soft delete |

**Kinds:**

- `fixed` — Ouvrable, Pneu, Transport, …
- `range_based` — exactly one row: **Réparations** (`id = reparations`); price ignored, uses gamme table.
- `plate` — exactly one row: **Plaque**; price used in plate card; not in repair cart (keep current UX).

Admin: table UI — add row, edit label/price/defaults, delete (disable) non-system rows; cannot delete `reparations` / `plate` kinds, only edit.

### 4.3 `repair_by_range`

Gamme → repair base price (today `repairByRange` in catalog.json).

| Column | Type |
|--------|------|
| `range_key` | TEXT PK | normalized lowercase, e.g. `compacts` |
| `label` | TEXT | Display gamme (optional, from sheet) |
| `price` | INTEGER |

Admin: editable grid; show warning if a vehicle range in catalog has no row (link to sync).

**Aliases:** keep `berline` → `sedans`, `sportclassics` → `sportsclassics` in code or store explicit alias table — prefer **normalize on sync** so DB keys match Sheet.

### 4.4 `vehicles` (optional in v1 admin UI)

Import-only from CSV/Sheet sync; calculator keeps reading from DB after sync.

| Column | Type |
|--------|------|
| `model` | TEXT |
| `price_ht` | INTEGER |
| `range` | TEXT |
| `dealership` | TEXT |

Unique on `(model, range, dealership, price_ht)` as today.

### 4.5 `sync_runs` (audit light)

| Column | Type |
|--------|------|
| `id` | INTEGER PK |
| `source` | TEXT | `google_sheet_data`, `google_sheet_calculette`, `csv` |
| `started_at` | TEXT |
| `status` | TEXT | `ok` \| `error` |
| `summary` | TEXT JSON | counts updated, errors |

---

## 5. Google Sheet sync (admin button)

Reuse logic from `scripts/sync-from-sheet.mjs`, moved to shared module `src/server/sync/` (or `packages/sync`):

| Action | Sheet | Extract |
|--------|-------|---------|
| **Sync gammes + vehicles** | `Data` | Cols G/H → `repair_by_range`; rows A–D → `vehicles` |
| **Sync repair lines** | `Calculette` | Known labels → `repair_lines` (fixed prices, defaults) |

**Behaviour:**

- **Preview diff** before apply (lines added/changed/removed, gammes price deltas).
- **Merge strategy:** Sheet wins for synced fields; admin edits in DB not overwritten unless row matched by sync key (document in UI).
- **Plaque price:** from Calculette row “Changement de plaque” / “Plaque” → update `repair_lines` where `kind = plate`.

Sheet ID stays env `FLYWHEELS_SHEET_ID` (already in script).

---

## 6. Admin UI (same React app)

New nav tab or route **`/admin`** (hidden from public header until we want exposure).

### Sections

1. **Formules véhicule** — 4 coefficients + save.
2. **Lignes à facturer** — list CRUD (label, price, default checked, qty); badge for kind (`fixed` / `range` / `plate`).
3. **Réparations par gamme** — grid range + price; link “Sync from Sheet”.
4. **Plaque** — single price field (or edit plate row in section 2).
5. **Sync** — buttons “Import Data sheet”, “Import Calculette”, last run log.
6. **(Later)** Véhicules — read-only count + “Import only”.

Public calculator:

- On load: `GET /api/config` → `{ formulas, repairLines, repairByRange, vehicles }`.
- Fallback during migration: if API fails, use bundled `catalog.json` (feature flag).

---

## 7. Calculator logic changes (dev)

| Area | Change |
|------|--------|
| `effectiveRepairPrice` | Read line `kind`: `range_based` → gamme table; `fixed` → line.price; `plate` → N/A in repair invoice. |
| `isPlateChangeLine` | Replace hardcoded id with `kind === 'plate'`. |
| `isReparationsLine` | Replace with `kind === 'range_based'`. |
| `pricingFromHT` | Load rates from config API / DB. |
| `buildCartLinesFromSelection` | Skip `kind === 'plate'` (already skips plate id). |

Keep grouped cart line behaviour; no change to plate independent flow.

---

## 8. Deployment (dev vs main)

| Env | Branch | Stack |
|-----|--------|--------|
| **Prod** (now) | `main` | Static nginx only — unchanged until v1 admin ready |
| **Dev / staging** | `dev` | Docker: Node serves API + SPA; SQLite volume |

Dokploy project **Reroll**: second app or same app on `dev` branch with different domain e.g. `flywheels-calc-dev.mestryx.dev` (optional).

Rollback: restore SQLite file or redeploy previous image; no destructive migration without backup step in runbook.

---

## 9. Implementation phases (dev branch)

Estimate: **3–4 iteration cycles** on dev before merge to main.

### Phase A — Foundation (≈1 cycle)

- [ ] Add `docs/adr/` entry: SQLite + in-app admin (no auth v0).
- [ ] Introduce `server/` (Hono + better-sqlite3 or drizzle + sqlite).
- [ ] Migrations + seed from current `catalog.json` on first boot.
- [ ] `GET /api/config` consumed by SPA (replace static import gradually).
- [ ] Dockerfile dev variant: Node runtime instead of nginx-only (or nginx reverse proxy to Node).

### Phase B — Admin UI (≈1 cycle)

- [ ] Route `/admin` + layout.
- [ ] CRUD repair lines (add/remove/edit).
- [ ] Grid repair_by_range + plaque price.
- [ ] Formulas editor.

### Phase C — Sheet sync (≈0.5 cycle)

- [ ] Extract sync from `scripts/sync-from-sheet.mjs` to shared module.
- [ ] `POST /api/admin/sync` with preview + apply.
- [ ] Admin sync panel + `sync_runs` log.

### Phase D — Hardening before main (≈0.5–1 cycle)

- [ ] Optional basic auth (env password).
- [ ] QA: Club Compacts 275, plate line independent, disclaimer unchanged.
- [ ] Dokploy dev deploy + volume backup note in README.
- [ ] Remove or keep build-time sync as CI fallback (recommend: CI seeds staging only).

---

## 10. Open decisions (need direction input)

1. **Vehicle catalog in admin** — import-only via sync OK, or full grid editor in v1?
2. **Sync merge** — when direction edits a gamme in admin then clicks Sync, does Sheet overwrite? (Proposed: confirm dialog per section.)
3. **Auth timing** — public `/admin` on LAN/WAN acceptable until v1, or password from day one?
4. **“Validé RP”** — separate published flag later, or disclaimer enough for now?

---

## 11. Summary recommendation

**Do on `dev`:**

- SQLite + small API in the same repo and deploy unit.
- Admin in the same SPA at `/admin`.
- Three editable domains: **formulas**, **repair lines (CRUD)**, **repair_by_range + plaque price**.
- **Sync button** imports from Google Sheet Data / Calculette into DB (reuse existing parser).

**Do not do yet:**

- Postgres, separate admin app, full vehicle CRUD, strict RBAC.

**Keep on `main` until dev is stable:**

- Static-only calculator for production users; merge when API + admin QA pass.

---

## References

- Sheet: [Flywheels Google Sheet](https://docs.google.com/spreadsheets/d/1eb4nnusdasnyUMIX9lf1JSgjJBeQLnAs3LWUuBkAm3s/edit) — tabs `Data`, `Calculette`.
- Current sync: `scripts/sync-from-sheet.mjs`
- Gamme prices: `catalog.json` → `repairByRange` (from Data cols G/H)
- Prod URL: https://flywheels-calc.mestryx.dev (Dokploy project **Reroll**)
