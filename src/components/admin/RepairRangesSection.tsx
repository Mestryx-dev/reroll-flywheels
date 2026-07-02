import { useEffect, useState } from 'react';
import type { AdminRangeRow } from '../../lib/admin-api';
import { saveRepairByRange } from '../../lib/admin-api';
import { btnPrimary } from '../../lib/ui';
import {
  adminFieldPrice,
  adminRangeGrid,
  adminRangeTile,
  adminRangeTileLabel,
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

interface RangeTileProps {
  row: AdminRangeRow;
  priceValue: string;
  onPriceChange: (rangeKey: string, value: string) => void;
}

function RangeTile({ row, priceValue, onPriceChange }: RangeTileProps) {
  return (
    <div className={adminRangeTile}>
      <span className={adminRangeTileLabel} title={row.label}>
        {row.rangeKey}
      </span>
      <input
        type="text"
        inputMode="numeric"
        className={adminFieldPrice}
        aria-label={`Prix ${row.label}`}
        value={priceValue}
        onChange={(event) => onPriceChange(row.rangeKey, event.target.value)}
      />
    </div>
  );
}

export function RepairRangesSection({ ranges, onSaved }: RepairRangesSectionProps) {
  const [draft, setDraft] = useState(ranges);
  const [priceText, setPriceText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

      <div className={adminRangeGrid}>
        {draft.map((row) => (
          <RangeTile
            key={row.rangeKey}
            row={row}
            priceValue={priceText[row.rangeKey] ?? String(row.price)}
            onPriceChange={(rangeKey, value) =>
              setPriceText((current) => ({ ...current, [rangeKey]: value }))
            }
          />
        ))}
      </div>
    </section>
  );
}
