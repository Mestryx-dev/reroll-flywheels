import type { AppConfig } from './runtime-catalog';
import { ApiResponseError, readJsonResponse } from './api-fetch';

export interface AdminRepairLine {
  id: string;
  label: string;
  kind: string;
  price: number;
  defaultChecked: boolean;
  defaultQty: number | null;
  sortOrder: number;
  enabled: boolean;
}

export interface AdminRangeRow {
  rangeKey: string;
  label: string;
  price: number;
}

export interface AdminState {
  formulas: AppConfig['formulas'];
  repairLines: AdminRepairLine[];
  repairByRange: AdminRangeRow[];
  vehicleCount: number;
}

class AdminApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return await readJsonResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiResponseError) {
      throw new AdminApiError(error.message, error.status);
    }
    throw error;
  }
}

export async function fetchAdminState(): Promise<AdminState> {
  return parseJson<AdminState>(await fetch('/api/admin/state'));
}

export async function saveFormulas(formulas: AppConfig['formulas']): Promise<AppConfig['formulas']> {
  const payload = await parseJson<{ formulas: AppConfig['formulas'] }>(
    await fetch('/api/admin/formulas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formulas),
    }),
  );
  return payload.formulas;
}

export async function resetFormulas(): Promise<AppConfig['formulas']> {
  const payload = await parseJson<{ formulas: AppConfig['formulas'] }>(
    await fetch('/api/admin/formulas/reset', { method: 'POST' }),
  );
  return payload.formulas;
}

export async function createRepairLine(input: {
  label: string;
  price: number;
  defaultChecked?: boolean;
  defaultQty?: number | null;
}): Promise<AdminRepairLine> {
  const payload = await parseJson<{ line: AdminRepairLine }>(
    await fetch('/api/admin/repair-lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
  return payload.line;
}

export async function updateRepairLine(
  id: string,
  input: Partial<{
    label: string;
    price: number;
    defaultChecked: boolean;
    defaultQty: number | null;
    sortOrder: number;
  }>,
): Promise<AdminRepairLine> {
  const payload = await parseJson<{ line: AdminRepairLine }>(
    await fetch(`/api/admin/repair-lines/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
  return payload.line;
}

export async function deleteRepairLine(id: string): Promise<void> {
  await parseJson<{ ok: boolean }>(
    await fetch(`/api/admin/repair-lines/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  );
}

export async function saveRepairByRange(ranges: AdminRangeRow[]): Promise<AdminRangeRow[]> {
  const payload = await parseJson<{ ranges: AdminRangeRow[] }>(
    await fetch('/api/admin/repair-by-range', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ranges }),
    }),
  );
  return payload.ranges;
}

export { AdminApiError };
