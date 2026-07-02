import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { btnPrimary, panelEyebrow } from '../lib/ui';

interface RpDisclaimerModalProps {
  onAcknowledge: () => void;
}

const BULLETS = [
  'Cette calculette n’a pas été vérifiée ni validée en RP par Flywheels ou la direction garage.',
  'Les tarifs et totaux sont indicatifs — à confirmer en jeu avant de facturer.',
  'En cas de doute, demandez validation à la direction avant d’engager l’entreprise.',
] as const;

export function RpDisclaimerModal({ onAcknowledge }: RpDisclaimerModalProps) {
  const reduceMotion = useReducedMotion();
  const { dialogRef, initialFocusRef } = useDialogA11y(true, onAcknowledge, {
    closeOnEscape: false,
  });

  const overlayMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

  const panelMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 8 },
        transition: { type: 'spring' as const, stiffness: 340, damping: 30 },
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-bg/80 backdrop-blur-md"
        {...overlayMotion}
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rp-disclaimer-title"
        aria-describedby="rp-disclaimer-body rp-disclaimer-refresh-note"
        {...panelMotion}
        className="fw-panel fw-panel-accent relative z-10 w-full max-w-md overflow-hidden shadow-[var(--fw-shadow-float)]"
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-brand" aria-hidden />

        <div className="relative px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start gap-3">
            <div
              className="fw-logo-badge mt-0.5 h-10 w-10 shrink-0 text-base"
              role="img"
              aria-label="Avertissement"
            >
              !
            </div>
            <div className="min-w-0 pt-0.5">
              <p className={panelEyebrow}>Flywheels · Avertissement RP</p>
              <h2
                id="rp-disclaimer-title"
                className="font-display text-lg leading-tight tracking-wide text-fg sm:text-xl"
              >
                Outil non validé en roleplay
              </h2>
            </div>
          </div>

          <div
            id="rp-disclaimer-body"
            className="mt-4 rounded-lg border border-border/70 bg-surface-sunken/60 px-3.5 py-3"
          >
            <ul className="space-y-2.5 text-left text-sm leading-relaxed text-fg-secondary">
              {BULLETS.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <p
            id="rp-disclaimer-refresh-note"
            className="mt-3 text-center text-xs text-fg-muted"
          >
            Ce message s&apos;affiche à chaque chargement ou actualisation de la page.
          </p>

          <button
            ref={initialFocusRef}
            type="button"
            onClick={onAcknowledge}
            className={`${btnPrimary} mt-4 w-full py-2.5 text-sm`}
          >
            J&apos;ai compris — accéder à la calculette
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function useRpDisclaimerVisible(): [boolean, () => void] {
  const [visible, setVisible] = useState(true);
  return [visible, () => setVisible(false)];
}
