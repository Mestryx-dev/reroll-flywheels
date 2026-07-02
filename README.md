# Flywheels Calc

Web calculator for **Flywheels** garage — vehicle lookup, repair lines, and a shared invoice cart.

## Features

- Single calculator session with cart and invoice workflow
- **Vehicle search** from `vehicles.csv` — type, prix concess (HT), TTC, explosion, noyade, rachat
- **Repair lines** — checkboxes + quantities, **Ajouter au panier**
- **Panier** — recap of all added lines, copy invoice, running **Total à facturer** (top right)

## Data

| File | Role |
|------|------|
| `src/data/vehicles.csv` | Vehicle catalogue (edit this) |
| `src/data/catalog.json` | Generated bundle (vehicles + repairs + **repairByRange**) |
| Google Sheet *Data* (cols G/H) | Repair base price by gamme |
| Google Sheet *Calculette* | Repair tariffs (via sync) |

### Edit vehicles

1. Update `src/data/vehicles.csv` (`model,priceHT,category,dealership`)
2. Run `pnpm sync-data`

### Sync repair tariffs from sheet

```bash
pnpm sync-data
```

Requires network for the sheet export. Vehicles always come from CSV.

## Theming (Tailwind v4)

Design tokens live in **`src/index.css`** — not hardcoded in components.

| Layer | Role |
|-------|------|
| `:root` / `.dark` | Semantic CSS variables (`--fw-surface`, `--fw-brand`, …) |
| `@theme inline` | Maps tokens → Tailwind utilities (`bg-surface`, `text-brand`, …) |
| `@layer components` | Reusable primitives (`.fw-panel`, `.fw-input`, `.fw-btn-primary`) |
| `src/lib/ui.ts` | Component class compositions (uses semantic utilities only) |

**Modes:** Clair (Flywheels poster — teal + cream + red) · Sombre (night garage) · Auto (system).  
Toggle in the header; preference stored in `localStorage` (`flywheels-calc-theme`).

To adjust brand colors, edit the `:root` and `.dark` blocks in `index.css` once — all UI follows.

## Development

```bash
pnpm install
pnpm dev          # Vite (:5173+) + API (:4783), proxy /api → API
pnpm build        # dist/ + dist-server/
pnpm start        # production Node server (:3000)
```

Local SQLite: `data/flywheels.db` (seeded from `catalog.json` on first boot).

**Admin:** https://your-host/admin — no auth; edits apply immediately to the calculator.

## Deploy

**Dev branch:** single Node container — serves `dist/` + `/api/*`, SQLite on volume `DATA_DIR` (default `/app/data`).

```bash
docker build -t flywheels-calc .
docker run -p 3000:3000 -v flywheels-data:/app/data flywheels-calc
```

**Dokploy (dev):** set container port **3000** (not 80), mount volume on `/app/data`.

**Production (`main`):** still nginx static until `dev` is merged and validated.

**Production URL:** https://flywheels-calc.mestryx.dev (Dokploy project **Reroll**)
