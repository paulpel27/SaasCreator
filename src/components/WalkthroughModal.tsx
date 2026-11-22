import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, X, Network, Database, Layers, Play } from 'lucide-react';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'schema' | 'runner' | 'export') => void;
}

const STEPS = [
  {
    title: "Welcome to SaasCreator",
    description: "Design full-scale relational database schemas, configure foreign key integrity, visualize architectures with D3, and run live SaaS apps in seconds.",
    icon: Sparkles,
    badge: "Step 1 of 4",
    targetTab: 'schema' as const
  },
  {
    title: "Interactive D3 Schema Map",
    description: "Explore the force-directed relational map inside the Schema Workspace. Drag tables, view connected foreign keys, and examine 1:N cardinality and cascade rules.",
    icon: Network,
    badge: "Step 2 of 4",
    targetTab: 'schema' as const
  },
  {
    title: "Tables, Fields & Auto-IDs",
    description: "Configure primary keys, prefix-based auto-increment identifiers (e.g., INV-0001), and LOV (List of Values) lookup fields connecting disparate tables.",
    icon: Database,
    badge: "Step 3 of 4",
    targetTab: 'schema' as const
  },
  {
    title: "Live Runtime & Master-Detail Forms",
    description: "Switch to 'Live App' mode to test real data entry with master-detail sub-grids, search modals, and referential integrity delete simulations.",
    icon: Play,
    badge: "Step 4 of 4",
    targetTab: 'runner' as const
  }
];

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
  onSelectTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      onSelectTab(STEPS[currentStep + 1].targetTab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      onSelectTab(STEPS[currentStep - 1].targetTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] tracking-wider uppercase">
            {step.badge}
          </span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center space-y-3 py-2">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Icon className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 font-display text-lg">
            {step.title}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {step.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="flex gap-1.5">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-indigo-600 w-4' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Finish
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
