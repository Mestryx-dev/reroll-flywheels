import type { CatalogVehicle, RepairLine, RepairState, VehiclePricing } from './types';
import { isPlateRepairLine, isRangeBasedRepairLine } from './line-kind';
import type { PricingFormulas } from './runtime-catalog';
import { repairPriceForVehicle } from './repair-prices';

export interface RepairPricingContext {
  repairByRange: Record<string, number>;
}

export function pricingFromHT(
  model: string,
  range: string,
  priceHT: number,
  dealership = '',
  formulas: PricingFormulas,
): VehiclePricing {
  const rates = formulas;
  return {
    model,
    range,
    priceHT,
    priceTTC: Math.round(priceHT * rates.ttcRate),
    explosion: Math.round(priceHT * rates.explosionRate),
    noyade: Math.round(priceHT * rates.noyadeRate),
    dealership,
  };
}

export function pricingFromCatalog(
  vehicle: CatalogVehicle,
  formulas: PricingFormulas,
): VehiclePricing {
  return pricingFromHT(
    vehicle.model,
    vehicle.range,
    vehicle.priceHT,
    vehicle.dealership,
    formulas,
  );
}

export function initialRepairState(repairs: RepairLine[]): RepairState {
  return Object.fromEntries(
    repairs.map((line) => [
      line.id,
      {
        checked: line.defaultChecked,
        qty: line.defaultQty ?? 1,
      },
    ]),
  );
}

export function effectiveRepairPrice(
  line: RepairLine,
  vehicle: VehiclePricing | null | undefined,
  pricing: RepairPricingContext,
): number {
  if (isRangeBasedRepairLine(line)) {
    return repairPriceForVehicle(vehicle, pricing.repairByRange);
  }
  return line.price;
}

export function repairLineTotal(
  line: RepairLine,
  checked: boolean,
  qty: number,
  vehicle: VehiclePricing | null | undefined,
  pricing: RepairPricingContext,
): number {
  if (!checked) {
    return 0;
  }
  return effectiveRepairPrice(line, vehicle, pricing) * Math.max(qty, 1);
}

export function repairSelectionTotal(
  repairs: RepairLine[],
  state: RepairState,
  vehicle: VehiclePricing | null | undefined,
  pricing: RepairPricingContext,
): number {
  return repairs.reduce((sum, line) => {
    const row = state[line.id];
    return sum + repairLineTotal(line, row?.checked ?? false, row?.qty ?? 1, vehicle, pricing);
  }, 0);
}

export function canAddSelectionToCart(
  repairs: RepairLine[],
  state: RepairState,
  vehicle: VehiclePricing | null | undefined,
  pricing: RepairPricingContext,
): boolean {
  return repairs.some((line) => {
    if (isPlateRepairLine(line)) {
      return false;
    }
    const row = state[line.id];
    if (!row?.checked) {
      return false;
    }
    return effectiveRepairPrice(line, vehicle, pricing) > 0;
  });
}

export function buildCartLinesFromSelection(
  repairs: RepairLine[],
  state: RepairState,
  vehicle: VehiclePricing | null | undefined,
  pricing: RepairPricingContext,
): Array<{ label: string; amount: number }> {
  const prefix = vehicle?.model ? `${vehicle.model} · ` : '';
  const parts: Array<{ part: string; amount: number }> = [];

  for (const line of repairs) {
    if (isPlateRepairLine(line)) {
      continue;
    }
    const row = state[line.id];
    if (!row?.checked) {
      continue;
    }
    const qty = Math.max(row.qty, 1);
    const unitPrice = effectiveRepairPrice(line, vehicle, pricing);
    if (unitPrice <= 0) {
      continue;
    }
    const qtySuffix = qty > 1 ? ` ×${qty}` : '';
    parts.push({
      part: `${line.label}${qtySuffix}`,
      amount: unitPrice * qty,
    });
  }

  if (parts.length === 0) {
    return [];
  }

  const total = parts.reduce((sum, part) => sum + part.amount, 0);
  const label = `${prefix}${parts.map((part) => part.part).join(', ')}`;

  return [{ label, amount: total }];
}
