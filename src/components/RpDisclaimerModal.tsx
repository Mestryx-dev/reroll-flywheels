import { useState } from 'react';
import { motion } from 'framer-motion';
import { btnPrimary, panelEyebrow, panelTitle } from '../lib/ui';

interface RpDisclaimerModalProps {
  onAcknowledge: () => void;
}

export function RpDisclaimerModal({ onAcknowledge }: RpDisclaimerModalProps) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rp-disclaimer-title"
      aria-describedby="rp-disclaimer-body"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="fw-panel relative z-10 w-full max-w-xl border-2 border-brand/40 p-6 text-center shadow-[var(--fw-shadow-float)] sm:p-8"
      >
        <p className={`${panelEyebrow} mb-3`}>Avertissement RP</p>
        <h2
          id="rp-disclaimer-title"
          className={`${panelTitle} text-xl leading-snug sm:text-2xl`}
        >
          Outil non validé en roleplay
        </h2>
        <div
          id="rp-disclaimer-body"
          className="mx-auto mt-5 max-w-md space-y-3 text-sm leading-relaxed text-fg-secondary sm:text-base"
        >
          <p>
            Cette calculette <strong className="text-fg">n&apos;a pas été vérifiée ni validée en RP</strong>{' '}
            par Flywheels ou la direction garage.
          </p>
          <p>
            Les tarifs et totaux sont indicatifs. En cas de doute, confirmez en jeu avant de facturer un
            client ou d&apos;engager l&apos;entreprise.
          </p>
        </div>
        <p className="mt-6 font-mono-num text-xs uppercase tracking-widest text-brand">
          Réaffiché à chaque chargement ou refresh
        </p>
        <button type="button" onClick={onAcknowledge} className={`${btnPrimary} mt-6 w-full sm:w-auto sm:min-w-[12rem]`}>
          J&apos;ai compris
        </button>
      </motion.div>
    </motion.div>
  );
}

export function useRpDisclaimerVisible(): [boolean, () => void] {
  const [visible, setVisible] = useState(true);
  return [visible, () => setVisible(false)];
}
