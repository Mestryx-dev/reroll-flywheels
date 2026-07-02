import type { RepairLineKind } from './db.js';

export function inferRepairLineKind(lineId: string): RepairLineKind {
  if (lineId === 'reparations') {
    return 'range_based';
  }
  if (lineId === 'changement_de_plaque') {
    return 'plate';
  }
  return 'fixed';
}
