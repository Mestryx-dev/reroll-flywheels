export const PLATE_CHANGE_ID = 'changement_de_plaque';

export function isPlateChangeLine(id: string): boolean {
  return id === PLATE_CHANGE_ID;
}

export interface PlateChangeFields {
  lastName: string;
  firstName: string;
  currentPlate: string;
  newPlate: string;
}

export const emptyPlateChange = (): PlateChangeFields => ({
  lastName: '',
  firstName: '',
  currentPlate: '',
  newPlate: '',
});

function plateChangeFullName(fields: PlateChangeFields): string {
  return [fields.lastName, fields.firstName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
}

/** Format: Lehmall Robert // Rumpo custom // 48DAH601 // ROBY */
export function formatPlateChange(fields: PlateChangeFields, vehicleModel?: string): string {
  return [plateChangeFullName(fields), vehicleModel?.trim(), fields.currentPlate, fields.newPlate]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' // ');
}

export function canFormatPlateChange(
  fields: PlateChangeFields,
  vehicleModel?: string,
): boolean {
  return Boolean(
    fields.lastName.trim() &&
      fields.firstName.trim() &&
      vehicleModel?.trim() &&
      fields.currentPlate.trim() &&
      fields.newPlate.trim(),
  );
}

export interface PlateChangeEntry {
  id: string;
  label: string;
  amount: number;
  copyText: string;
}

export function buildPlateChangeEntry(
  price: number,
  fields: PlateChangeFields,
  vehicle?: { model: string } | null,
): PlateChangeEntry | null {
  if (!canFormatPlateChange(fields, vehicle?.model)) {
    return null;
  }
  const formatted = formatPlateChange(fields, vehicle?.model);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: formatted,
    amount: price,
    copyText: formatted,
  };
}
