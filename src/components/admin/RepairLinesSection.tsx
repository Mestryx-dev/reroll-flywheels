import { useMemo, useState } from 'react';
import type { AdminRepairLine } from '../../lib/admin-api';
import { createRepairLine, deleteRepairLine, updateRepairLine } from '../../lib/admin-api';
import { btnAccent, btnGhost } from '../../lib/ui';
import {
  adminAddRow,
  adminField,
  adminFieldLabel,
  adminFieldPrice,
  adminLineHead,
  adminLineRow,
  adminSection,
  adminSectionHead,
  adminSectionHint,
  adminSectionTitle,
  adminStatus,
  parseAdminInt,
} from './admin-ui';

interface RepairLinesSectionProps {
  lines: AdminRepairLine[];
  onChange: (lines: AdminRepairLine[]) => void;
}

function kindLabel(kind: string): string {
  switch (kind) {
    case 'range_based':
      return 'Gamme';
    case 'plate':
      return 'Plaque';
    default:
      return 'Fixe';
  }
}

const EMPTY_NEW = {
  label: '',
  price: '',
  defaultChecked: false,
};

interface LineColumnProps {
  lines: AdminRepairLine[];
  allLines: AdminRepairLine[];
  busyId: string | null;
  onChange: (lines: AdminRepairLine[]) => void;
  onPatch: (id: string, patch: Parameters<typeof updateRepairLine>[1]) => void;
  onDelete: (id: string) => void;
}

function LineColumn({ lines, allLines, busyId, onChange, onPatch, onDelete }: LineColumnProps) {
  const [priceText, setPriceText] = useState<Record<string, string>>({});

  return (
    <div className="min-w-0">
      <div className={adminLineHead}>
        <span>Type</span>
        <span>Libellé</span>
        <span className="text-right">Prix</span>
        <span className="text-center">On</span>
        <span className="text-center">Qté</span>
        <span />
      </div>
      {lines.map((line) => {
        const locked = line.kind === 'range_based' || line.kind === 'plate';
        const priceEditable = !locked || line.kind === 'plate';
        const priceValue = priceText[line.id] ?? String(line.price);

        return (
          <div key={line.id} className={adminLineRow}>
            <span className="truncate text-[9px] font-semibold uppercase text-fg-muted">
              {kindLabel(line.kind)}
            </span>
            <input
              className={adminFieldLabel}
              value={line.label}
              disabled={busyId === line.id}
              onChange={(event) =>
                onChange(
                  allLines.map((row) =>
                    row.id === line.id ? { ...row, label: event.target.value } : row,
                  ),
                )
              }
              onBlur={(event) => {
                const label = event.target.value.trim();
                if (label !== line.label) {
                  onPatch(line.id, { label });
                }
              }}
            />
            {priceEditable ? (
              <input
                type="text"
                inputMode="numeric"
                className={adminFieldPrice}
                value={priceValue}
                disabled={busyId === line.id}
                onChange={(event) =>
                  setPriceText((current) => ({ ...current, [line.id]: event.target.value }))
                }
                onBlur={(event) => {
                  const price = parseAdminInt(event.target.value);
                  if (price !== line.price) {
                    onPatch(line.id, { price });
                  }
                }}
              />
            ) : (
              <span className="text-right text-xs text-fg-muted">—</span>
            )}
            <div className="flex justify-center">
              <input
                type="checkbox"
                className="accent-brand"
                checked={line.defaultChecked}
                disabled={busyId === line.id}
                onChange={(event) => onPatch(line.id, { defaultChecked: event.target.checked })}
              />
            </div>
            <input
              type="text"
              inputMode="numeric"
              className={`${adminField} text-center`}
              value={line.defaultQty ?? ''}
              placeholder="—"
              disabled={busyId === line.id}
              onChange={(event) => {
                const raw = event.target.value;
                onChange(
                  allLines.map((row) =>
                    row.id === line.id
                      ? {
                          ...row,
                          defaultQty: raw === '' ? null : parseAdminInt(raw),
                        }
                      : row,
                  ),
                );
              }}
              onBlur={(event) => {
                const raw = event.target.value;
                const defaultQty = raw === '' ? null : parseAdminInt(raw);
                if (defaultQty !== line.defaultQty) {
                  onPatch(line.id, { defaultQty });
                }
              }}
            />
            <div className="text-right">
              {!locked ? (
                <button
                  type="button"
                  className={btnGhost}
                  disabled={busyId === line.id}
                  onClick={() => onDelete(line.id)}
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RepairLinesSection({ lines, onChange }: RepairLinesSectionProps) {
  const [newLine, setNewLine] = useState(EMPTY_NEW);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleLines = useMemo(() => lines.filter((line) => line.enabled), [lines]);

  const splitIndex = Math.ceil(visibleLines.length / 2);
  const leftLines = visibleLines.slice(0, splitIndex);
  const rightLines = visibleLines.slice(splitIndex);

  async function handleCreate() {
    setMessage(null);
    try {
      const line = await createRepairLine({
        label: newLine.label,
        price: parseAdminInt(newLine.price),
        defaultChecked: newLine.defaultChecked,
      });
      onChange([...lines, line]);
      setNewLine(EMPTY_NEW);
      setMessage('Ajouté');
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
      setMessage('Supprimé');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className={adminSection}>
      <div className={adminSectionHead}>
        <div>
          <h2 className={adminSectionTitle}>Lignes facture</h2>
          <p className={adminSectionHint}>Cases cochables — calculette réparations</p>
        </div>
        {message ? <span className={adminStatus}>{message}</span> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LineColumn
          lines={leftLines}
          allLines={lines}
          busyId={busyId}
          onChange={onChange}
          onPatch={(id, patch) => void patchLine(id, patch)}
          onDelete={(id) => void handleDelete(id)}
        />
        <LineColumn
          lines={rightLines}
          allLines={lines}
          busyId={busyId}
          onChange={onChange}
          onPatch={(id, patch) => void patchLine(id, patch)}
          onDelete={(id) => void handleDelete(id)}
        />
      </div>

      <div className={adminAddRow}>
        <input
          className={adminFieldLabel}
          placeholder="Nouvelle ligne…"
          value={newLine.label}
          onChange={(event) => setNewLine((current) => ({ ...current, label: event.target.value }))}
        />
        <input
          type="text"
          inputMode="numeric"
          className={adminFieldPrice}
          placeholder="Prix"
          value={newLine.price}
          onChange={(event) => setNewLine((current) => ({ ...current, price: event.target.value }))}
        />
        <label className="flex items-center justify-center gap-1 text-xs text-fg-muted">
          <input
            type="checkbox"
            className="accent-brand"
            checked={newLine.defaultChecked}
            onChange={(event) =>
              setNewLine((current) => ({ ...current, defaultChecked: event.target.checked }))
            }
          />
          On
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
    </section>
  );
}
