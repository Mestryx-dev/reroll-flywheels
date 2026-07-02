import { useState } from 'react';
import type { AdminRepairLine } from '../../lib/admin-api';
import { createRepairLine, deleteRepairLine, updateRepairLine } from '../../lib/admin-api';
import {
  btnAccent,
  btnGhost,
  inputCompact,
  money,
  panel,
  panelEyebrow,
  panelTitle,
} from '../../lib/ui';

interface RepairLinesSectionProps {
  lines: AdminRepairLine[];
  onChange: (lines: AdminRepairLine[]) => void;
}

function kindBadge(kind: string): string {
  switch (kind) {
    case 'range_based':
      return 'Gamme';
    case 'plate':
      return 'Plaque';
    default:
      return 'Fixe';
  }
}

function kindBadgeClass(kind: string): string {
  switch (kind) {
    case 'range_based':
      return 'bg-brand-subtle text-brand';
    case 'plate':
      return 'bg-surface-elevated text-fg-secondary';
    default:
      return 'bg-surface-overlay text-fg-muted';
  }
}

const EMPTY_NEW = {
  label: '',
  price: 0,
  defaultChecked: false,
  defaultQty: '' as string,
};

export function RepairLinesSection({ lines, onChange }: RepairLinesSectionProps) {
  const [newLine, setNewLine] = useState(EMPTY_NEW);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleLines = lines.filter((line) => line.enabled);

  async function handleCreate() {
    setMessage(null);
    try {
      const line = await createRepairLine({
        label: newLine.label,
        price: newLine.price,
        defaultChecked: newLine.defaultChecked,
        defaultQty: newLine.defaultQty === '' ? null : Number.parseInt(newLine.defaultQty, 10),
      });
      onChange([...lines, line]);
      setNewLine(EMPTY_NEW);
      setMessage(`Ligne « ${line.label} » ajoutée.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur');
    }
  }

  async function patchLine(id: string, patch: Parameters<typeof updateRepairLine>[1]) {
    setBusyId(id);
    setMessage(null);
    try {
      const updated = await updateRepairLine(id, patch);
      onChange(lines.map((line) => (line.id === id ? updated : line)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setMessage(null);
    try {
      await deleteRepairLine(id);
      onChange(lines.map((line) => (line.id === id ? { ...line, enabled: false } : line)));
      setMessage('Ligne supprimée.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className={panel}>
      <div className="mb-3">
        <p className={panelEyebrow}>Facture</p>
        <h2 className={panelTitle}>Lignes à facturer</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-wider text-fg-muted">
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Libellé</th>
              <th className="px-2 py-2">Prix</th>
              <th className="px-2 py-2">Coché</th>
              <th className="px-2 py-2">Qté déf.</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {visibleLines.map((line) => {
              const locked = line.kind === 'range_based' || line.kind === 'plate';
              const priceEditable = !locked || line.kind === 'plate';
              return (
                <tr key={line.id} className="border-b border-border/60">
                  <td className="px-2 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${kindBadgeClass(line.kind)}`}
                    >
                      {kindBadge(line.kind)}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className={inputCompact}
                      value={line.label}
                      disabled={busyId === line.id}
                      onChange={(event) =>
                        onChange(
                          lines.map((row) =>
                            row.id === line.id ? { ...row, label: event.target.value } : row,
                          ),
                        )
                      }
                      onBlur={(event) => {
                        if (event.target.value.trim() !== line.label) {
                          void patchLine(line.id, { label: event.target.value.trim() });
                        }
                      }}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {priceEditable ? (
                      <input
                        type="number"
                        min="0"
                        className={`${inputCompact} ${money} max-w-24`}
                        value={line.price}
                        disabled={busyId === line.id}
                        onChange={(event) =>
                          onChange(
                            lines.map((row) =>
                              row.id === line.id
                                ? { ...row, price: Number.parseInt(event.target.value, 10) || 0 }
                                : row,
                            ),
                          )
                        }
                        onBlur={(event) => {
                          const price = Number.parseInt(event.target.value, 10) || 0;
                          if (price !== line.price) {
                            void patchLine(line.id, { price });
                          }
                        }}
                      />
                    ) : (
                      <span className={`${money} text-fg-muted`}>—</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={line.defaultChecked}
                      disabled={busyId === line.id}
                      onChange={(event) => void patchLine(line.id, { defaultChecked: event.target.checked })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="1"
                      className={`${inputCompact} max-w-16`}
                      value={line.defaultQty ?? ''}
                      placeholder="—"
                      disabled={busyId === line.id}
                      onChange={(event) => {
                        const raw = event.target.value;
                        onChange(
                          lines.map((row) =>
                            row.id === line.id
                              ? {
                                  ...row,
                                  defaultQty: raw === '' ? null : Number.parseInt(raw, 10),
                                }
                              : row,
                          ),
                        );
                      }}
                      onBlur={(event) => {
                        const raw = event.target.value;
                        const defaultQty = raw === '' ? null : Number.parseInt(raw, 10);
                        if (defaultQty !== line.defaultQty) {
                          void patchLine(line.id, { defaultQty });
                        }
                      }}
                    />
                  </td>
                  <td className="px-2 py-2 text-right">
                    {!locked ? (
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={busyId === line.id}
                        onClick={() => void handleDelete(line.id)}
                      >
                        Suppr.
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-border p-3">
        <p className="mb-2 text-xs font-medium text-fg-secondary">Nouvelle ligne fixe</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto] sm:items-end">
          <label className="block space-y-1">
            <span className="text-xs text-fg-muted">Libellé</span>
            <input
              className={inputCompact}
              value={newLine.label}
              onChange={(event) => setNewLine((current) => ({ ...current, label: event.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-fg-muted">Prix</span>
            <input
              type="number"
              min="0"
              className={inputCompact}
              value={newLine.price}
              onChange={(event) =>
                setNewLine((current) => ({
                  ...current,
                  price: Number.parseInt(event.target.value, 10) || 0,
                }))
              }
            />
          </label>
          <label className="flex items-center gap-2 pt-5 text-xs">
            <input
              type="checkbox"
              checked={newLine.defaultChecked}
              onChange={(event) =>
                setNewLine((current) => ({ ...current, defaultChecked: event.target.checked }))
              }
            />
            Coché
          </label>
          <button
            type="button"
            className={btnAccent}
            disabled={!newLine.label.trim()}
            onClick={() => void handleCreate()}
          >
            Ajouter
          </button>
        </div>
      </div>

      {message ? <p className="mt-2 text-xs text-fg-muted">{message}</p> : null}
    </section>
  );
}
