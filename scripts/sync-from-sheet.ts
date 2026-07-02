#!/usr/bin/env tsx
/**
 * Build catalog.json from local CSV + Google Sheet.
 * Shared logic: server/sync-service.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalogFromSheets } from '../server/sync-service.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(rootDir, 'src/data/catalog.json');

const catalog = await buildCatalogFromSheets(rootDir);
writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

console.log(
  `Wrote ${catalog.vehicles.length} vehicles + ${catalog.repairs.length} repair lines + ${Object.keys(catalog.repairByRange).length} gammes → ${outPath}`,
);
