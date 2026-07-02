import { inputCompact, money } from '../../lib/ui';

export const adminShell = 'mx-auto w-full max-w-[80rem]';

export const adminPanel = 'fw-panel overflow-hidden p-0';

export const adminSection = 'px-3 py-3 sm:px-4';

export const adminSectionHead =
  'mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1';

export const adminSectionTitle = 'font-display text-xs tracking-wide text-fg';

export const adminSectionHint = 'text-[10px] text-fg-muted';

export const adminStatus = 'text-[10px] text-fg-muted';

/** Text field — no number spinners */
export const adminField = `${inputCompact} h-7 py-0.5 text-xs leading-tight [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

/** Line / range label — compact */
export const adminFieldLabel = `${adminField} min-w-0 w-full`;

export const adminFieldPrice = `${adminField} ${money} w-full min-w-0 text-right text-xs tabular-nums`;

export const adminFieldCoef = `${adminField} ${money} mt-0.5 w-full text-center text-sm font-semibold tabular-nums`;

export const adminFormulaCard =
  'rounded-md border border-border bg-surface-sunken px-2 py-1.5 text-center';

export const adminLineRow =
  'grid grid-cols-[2.5rem_minmax(0,1fr)_3.75rem_1.75rem_2rem_1.5rem] items-center gap-x-1 gap-y-0 border-b border-border/35 py-1 last:border-b-0';

export const adminLineHead =
  'grid grid-cols-[2.5rem_minmax(0,1fr)_3.75rem_1.75rem_2rem_1.5rem] gap-x-1 px-0 pb-0.5 text-[9px] uppercase tracking-wider text-fg-muted';

export const adminRangeColRow =
  'grid grid-cols-[minmax(0,1fr)_3.25rem] items-center gap-x-1 border-b border-border/35 py-0.5 last:border-b-0';

export const adminRangeColHead =
  'grid grid-cols-[minmax(0,1fr)_3.25rem] gap-x-1 pb-0.5 text-[9px] uppercase tracking-wider text-fg-muted';

export const adminAddRow =
  'mt-1.5 grid grid-cols-[minmax(0,1fr)_3.75rem_1.75rem_auto] items-center gap-1.5 border-t border-dashed border-border pt-1.5';

export function parseAdminInt(value: string): number {
  const parsed = Number.parseInt(value.replace(/\s/g, ''), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function parseAdminFloat(value: string): number {
  const normalized = value.replace(',', '.').replace(/\s/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
