import React, { useState } from 'react';
import { SaaSAppSchema } from '../types';
import { Sparkles, Wand2, Database, X, Loader2, Check } from 'lucide-react';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySchema: (newSchema: SaaSAppSchema, seedData: Record<string, any[]>) => void;
}

export const AIConfigModal: React.FC<AIConfigModalProps> = ({
  isOpen,
  onClose,
  onApplySchema
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      if (!res.ok) {
        throw new Error('Failed to generate schema from server');
      }

      const data = await res.json();
      if (data.schema && data.seedData) {
        onApplySchema(data.schema, data.seedData);
        onClose();
      } else {
        throw new Error('Invalid schema structure received');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while communicating with AI service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display text-base">
                AI Schema Architect
              </h3>
              <p className="text-xs text-slate-500">
                Describe your application domain to generate relational tables, primary keys, and foreign keys.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">What SaaS platform do you want to build?</label>
            <textarea
              rows={4}
              required
              placeholder="e.g. A dental clinic management system with Patients, Appointments, Dentists, and Treatments with cascade billing..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-indigo-900 space-y-1">
            <span className="font-bold text-[11px] uppercase tracking-wider block">Generated Assets:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-indigo-800">
              <li>Relational entity tables with primary & foreign keys</li>
              <li>Master-Detail forms with sub-grids</li>
              <li>D3 visual diagram schema mappings</li>
              <li>Realistic mock seed records for immediate preview</li>
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Architecting Schema...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Architecture
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
