import React, { useState } from 'react';
import { SaaSAppSchema, TableDefinition } from './types';
import { DEFAULT_SAAS_SCHEMA, DEFAULT_SAAS_DATA } from './data/defaultSaaS';
import { PRESET_TEMPLATES } from './data/templates';
import { DatabaseManager } from './components/DatabaseManager';
import { AppRunner } from './components/AppRunner';
import { ExportManager } from './components/ExportManager';
import { AIConfigModal } from './components/AIConfigModal';
import { ChatAssistant } from './components/ChatAssistant';
import { HelpModal } from './components/HelpModal';
import { WalkthroughModal } from './components/WalkthroughModal';
import { 
  Database, 
  Layers, 
  Play, 
  Download, 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  RotateCcw, 
  ChevronDown, 
  Check, 
  Network,
  Bot,
  Box,
  Share2
} from 'lucide-react';

export default function App() {
  const [schema, setSchema] = useState<SaaSAppSchema>(DEFAULT_SAAS_SCHEMA);
  const [appData, setAppData] = useState<Record<string, any[]>>(DEFAULT_SAAS_DATA);
  const [activeTab, setActiveTab] = useState<'schema' | 'runner' | 'export'>('schema');

  // Modals state
  const [showAiModal, setShowAiModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Update tables in schema
  const handleUpdateTables = (updatedTables: TableDefinition[]) => {
    setSchema((prev) => ({
      ...prev,
      tables: updatedTables
    }));
  };

  // Load a preset template
  const handleLoadTemplate = (templateId: string) => {
    const template = PRESET_TEMPLATES.find((t: any) => t.id === templateId);
    if (template) {
      if (confirm(`Load "${template.name}" template? This will replace your current working schema.`)) {
        setSchema(template.schema);
        setAppData(template.seedData);
        setShowTemplateDropdown(false);
      }
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm("Reset application to default Invoice & Billing ERP schema?")) {
      setSchema(DEFAULT_SAAS_SCHEMA);
      setAppData(DEFAULT_SAAS_DATA);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white" id="saascreator-root">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4" id="app-header">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base font-display tracking-tight">SaasCreator</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Relational Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Schema Architect & Live Master-Detail App Builder</p>
          </div>
        </div>

        {/* Primary View Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/60" id="main-nav-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'schema'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            id="nav-schema-tab"
          >
            <Network className="w-4 h-4" />
            <span>Schema Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('runner')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'runner'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            id="nav-runner-tab"
          >
            <Play className="w-4 h-4 ml-0.5 text-emerald-400" />
            <span>Live App</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            id="nav-export-tab"
          >
            <Download className="w-4 h-4" />
            <span>Export & SQL</span>
          </button>
        </div>

        {/* Top Right Action Tools */}
        <div className="flex items-center gap-2" id="header-action-tools">
          {/* Templates Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              <span>Templates</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
            </button>

            {showTemplateDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-fade-in font-sans">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pre-Built SaaS Templates
                </div>
                {PRESET_TEMPLATES.map((tmpl: any) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleLoadTemplate(tmpl.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-start gap-2.5 text-xs group"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-indigo-300">{tmpl.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{tmpl.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Schema Generator Trigger */}
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            id="btn-ai-generator"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">AI Architect</span>
          </button>

          {/* Walkthrough Guide */}
          <button
            type="button"
            onClick={() => setShowWalkthrough(true)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            title="Interactive Walkthrough"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Help */}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            title="Documentation & Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="Reset to Default"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6" id="main-app-container">
        {activeTab === 'schema' && (
          <DatabaseManager
            tables={schema.tables}
            onUpdateTables={handleUpdateTables}
            onOpenAiGenerator={() => setShowAiModal(true)}
          />
        )}

        {activeTab === 'runner' && (
          <AppRunner
            schema={schema}
            appData={appData}
            onUpdateAppData={setAppData}
          />
        )}

        {activeTab === 'export' && (
          <ExportManager
            schema={schema}
            appData={appData}
            onImportSchema={(newSchema, newData) => {
              setSchema(newSchema);
              if (newData) setAppData(newData);
            }}
          />
        )}
      </main>

      {/* Floating AI Chat Assistant Toggle */}
      {!showChat && (
        <button
          type="button"
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 transition-all border border-indigo-400/30"
          id="btn-open-chat"
        >
          <Bot className="w-4 h-4" />
          <span>AI Schema Advisor</span>
        </button>
      )}

      {/* Modals & Drawers */}
      <AIConfigModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplySchema={(newSchema, seedData) => {
          setSchema(newSchema);
          setAppData(seedData);
        }}
      />

      <ChatAssistant
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        schema={schema}
      />

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      <WalkthroughModal
        isOpen={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}
