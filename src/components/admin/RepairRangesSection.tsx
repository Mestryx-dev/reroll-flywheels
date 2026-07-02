import { useEffect, useMemo, useState } from 'react';
import type { AdminRangeRow } from '../../lib/admin-api';
import { saveRepairByRange } from '../../lib/admin-api';
import { btnPrimary } from '../../lib/ui';
import {
  adminFieldPrice,
  adminRangeColHead,
  adminRangeColRow,
  adminSection,
  adminSectionHead,
  adminSectionHint,
  adminSectionTitle,
  adminStatus,
  parseAdminInt,
} from './admin-ui';

interface RepairRangesSectionProps {
  ranges: AdminRangeRow[];
  onSaved: (ranges: AdminRangeRow[]) => void;
}

function chunkColumns<T>(items: T[], columnCount: number): T[][] {
  const size = Math.ceil(items.length / columnCount);
  return Array.from({ length: columnCount }, (_, index) =>
    items.slice(index * size, index * size + size),
  ).filter((column) => column.length > 0);
}

interface RangeColumnProps {
  rows: AdminRangeRow[];
  priceText: Record<string, string>;
  onPriceChange: (rangeKey: string, value: string) => void;
}

function RangeColumn({ rows, priceText, onPriceChange }: RangeColumnProps) {
  return (
    <div className="min-w-0">
      <div className={adminRangeColHead}>
        <span>Gamme</span>
        <span className="text-right">Prix</span>
      </div>
      {rows.map((row) => (
        <div key={row.rangeKey} className={adminRangeColRow}>
          <span className="truncate font-mono text-[10px] leading-tight text-fg-secondary" title={row.label}>
            {row.rangeKey}
          </span>
          <input
            type="text"
            inputMode="numeric"
            className={adminFieldPrice}
            value={priceText[row.rangeKey] ?? String(row.price)}
            onChange={(event) => onPriceChange(row.rangeKey, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export function RepairRangesSection({ ranges, onSaved }: RepairRangesSectionProps) {
  const [draft, setDraft] = useState(ranges);
  const [priceText, setPriceText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const columns = useMemo(() => chunkColumns(draft, 3), [draft]);

  useEffect(() => {
    setDraft(ranges);
    setPriceText(Object.fromEntries(ranges.map((row) => [row.rangeKey, String(row.price)])));
  }, [ranges]);

  async function handleSave() {
    const payload = draft.map((row) => ({
      ...row,
      price: parseAdminInt(priceText[row.rangeKey] ?? String(row.price)),
    }));

    setSaving(true);
    setMessage(null);
    try {
      const saved = await saveRepairByRange(payload);
      onSaved(saved);
      setDraft(saved);
      setPriceText(Object.fromEntries(saved.map((row) => [row.rangeKey, String(row.price)])));
      setMessage('Enregistré');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={adminSection}>
      <div className={adminSectionHead}>
        <div>
          <h2 className={adminSectionTitle}>Réparations par gamme</h2>
          <p className={adminSectionHint}>Ligne « Réparations » — prix par gamme véhicule</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void handleSave()}>
            Enregistrer
          </button>
          {message ? <span className={adminStatus}>{message}</span> : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {columns.map((column, index) => (
          <RangeColumn
            key={`range-col-${index}`}
            rows={column}
            priceText={priceText}
            onPriceChange={(rangeKey, value) =>
              setPriceText((current) => ({ ...current, [rangeKey]: value }))
            }
          />
        ))}
      </div>
    </section>
  );
}
