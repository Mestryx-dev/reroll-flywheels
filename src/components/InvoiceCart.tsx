import { motion, AnimatePresence } from 'framer-motion';
import type { CartLine } from '../lib/cart';
import { cartTotal } from '../lib/cart';
import { formatMoney } from '../lib/format';
import {
  btnGhost,
  btnPrimary,
  money,
  panel,
  panelAccent,
  panelEyebrow,
  panelHeader,
  panelTitle,
  rowBase,
  textBrand,
  textMuted,
} from '../lib/ui';

interface InvoiceCartProps {
  lines: CartLine[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function InvoiceCart({ lines, onRemove, onClear }: InvoiceCartProps) {
  const total = cartTotal(lines);

  async function copyCart() {
    const text = [
      'FACTURE FLYWHEELS',
      ...lines.map((line) => `${line.label}: ${formatMoney(line.amount)}`),
      `Total: ${formatMoney(total)}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
  }

  return (
    <section className={panel}>
      <div className={panelHeader}>
        <h2 className={panelTitle}>Panier · {lines.length} ligne{lines.length !== 1 ? 's' : ''}</h2>
        <div className="flex gap-1.5">
          {lines.length > 0 ? (
            <button type="button" onClick={onClear} className={btnGhost}>
              Vider
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void copyCart()}
            disabled={lines.length === 0}
            className={btnGhost}
          >
            Copier
          </button>
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-sunken py-8 text-center">
          <p className={`mt-2 text-xs ${textMuted}`}>Panier vide</p>
          <p className="mt-1 max-w-[200px] text-[10px] leading-relaxed text-fg-subtle">
            Coche des lignes puis ajoute-les au panier
          </p>
        </div>
      ) : (
        <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-0.5">
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              <motion.li
                key={line.id}
                layout
                initial={{ opacity: 0, x: -12, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 12, scale: 0.98 }}
                className={`group flex items-center gap-1.5 px-2 py-1.5 text-xs ${rowBase} hover:border-brand/30 hover:bg-brand-subtle`}
              >
                <span className="min-w-0 flex-1 truncate text-fg-secondary">{line.label}</span>
                <span className={`shrink-0 font-semibold ${textBrand} ${money}`}>
                  {formatMoney(line.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(line.id)}
                  className="shrink-0 rounded px-1 text-fg-subtle opacity-0 transition group-hover:opacity-100 hover:bg-brand-subtle hover:text-brand"
                  aria-label="Retirer"
                >
                  ×
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

export function TotalBadge({
  total,
  onValidate,
  canValidate,
}: {
  total: number;
  onValidate: () => void;
  canValidate: boolean;
}) {
  return (
    <section className={`${panelAccent} flex w-full flex-col items-center justify-center gap-3 text-center`}>
      <div className="w-full">
        <p className={panelEyebrow}>Total à facturer</p>
        <p className={`mt-1 font-display text-3xl leading-none ${textBrand} ${money}`}>
          {formatMoney(total)}
        </p>
      </div>
      <button
        type="button"
        onClick={onValidate}
        disabled={!canValidate}
        className={`${btnPrimary} w-full`}
      >
        Valider facture
      </button>
    </section>
  );
}
