import type { RepairLine } from './types';
import { PLATE_CHANGE_ID } from './plate-change';
import { REPARATIONS_LINE_ID } from './repair-prices';

export function isRangeBasedRepairLine(line: Pick<RepairLine, 'id' | 'kind'>): boolean {
  return line.kind === 'range_based' || line.id === REPARATIONS_LINE_ID;
}

export function isPlateRepairLine(line: Pick<RepairLine, 'id' | 'kind'>): boolean {
  return line.kind === 'plate' || line.id === PLATE_CHANGE_ID;
}
