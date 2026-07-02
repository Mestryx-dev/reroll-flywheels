import { useEffect, useState } from 'react';
import type { AppConfig } from '../../lib/runtime-catalog';
import { resetFormulas, saveFormulas } from '../../lib/admin-api';
import { btnGhost, btnPrimary } from '../../lib/ui';
import {
  adminFieldCoef,
  adminFormulaCard,
  adminSection,
  adminSectionHead,
  adminSectionHint,
  adminSectionTitle,
  adminStatus,
  parseAdminFloat,
} from './admin-ui';

interface FormulasSectionProps {
  formulas: AppConfig['formulas'];
  onSaved: (formulas: AppConfig['formulas']) => void;
}

const FIELDS: Array<{ key: keyof AppConfig['formulas']; label: string }> = [
  { key: 'ttcRate', label: 'TTC' },
  { key: 'explosionRate', label: 'Explosion' },
  { key: 'noyadeRate', label: 'Noyade' },
];

export function FormulasSection({ formulas, onSaved }: FormulasSectionProps) {
  const [draft, setDraft] = useState(formulas);
  const [draftText, setDraftText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraft(formulas);
    setDraftText({
      ttcRate: String(formulas.ttcRate),
      explosionRate: String(formulas.explosionRate),
      noyadeRate: String(formulas.noyadeRate),
    });
  }, [formulas]);

  async function handleSave() {
    const payload: AppConfig['formulas'] = {
      ttcRate: parseAdminFloat(draftText.ttcRate ?? String(draft.ttcRate)),
      explosionRate: parseAdminFloat(draftText.explosionRate ?? String(draft.explosionRate)),
      noyadeRate: parseAdminFloat(draftText.noyadeRate ?? String(draft.noyadeRate)),
    };

    setSaving(true);
    setMessage(null);
    try {
      const saved = await saveFormulas(payload);
      onSaved(saved);
      setDraft(saved);
      setMessage('Enregistré');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    setMessage(null);
    try {
      const saved = await resetFormulas();
      onSaved(saved);
      setDraft(saved);
      setMessage('Défauts');
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
          <h2 className={adminSectionTitle}>Coefficients véhicule</h2>
          <p className={adminSectionHint}>Multiplicateurs × prix HT</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void handleSave()}>
            Enregistrer
          </button>
          <button type="button" className={btnGhost} disabled={saving} onClick={() => void handleReset()}>
            Défauts
          </button>
          {message ? <span className={adminStatus}>{message}</span> : null}
        </div>
      </div>

      <div className="grid max-w-sm grid-cols-3 gap-1.5">
        {FIELDS.map((field) => (
          <label key={field.key} className={adminFormulaCard}>
            <span className="text-[9px] font-medium uppercase tracking-wide text-fg-muted">
              {field.label}
            </span>
            <input
              type="text"
              inputMode="decimal"
              className={adminFieldCoef}
              value={draftText[field.key] ?? String(draft[field.key])}
              onChange={(event) =>
                setDraftText((current) => ({ ...current, [field.key]: event.target.value }))
              }
            />
          </label>
        ))}
      </div>
    </section>
  );
}
