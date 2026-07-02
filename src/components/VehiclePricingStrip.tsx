import { motion } from 'framer-motion';
import type { VehiclePricing } from '../lib/types';
import { formatMoney } from '../lib/format';
import { money, panel, panelEyebrow, textBrand, textMuted } from '../lib/ui';

interface VehiclePricingStripProps {
  vehicle: VehiclePricing;
}

export function VehiclePricingStrip({ vehicle }: VehiclePricingStripProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${panel} relative min-w-0 overflow-hidden`}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-brand" />
      <p className={`${panelEyebrow} mb-2 truncate px-2 text-center`}>{vehicle.model}</p>
      <div className="grid grid-cols-2 gap-1.5 px-2 sm:grid-cols-5">
        <Metric label="Type" value={vehicle.range} text />
        <Metric label="HT" value={formatMoney(vehicle.priceHT)} />
        <Metric label="TTC" value={formatMoney(vehicle.priceTTC)} accent />
        <Metric label="Explo." value={formatMoney(vehicle.explosion)} />
        <Metric label="Noyade" value={formatMoney(vehicle.noyade)} />
      </div>
    </motion.section>
  );
}

function Metric({
  label,
  value,
  accent,
  highlight,
  text,
}: {
  label: string;
  value: string;
  accent?: boolean;
  highlight?: boolean;
  text?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 text-center transition ${
        accent || highlight
          ? 'border-brand/30 bg-brand-subtle'
          : 'border-border bg-surface-sunken'
      }`}
    >
      <p className={`text-[10px] font-medium uppercase tracking-wide ${textMuted}`}>{label}</p>
      <p
        className={`truncate text-xs font-semibold ${money} ${
          text ? 'text-fg-secondary' : highlight || accent ? textBrand : 'text-fg'
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
