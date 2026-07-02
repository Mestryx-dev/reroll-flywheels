import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppConfig } from '../context/ConfigContext';
import type { VehiclePricing } from '../lib/types';
import type { CartLine } from '../lib/cart';
import { createCartLine, cartTotal } from '../lib/cart';
import {
  buildCartLinesFromSelection,
  initialRepairState,
} from '../lib/formulas';
import { calcBottomGrid, calcTopGrid } from '../lib/layout';
import {
  clearCalculatorSession,
  emptyCalculatorSession,
  loadCalculatorSession,
  saveCalculatorSession,
} from '../lib/calculator-session';
import { emptyPlateChange, buildPlateChangeEntry, type PlateChangeEntry, type PlateChangeFields } from '../lib/plate-change';
import { VehiclePricingStrip } from './VehiclePricingStrip';
import { VehicleLookup } from './VehicleLookup';
import { RepairInvoice } from './RepairInvoice';
import { InvoiceCart, TotalBadge } from './InvoiceCart';
import { PlateChangeCard } from './PlateChangeCard';
import { isPlateRepairLine } from '../lib/line-kind';

interface CalculatorPanelProps {
  configKey: string;
}

export function CalculatorPanel({ configKey }: CalculatorPanelProps) {
  const { config } = useAppConfig();
  const repairs = config?.repairs ?? [];
  const repairPricing = useMemo(
    () => ({ repairByRange: config?.repairByRange ?? {} }),
    [config?.repairByRange],
  );

  const restoredSession = useMemo(() => loadCalculatorSession(repairs), [repairs]);

  const [vehicle, setVehicle] = useState<VehiclePricing | null>(
    () => restoredSession?.vehicle ?? null,
  );
  const [repairState, setRepairState] = useState(
    () => restoredSession?.repairState ?? initialRepairState(repairs),
  );
  const [cart, setCart] = useState<CartLine[]>(() => restoredSession?.cart ?? []);
  const [lookupKey, setLookupKey] = useState(0);
  const [plateChange, setPlateChange] = useState<PlateChangeFields>(
    () => restoredSession?.plateChange ?? emptyPlateChange(),
  );
  const [plateChangeOpen, setPlateChangeOpen] = useState(
    () => restoredSession?.plateChangeOpen ?? false,
  );
  const [plateChangeLines, setPlateChangeLines] = useState<PlateChangeEntry[]>(
    () => restoredSession?.plateChangeLines ?? [],
  );

  const configKeyInitialized = useRef(false);

  const total = cartTotal(cart);
  const plateChangeLine = repairs.find((line) => isPlateRepairLine(line));

  useEffect(() => {
    saveCalculatorSession({
      cart,
      vehicle,
      repairState,
      plateChange,
      plateChangeOpen,
      plateChangeLines,
    });
  }, [cart, vehicle, repairState, plateChange, plateChangeOpen, plateChangeLines]);

  useEffect(() => {
    if (!configKeyInitialized.current) {
      configKeyInitialized.current = true;
      return;
    }
    setRepairState(initialRepairState(repairs));
  }, [configKey, repairs]);

  function addToCart() {
    const entries = buildCartLinesFromSelection(repairs, repairState, vehicle, repairPricing);
    if (entries.length === 0) {
      return;
    }
    setCart((current) => [
      ...current,
      ...entries.map((entry) => createCartLine(entry.label, entry.amount)),
    ]);
    setRepairState(initialRepairState(repairs));
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

  function resetCalculatorSession() {
    const empty = emptyCalculatorSession(repairs);
    clearCalculatorSession();
    setCart(empty.cart);
    setPlateChangeLines(empty.plateChangeLines);
    setRepairState(empty.repairState);
    setVehicle(empty.vehicle);
    setPlateChange(empty.plateChange);
    setPlateChangeOpen(empty.plateChangeOpen);
    setLookupKey((key) => key + 1);
  }

  function validateInvoice() {
    resetCalculatorSession();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className={calcTopGrid}>
        <VehicleLookup
          key={lookupKey}
          compact
          selectedVehicle={vehicle}
          onSelect={setVehicle}
          hideInlinePricing
        />
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
          repairs={repairs}
          state={repairState}
          onChange={setRepairState}
          onAddToCart={addToCart}
          vehicle={vehicle}
          pricing={repairPricing}
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
