import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { calculatorConfig } from './data';
import { Layout } from './components/Layout';
import { CalculatorPanel } from './components/CalculatorPanel';
import { VehicleCatalog } from './components/VehicleCatalog';

type View = 'calculator' | 'catalog';

function App() {
  const [view, setView] = useState<View>('calculator');

  return (
    <Layout view={view} onViewChange={setView}>
      <AnimatePresence mode="wait">
        {view === 'catalog' ? (
          <VehicleCatalog key="catalog" />
        ) : (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <CalculatorPanel config={calculatorConfig} />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

export default App;
