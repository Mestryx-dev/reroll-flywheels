import { useEffect, useState } from 'react';
import type { AdminRangeRow } from '../../lib/admin-api';
import { saveRepairByRange } from '../../lib/admin-api';
import { formatMoney } from '../../lib/format';
import {
  btnPrimary,
  inputCompact,
  money,
  panel,
  panelEyebrow,
  panelTitle,
} from '../../lib/ui';

interface RepairRangesSectionProps {
  ranges: AdminRangeRow[];
  onSaved: (ranges: AdminRangeRow[]) => void;
}

export function RepairRangesSection({ ranges, onSaved }: RepairRangesSectionProps) {
  const [draft, setDraft] = useState(ranges);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraft(ranges);
  }, [ranges]);

  function updateRow(index: number, patch: Partial<AdminRangeRow>) {
    setDraft((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const saved = await saveRepairByRange(draft);
      onSaved(saved);
      setDraft(saved);
      setMessage('Gammes enregistrées.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={panel}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className={panelEyebrow}>Réparations</p>
          <h2 className={panelTitle}>Prix par gamme</h2>
          <p className="mt-1 text-xs text-fg-muted">
            Utilisé pour la ligne « Réparations » selon la gamme du véhicule.
          </p>
        </div>
        <button type="button" className={btnPrimary} disabled={saving} onClick={() => void handleSave()}>
          Enregistrer les gammes
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {draft.map((row, index) => (
          <div
            key={row.rangeKey}
            className="rounded-lg border border-border bg-surface-elevated/40 p-2.5"
          >
            <p className="mb-1 text-[10px] uppercase tracking-wider text-fg-muted">{row.rangeKey}</p>
            <label className="mb-2 block space-y-1">
              <span className="text-xs text-fg-secondary">Libellé</span>
              <input
                className={inputCompact}
                value={row.label}
                onChange={(event) => updateRow(index, { label: event.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-fg-secondary">Prix</span>
              <input
                type="number"
                min="0"
                className={`${inputCompact} ${money}`}
                value={row.price}
                onChange={(event) =>
                  updateRow(index, { price: Number.parseInt(event.target.value, 10) || 0 })
                }
              />
            </label>
            <p className={`mt-1 text-right text-xs ${money} text-fg-muted`}>
              {formatMoney(row.price)}
            </p>
          </div>
        ))}
      </div>

      {message ? <p className="mt-2 text-xs text-fg-muted">{message}</p> : null}
    </section>
  );
}
