import type { CartLine } from './cart';
import { emptyPlateChange, type PlateChangeEntry, type PlateChangeFields } from './plate-change';
import type { RepairLine, RepairState, VehiclePricing } from './types';
import { initialRepairState } from './formulas';

const STORAGE_KEY = 'flywheels-calc-session';
const VERSION = 1;

export interface CalculatorSessionSnapshot {
  cart: CartLine[];
  vehicle: VehiclePricing | null;
  repairState: RepairState;
  plateChange: PlateChangeFields;
  plateChangeOpen: boolean;
  plateChangeLines: PlateChangeEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCartLine(value: unknown): value is CartLine {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount)
  );
}

function isVehiclePricing(value: unknown): value is VehiclePricing {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.model === 'string' &&
    typeof value.range === 'string' &&
    typeof value.dealership === 'string' &&
    typeof value.priceHT === 'number' &&
    typeof value.priceTTC === 'number' &&
    typeof value.explosion === 'number' &&
    typeof value.noyade === 'number'
  );
}

function isPlateChangeFields(value: unknown): value is PlateChangeFields {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.lastName === 'string' &&
    typeof value.firstName === 'string' &&
    typeof value.currentPlate === 'string' &&
    typeof value.newPlate === 'string'
  );
}

function isPlateChangeEntry(value: unknown): value is PlateChangeEntry {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.amount === 'number' &&
    typeof value.copyText === 'string'
  );
}

function isRepairState(value: unknown): value is RepairState {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every((entry) => {
    if (!isRecord(entry)) {
      return false;
    }
    return typeof entry.checked === 'boolean' && typeof entry.qty === 'number';
  });
}

function parseSnapshot(raw: unknown): CalculatorSessionSnapshot | null {
  if (!isRecord(raw) || raw.version !== VERSION) {
    return null;
  }

  if (!Array.isArray(raw.cart) || !raw.cart.every(isCartLine)) {
    return null;
  }

  if (raw.vehicle !== null && !isVehiclePricing(raw.vehicle)) {
    return null;
  }

  if (!isRepairState(raw.repairState)) {
    return null;
  }

  if (!isPlateChangeFields(raw.plateChange)) {
    return null;
  }

  if (typeof raw.plateChangeOpen !== 'boolean') {
    return null;
  }

  if (!Array.isArray(raw.plateChangeLines) || !raw.plateChangeLines.every(isPlateChangeEntry)) {
    return null;
  }

  return {
    cart: raw.cart,
    vehicle: raw.vehicle,
    repairState: raw.repairState,
    plateChange: raw.plateChange,
    plateChangeOpen: raw.plateChangeOpen,
    plateChangeLines: raw.plateChangeLines,
  };
}

export function mergeRepairState(repairs: RepairLine[], stored: RepairState): RepairState {
  const defaults = initialRepairState(repairs);
  const merged: RepairState = { ...defaults };

  for (const line of repairs) {
    const saved = stored[line.id];
    if (!saved) {
      continue;
    }
    merged[line.id] = {
      checked: saved.checked,
      qty: Number.isFinite(saved.qty) && saved.qty > 0 ? Math.round(saved.qty) : defaults[line.id]?.qty ?? 1,
    };
  }

  return merged;
}

export function loadCalculatorSession(repairs: RepairLine[]): CalculatorSessionSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const snapshot = parseSnapshot(JSON.parse(raw));
    if (!snapshot) {
      clearCalculatorSession();
      return null;
    }

    return {
      ...snapshot,
      repairState: mergeRepairState(repairs, snapshot.repairState),
    };
  } catch {
    clearCalculatorSession();
    return null;
  }
}

export function saveCalculatorSession(snapshot: CalculatorSessionSnapshot): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: VERSION,
        ...snapshot,
      }),
    );
  } catch {
    // Quota exceeded or private mode — ignore.
  }
}

export function clearCalculatorSession(): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.removeItem(STORAGE_KEY);
}

export function emptyCalculatorSession(repairs: RepairLine[]): CalculatorSessionSnapshot {
  return {
    cart: [],
    vehicle: null,
    repairState: initialRepairState(repairs),
    plateChange: emptyPlateChange(),
    plateChangeOpen: false,
    plateChangeLines: [],
  };
}
