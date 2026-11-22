import React from 'react';
import { HelpCircle, X, BookOpen, Key, Link2, Layers, Network, Database, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display text-base">
                SaasCreator Architecture & Schema Guide
              </h3>
              <p className="text-xs text-slate-500">
                Learn how to construct relational schemas, LOVs, and master-detail forms.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-600">
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 font-display text-sm flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-600" />
              1. Visual D3 Schema Map
            </h4>
            <p className="leading-relaxed">
              The D3-powered relational canvas automatically parses all table schemas, primary keys, and foreign keys into a physics-simulated graph. You can pan, zoom, drag table nodes, inspect relationships, and see real-time cardinality (1:N, 1:1) and CASCADE rules.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 font-display text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              2. Primary Keys & Auto-IDs
            </h4>
            <p className="leading-relaxed">
              Every relational entity must have a designated Primary Key. With the <code>autoid</code> type, SaasCreator generates structured incremental identifiers (such as <code>CUST-0001</code>, <code>INV-0042</code>) automatically when creating new records.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 font-display text-sm flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" />
              3. Foreign Keys & Referential Integrity
            </h4>
            <p className="leading-relaxed">
              Foreign keys link a field in a child table to the primary key of a parent entity. You can configure:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>RESTRICT:</strong> Prevents deleting a parent record if dependent child rows exist.</li>
              <li><strong>CASCADE:</strong> Automatically removes child records when the parent is deleted.</li>
              <li><strong>SET NULL:</strong> Clears the foreign key reference in child records without deleting them.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 font-display text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-pink-600" />
              4. Master-Detail Forms & LOV Pickers
            </h4>
            <p className="leading-relaxed">
              Build invoice-style line item grids where a parent record displays an editable sub-grid of child records. Fields configured with <strong>LOV (List of Values)</strong> provide interactive modal record pickers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
