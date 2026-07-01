export interface VehiclePricing {
  model: string;
  range: string;
  priceHT: number;
  priceTTC: number;
  explosion: number;
  noyade: number;
  rachat: number;
  dealership: string;
}

export interface CatalogVehicle {
  model: string;
  priceHT: number;
  range: string;
  dealership: string;
}

export interface RepairLine {
  id: string;
  label: string;
  price: number;
  defaultChecked: boolean;
  defaultQty: number | null;
}

export interface CalculatorConfig {
  repairs: RepairLine[];
}

export interface Catalog {
  vehicles: CatalogVehicle[];
  repairs: RepairLine[];
  /** Base repair price by vehicle range (from Data sheet cols G/H). Keys are lowercase. */
  repairByRange: Record<string, number>;
}

export type RepairState = Record<string, { checked: boolean; qty: number }>;
