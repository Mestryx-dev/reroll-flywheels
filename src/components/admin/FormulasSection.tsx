import { useEffect, useState } from 'react';
import type { AppConfig } from '../../lib/runtime-catalog';
import { resetFormulas, saveFormulas } from '../../lib/admin-api';
import { btnGhost, btnPrimary, inputCompact, panel, panelEyebrow, panelTitle } from '../../lib/ui';

interface FormulasSectionProps {
  formulas: AppConfig['formulas'];
  onSaved: (formulas: AppConfig['formulas']) => void;
}

const FIELDS: Array<{ key: keyof AppConfig['formulas']; label: string; hint: string }> = [
  { key: 'ttcRate', label: 'TTC', hint: '× prix HT' },
  { key: 'explosionRate', label: 'Explosion', hint: '× prix HT' },
  { key: 'noyadeRate', label: 'Noyade', hint: '× prix HT' },
  { key: 'rachatRate', label: 'Rachat', hint: '× prix HT' },
];

export function FormulasSection({ formulas, onSaved }: FormulasSectionProps) {
  const [draft, setDraft] = useState(formulas);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraft(formulas);
  }, [formulas]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const saved = await saveFormulas(draft);
      onSaved(saved);
      setDraft(saved);
      setMessage('Formules enregistrées.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur de sauvegarde');
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
      setMessage('Valeurs par défaut restaurées.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={panel}>
      <div className="mb-3">
        <p className={panelEyebrow}>Véhicule</p>
        <h2 className={panelTitle}>Formules prix</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FIELDS.map((field) => (
          <label key={field.key} className="block space-y-1">
            <span className="text-xs font-medium text-fg-secondary">
              {field.label} <span className="text-fg-muted">({field.hint})</span>
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputCompact}
              value={draft[field.key]}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  [field.key]: Number.parseFloat(event.target.value) || 0,
                }))
              }
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={btnPrimary} disabled={saving} onClick={handleSave}>
          Enregistrer
        </button>
        <button type="button" className={btnGhost} disabled={saving} onClick={handleReset}>
          Défauts
        </button>
        {message ? <span className="text-xs text-fg-muted">{message}</span> : null}
      </div>
    </section>
  );
}
