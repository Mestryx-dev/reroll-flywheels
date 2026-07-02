import { motion } from 'framer-motion';
import { useState } from 'react';
import type { CalculatorConfig, VehiclePricing } from '../lib/types';
import type { CartLine } from '../lib/cart';
import { createCartLine, cartTotal } from '../lib/cart';
import {
  buildCartLinesFromSelection,
  initialRepairState,
} from '../lib/formulas';
import { calcBottomGrid, calcTopGrid } from '../lib/layout';
import { emptyPlateChange, buildPlateChangeEntry, type PlateChangeEntry, type PlateChangeFields } from '../lib/plate-change';
import { VehiclePricingStrip } from './VehiclePricingStrip';
import { VehicleLookup } from './VehicleLookup';
import { RepairInvoice } from './RepairInvoice';
import { InvoiceCart, TotalBadge } from './InvoiceCart';
import { PlateChangeCard } from './PlateChangeCard';
import { isPlateRepairLine } from '../lib/line-kind';

interface CalculatorPanelProps {
  config: CalculatorConfig;
}

export function CalculatorPanel({ config }: CalculatorPanelProps) {
  const [vehicle, setVehicle] = useState<VehiclePricing | null>(null);
  const [repairState, setRepairState] = useState(() => initialRepairState(config.repairs));
  const [cart, setCart] = useState<CartLine[]>([]);
  const [lookupKey, setLookupKey] = useState(0);
  const [plateChange, setPlateChange] = useState<PlateChangeFields>(emptyPlateChange);
  const [plateChangeOpen, setPlateChangeOpen] = useState(false);
  const [plateChangeLines, setPlateChangeLines] = useState<PlateChangeEntry[]>([]);

  const total = cartTotal(cart);
  const plateChangeLine = config.repairs.find((line) => isPlateRepairLine(line));

  function addToCart() {
    const entries = buildCartLinesFromSelection(config.repairs, repairState, vehicle);
    if (entries.length === 0) {
      return;
    }
    setCart((current) => [
      ...current,
      ...entries.map((entry) => createCartLine(entry.label, entry.amount)),
    ]);
    setRepairState(initialRepairState(config.repairs));
  }

  function commitPlateChange() {
    if (!plateChangeLine) {
      return;
    }
    const entry = buildPlateChangeEntry(plateChangeLine.price, plateChange, vehicle);
    if (!entry) {
      return;
    }
    setPlateChangeLines((current) => [...current, entry]);
    setPlateChange(emptyPlateChange());
  }

  function removePlateChangeLine(id: string) {
    setPlateChangeLines((current) => current.filter((line) => line.id !== id));
  }

  function removeFromCart(id: string) {
    setCart((current) => current.filter((line) => line.id !== id));
  }

  function validateInvoice() {
    setCart([]);
    setPlateChangeLines([]);
    setRepairState(initialRepairState(config.repairs));
    setVehicle(null);
    setPlateChange(emptyPlateChange());
    setPlateChangeOpen(false);
    setLookupKey((key) => key + 1);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className={calcTopGrid}>
        <VehicleLookup key={lookupKey} compact onSelect={setVehicle} hideInlinePricing />
        {vehicle ? (
          <VehiclePricingStrip vehicle={vehicle} />
        ) : (
          <div className="fw-panel hidden min-h-[5.5rem] items-center justify-center border-dashed lg:flex">
            <p className="px-4 text-center text-xs text-fg-subtle">
              Sélectionne un véhicule pour voir les tarifs
            </p>
          </div>
        )}
      </div>

      <div className={calcBottomGrid}>
        <RepairInvoice
          repairs={config.repairs}
          state={repairState}
          onChange={setRepairState}
          onAddToCart={addToCart}
          vehicle={vehicle}
        />
        <div className="flex flex-col gap-3">
          {plateChangeLine ? (
            <PlateChangeCard
              line={plateChangeLine}
              checked={plateChangeOpen}
              onToggle={() => setPlateChangeOpen((open) => !open)}
              fields={plateChange}
              onFieldsChange={setPlateChange}
              onCommit={commitPlateChange}
              committedLines={plateChangeLines}
              onRemoveCommitted={removePlateChangeLine}
              vehicle={vehicle}
            />
          ) : null}
          <InvoiceCart lines={cart} onRemove={removeFromCart} onClear={() => setCart([])} />
          <TotalBadge total={total} canValidate={cart.length > 0} onValidate={validateInvoice} />
        </div>
      </div>
    </motion.div>
  );
}
