import fallbackCatalog from '../data/catalog.json';
import type { Catalog } from './types';

export interface PricingFormulas {
  ttcRate: number;
  explosionRate: number;
  noyadeRate: number;
  rachatRate: number;
}

export interface AppConfig extends Catalog {
  formulas: PricingFormulas;
}

const DEFAULT_FORMULAS: PricingFormulas = {
  ttcRate: 1.1,
  explosionRate: 0.1,
  noyadeRate: 0.05,
  rachatRate: 0.5,
};

function buildFallback(): AppConfig {
  const catalog = fallbackCatalog as Catalog;
  return {
    vehicles: catalog.vehicles,
    repairs: catalog.repairs,
    repairByRange: catalog.repairByRange ?? {},
    formulas: DEFAULT_FORMULAS,
  };
}

let catalog: AppConfig = buildFallback();

export function setRuntimeCatalog(next: AppConfig): void {
  catalog = next;
}

export function getRepairByRange(): Record<string, number> {
  return catalog.repairByRange;
}

export function getFormulas(): PricingFormulas {
  return catalog.formulas;
}
