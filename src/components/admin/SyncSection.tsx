import { useCallback, useEffect, useState } from 'react';
import {
  applySync,
  fetchSyncRuns,
  previewSync,
  type SyncPreviewResult,
  type SyncRun,
  type SyncSource,
} from '../../lib/admin-api';
import { btnAccent, btnGhost } from '../../lib/ui';
import {
  adminSection,
  adminSectionHead,
  adminSectionHint,
  adminSectionTitle,
  adminStatus,
} from './admin-ui';

interface SyncSectionProps {
  onApplied: () => void;
}

const SOURCE_LABELS: Record<SyncSource, string> = {
  data: 'Data',
  calculette: 'Calculette',
};

function formatRunSummary(run: SyncRun): string {
  if (run.summary?.message && typeof run.summary.message === 'string') {
    return run.summary.message;
  }
  const counts = run.summary?.counts as
    | { added?: number; updated?: number; removed?: number }
    | undefined;
  if (!counts) {
    return run.status === 'ok' ? 'OK' : 'Erreur';
  }
  return `+${counts.added ?? 0} ~${counts.updated ?? 0} -${counts.removed ?? 0}`;
}

function PreviewBlock({ preview }: { preview: SyncPreviewResult }) {
  if (preview.sections.every((section) => section.changes.length === 0)) {
    return <p className="text-xs text-fg-muted">Aucun changement détecté.</p>;
  }

  return (
    <div className="space-y-2">
      {preview.sections.map((section) => (
        <div key={section.source} className="rounded-md border border-border/70 bg-surface-sunken/50 p-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-fg-secondary">
            {section.label}
          </p>
          <p className="mb-1.5 text-[10px] text-fg-muted">
            +{section.counts.added} · ~{section.counts.updated} · -{section.counts.removed}
          </p>
          <ul className="max-h-28 space-y-0.5 overflow-y-auto text-xs text-fg-secondary">
            {section.changes.slice(0, 12).map((change) => (
              <li key={`${change.entity}-${change.key}-${change.action}`} className="truncate">
                <span className="text-fg-muted">{change.action}: </span>
                {change.summary}
              </li>
            ))}
            {section.changes.length > 12 ? (
              <li className="text-fg-muted">… {section.changes.length - 12} autres</li>
            ) : null}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function SyncSection({ onApplied }: SyncSectionProps) {
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [preview, setPreview] = useState<SyncPreviewResult | null>(null);
  const [busy, setBusy] = useState<SyncSource | 'apply' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    try {
      setRuns(await fetchSyncRuns());
    } catch {
      setRuns([]);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  async function handlePreview(source: SyncSource) {
    setBusy(source);
    setMessage(null);
    try {
      const result = await previewSync([source]);
      setPreview(result);
      const section = result.sections.find((item) => item.source === source);
      if (!section || section.changes.length === 0) {
        setMessage(`${SOURCE_LABELS[source]} : aucun changement`);
      } else {
        const { added, updated, removed } = section.counts;
        setMessage(
          `${SOURCE_LABELS[source]} : +${added} · ~${updated} · -${removed}`,
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Prévisualisation impossible');
      setPreview(null);
    } finally {
      setBusy(null);
    }
  }

  async function handleApply(source: SyncSource) {
    setBusy('apply');
    setMessage(null);
    try {
      if (!preview || !preview.sections.some((section) => section.source === source)) {
        setPreview(await previewSync([source]));
      }
      await applySync([source]);
      setMessage(`${SOURCE_LABELS[source]} importé`);
      setPreview(null);
      await loadRuns();
      onApplied();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import impossible');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={adminSection}>
      <div className={adminSectionHead}>
        <div>
          <h2 className={adminSectionTitle}>Sync Google Sheet</h2>
          <p className={adminSectionHint}>
            Data = CSV véhicules + gammes (G/H) · Calculette = lignes facture
          </p>
        </div>
        {message ? <span className={adminStatus}>{message}</span> : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {(['data', 'calculette'] as const).map((source) => (
          <div
            key={source}
            className="rounded-md border border-border bg-surface-elevated/30 p-2.5"
          >
            <p className="mb-2 text-xs font-medium text-fg">{SOURCE_LABELS[source]}</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className={btnGhost}
                disabled={busy !== null}
                onClick={() => void handlePreview(source)}
              >
                {busy === source ? '…' : 'Prévisualiser'}
              </button>
              <button
                type="button"
                className={btnAccent}
                disabled={busy !== null}
                onClick={() => void handleApply(source)}
              >
                Importer
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview ? (
        <div className="mt-2">
          <PreviewBlock preview={preview} />
        </div>
      ) : null}

      {runs.length > 0 ? (
        <div className="mt-3 border-t border-border/50 pt-2">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-fg-muted">Derniers imports</p>
          <ul className="space-y-0.5 text-[11px] text-fg-secondary">
            {runs.slice(0, 5).map((run) => (
              <li key={run.id} className="flex justify-between gap-2">
                <span className="truncate">
                  {new Date(run.startedAt).toLocaleString('fr-FR')} · {run.source}
                </span>
                <span className={run.status === 'ok' ? 'text-brand' : 'text-red-500'}>
                  {formatRunSummary(run)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
