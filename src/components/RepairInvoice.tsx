import { useMemo } from 'react';
import type { RepairLine, RepairState, VehiclePricing } from '../lib/types';
import { isPlateRepairLine } from '../lib/line-kind';
import { effectiveRepairPrice, repairSelectionTotal, canAddSelectionToCart } from '../lib/formulas';
import { formatMoney } from '../lib/format';
import { btnPrimary, inputQty, money, panel, panelHeader, panelTitle, rowActive, rowBase, textBrand, textMuted } from '../lib/ui';

/** Lines with quantity use the same compact 1–10 dropdown (Ouvrable, Essence, …). */
function hasQtyDropdown(line: RepairLine): boolean {
  return line.defaultQty !== null;
}

/** Quantity presets for dropdown lines ($/unit on sheet). */
const QTY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
/** Shared grid: checkbox · label · unit price · qty · line total */
const ROW_GRID =
  'grid grid-cols-[auto_minmax(0,1fr)_3.5rem_2.25rem_3.5rem] items-center gap-x-2';

interface RepairInvoiceProps {
  repairs: RepairLine[];
  state: RepairState;
  onChange: (state: RepairState) => void;
  onAddToCart: () => void;
  vehicle: VehiclePricing | null;
}

export function RepairInvoice({
  repairs,
  state,
  onChange,
  onAddToCart,
  vehicle,
}: RepairInvoiceProps) {
  const selectionTotal = useMemo(
    () => repairSelectionTotal(repairs, state, vehicle),
    [repairs, state, vehicle],
  );

  const canAddToCart = useMemo(
    () => canAddSelectionToCart(repairs, state, vehicle),
    [repairs, state, vehicle],
  );

  const billableLines = repairs.filter((line) => !isPlateRepairLine(line));

  function toggle(id: string) {
    onChange({
      ...state,
      [id]: { ...state[id], checked: !state[id].checked },
    });
  }

  function setQty(id: string, qty: number) {
    onChange({
      ...state,
      [id]: { ...state[id], qty: Math.max(0, qty) },
    });
  }

  return (
    <section className={panel}>
      <div className={panelHeader}>
        <h2 className={panelTitle}>Lignes à facturer</h2>
        <span className={`text-xs ${textMuted} ${money}`}>
          Sélection · <span className={textBrand}>{formatMoney(selectionTotal)}</span>
        </span>
      </div>

      <div className="space-y-1">
        {billableLines.map((line) => {
          const row = state[line.id];
          const qtyDropdown = hasQtyDropdown(line);
          const unitPrice = effectiveRepairPrice(line, vehicle);
          const lineTotal = row?.checked ? unitPrice * Math.max(row.qty, 1) : 0;

          return (
            <label
              key={line.id}
              className={`${ROW_GRID} cursor-pointer px-2.5 py-1.5 text-sm ${
                row?.checked ? rowActive : rowBase
              }`}
            >
              <input
                type="checkbox"
                checked={row?.checked ?? false}
                onChange={() => toggle(line.id)}
                className="h-4 w-4 rounded border-border accent-brand"
              />
              <span className="min-w-0 truncate font-medium text-fg">{line.label}</span>
              <span className={`text-right text-xs ${textMuted} ${money}`}>
                {formatMoney(unitPrice)}
              </span>
              {qtyDropdown ? (
                <select
                  value={row?.qty ?? line.defaultQty ?? 1}
                  onChange={(event) => setQty(line.id, Number(event.target.value))}
                  onClick={(event) => event.stopPropagation()}
                  className={inputQty}
                >
                  {QTY_OPTIONS.map((qty) => (
                    <option key={qty} value={qty}>
                      {qty}
                    </option>
                  ))}
                </select>
              ) : (
                <span aria-hidden />
              )}
              <span className={`text-right text-xs font-semibold ${textBrand} ${money}`}>
                {formatMoney(lineTotal)}
              </span>
            </label>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddToCart}
        disabled={!canAddToCart}
        className={`${btnPrimary} mt-3 w-full`}
      >
        + Ajouter au panier · {formatMoney(selectionTotal)}
      </button>
    </section>
  );
}
