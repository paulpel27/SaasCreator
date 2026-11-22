import React, { useState, useMemo } from 'react';
import { 
  SaaSAppSchema, 
  TableDefinition, 
  FormDefinition, 
  ReportDefinition, 
  FieldDefinition,
  FormField
} from '../types';
import { LOVPickerModal } from './LOVPickerModal';
import { checkReferentialIntegrity, executeDeleteWithIntegrity } from '../utils/foreignKeyIntegrity';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import { 
  Play, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  ArrowLeft, 
  Database, 
  Table, 
  Layers, 
  BarChart3, 
  Link2, 
  AlertCircle, 
  Info, 
  Calendar, 
  Hash, 
  DollarSign, 
  Package, 
  Users, 
  CheckCircle2, 
  RefreshCw,
  FolderTree
} from 'lucide-react';

interface AppRunnerProps {
  schema: SaaSAppSchema;
  appData: Record<string, any[]>;
  onUpdateAppData: (newData: Record<string, any[]>) => void;
}

const COLORS = ['#4f46e5', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

export const AppRunner: React.FC<AppRunnerProps> = ({
  schema,
  appData,
  onUpdateAppData
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string>(
    schema.menus[0]?.submenus[0]?.id || schema.forms[0]?.id || schema.tables[0]?.id || ''
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'forms' | 'tables' | 'reports'>('forms');
  const [activeTableId, setActiveTableId] = useState<string>(schema.tables[0]?.id || '');
  const [activeReportId, setActiveReportId] = useState<string>(schema.reports[0]?.id || '');
  const [activeFormId, setActiveFormId] = useState<string>(schema.forms[0]?.id || '');

  // Master-Detail Form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [detailRows, setDetailRows] = useState<any[]>([]);

  // LOV Modal State
  const [lovModalOpen, setLovModalOpen] = useState(false);
  const [lovConfig, setLovConfig] = useState<{
    targetTable: TableDefinition;
    targetFieldId?: string;
    displayFieldId?: string;
    onSelect: (value: any, display: string) => void;
  } | null>(null);

  // Integrity Deletion Modal State
  const [integrityWarning, setIntegrityWarning] = useState<{
    isOpen: boolean;
    tableId: string;
    recordId: any;
    blockingReasons: string[];
    cascadedDeletions: any[];
    nullifiedReferences: any[];
  } | null>(null);

  // Active form definition
  const currentForm = useMemo(() => {
    return schema.forms.find((f) => f.id === activeFormId) || schema.forms[0];
  }, [schema.forms, activeFormId]);

  const currentTable = useMemo(() => {
    if (activeTab === 'tables') {
      return schema.tables.find((t) => t.id === activeTableId) || schema.tables[0];
    }
    if (currentForm) {
      return schema.tables.find((t) => t.id === currentForm.tableId) || schema.tables[0];
    }
    return schema.tables[0];
  }, [schema.tables, activeTab, activeTableId, currentForm]);

  const detailTable = useMemo(() => {
    if (!currentForm?.detailTableId) return null;
    return schema.tables.find((t) => t.id === currentForm.detailTableId);
  }, [schema.tables, currentForm]);

  // Current records in view
  const currentRecords = useMemo(() => {
    if (!currentTable) return [];
    const rows = appData[currentTable.id] || [];
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((r) =>
      Object.values(r).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }, [appData, currentTable, searchQuery]);

  // Initialize new record in form
  const handleNewRecord = () => {
    if (!currentTable) return;
    const newObj: Record<string, any> = {};

    // Auto IDs and defaults
    currentTable.fields.forEach((f) => {
      if (f.type === 'autoid') {
        const existingCount = (appData[currentTable.id] || []).length + 1;
        const prefix = f.autoIdPrefix || 'REC-';
        const digits = f.autoIdDigits || 4;
        newObj[f.id] = `${prefix}${String(existingCount).padStart(digits, '0')}`;
      } else if (f.defaultValue !== undefined) {
        newObj[f.id] = f.defaultValue;
      } else if (f.type === 'boolean') {
        newObj[f.id] = false;
      } else {
        newObj[f.id] = '';
      }
    });

    setFormData(newObj);
    setSelectedRecordId(null);
    setDetailRows([]);
  };

  // Select record to edit in Form
  const handleSelectRecord = (record: any) => {
    if (!currentTable) return;
    setFormData({ ...record });
    const pkVal = record[currentTable.primaryKeyFieldId] || record.id;
    setSelectedRecordId(pkVal);

    // If master-detail, load associated child rows
    if (currentForm?.layoutType === 'master_detail_grid' && detailTable && currentForm.detailForeignKeyField) {
      const allDetail = appData[detailTable.id] || [];
      const matchingDetails = allDetail.filter(
        (d) => String(d[currentForm.detailForeignKeyField!]) === String(pkVal)
      );
      setDetailRows(matchingDetails);
    }
  };

  // Save Form Record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTable) return;

    const pkField = currentTable.fields.find((f) => f.id === currentTable.primaryKeyFieldId) || currentTable.fields[0];
    const pkVal = formData[pkField.id];

    let currentTableData = [...(appData[currentTable.id] || [])];
    const existingIndex = currentTableData.findIndex((r) => String(r[pkField.id]) === String(pkVal));

    if (existingIndex >= 0) {
      currentTableData[existingIndex] = { ...formData };
    } else {
      currentTableData.push({ ...formData });
    }

    const newAppData = {
      ...appData,
      [currentTable.id]: currentTableData
    };

    // Save Detail Rows if master-detail
    if (currentForm?.layoutType === 'master_detail_grid' && detailTable && currentForm.detailForeignKeyField) {
      let existingChildData = [...(appData[detailTable.id] || [])];
      // remove old children of this record
      existingChildData = existingChildData.filter(
        (d) => String(d[currentForm.detailForeignKeyField!]) !== String(pkVal)
      );
      // append current detail rows with parent foreign key attached
      const finalizedDetails = detailRows.map((d) => ({
        ...d,
        [currentForm.detailForeignKeyField!]: pkVal
      }));
      newAppData[detailTable.id] = [...existingChildData, ...finalizedDetails];
    }

    onUpdateAppData(newAppData);
    setSelectedRecordId(pkVal);
    alert("Record successfully saved to relational database!");
  };

  // Request record deletion with referential integrity check
  const handleRequestDelete = (record: any) => {
    if (!currentTable) return;
    const pkField = currentTable.fields.find((f) => f.id === currentTable.primaryKeyFieldId) || currentTable.fields[0];
    const recordId = record[pkField.id] || record.id;

    const integrity = checkReferentialIntegrity(
      currentTable.id,
      pkField.id,
      recordId,
      schema.tables,
      appData
    );

    if (!integrity.canDelete || integrity.cascadedDeletions.length > 0 || integrity.nullifiedReferences.length > 0) {
      setIntegrityWarning({
        isOpen: true,
        tableId: currentTable.id,
        recordId,
        blockingReasons: integrity.blockingReasons,
        cascadedDeletions: integrity.cascadedDeletions,
        nullifiedReferences: integrity.nullifiedReferences
      });
    } else {
      if (confirm(`Delete record ${recordId}?`)) {
        const result = executeDeleteWithIntegrity(
          currentTable.id,
          pkField.id,
          recordId,
          schema.tables,
          appData
        );
        onUpdateAppData(result.updatedData);
        handleNewRecord();
      }
    }
  };

  const handleConfirmCascadeDelete = () => {
    if (!integrityWarning || !currentTable) return;
    const pkField = currentTable.fields.find((f) => f.id === currentTable.primaryKeyFieldId) || currentTable.fields[0];

    const result = executeDeleteWithIntegrity(
      integrityWarning.tableId,
      pkField.id,
      integrityWarning.recordId,
      schema.tables,
      appData
    );

    onUpdateAppData(result.updatedData);
    setIntegrityWarning(null);
    handleNewRecord();
    alert(`Deletion complete: ${result.reportMessages.join('\n')}`);
  };

  // Open LOV Modal for a field
  const handleOpenLOV = (fld: FieldDefinition, isDetail: boolean = false, detailIdx: number = 0) => {
    if (fld.type !== 'lov' || fld.lovType !== 'foreign_key' || !fld.foreignKeyTargetTable) return;

    const targetT = schema.tables.find((t) => t.id === fld.foreignKeyTargetTable);
    if (!targetT) {
      alert("Target lookup table not found in schema.");
      return;
    }

    setLovConfig({
      targetTable: targetT,
      targetFieldId: fld.foreignKeyTargetField,
      displayFieldId: fld.foreignKeyDisplayField,
      onSelect: (val, disp) => {
        if (isDetail) {
          const updated = [...detailRows];
          updated[detailIdx] = { ...updated[detailIdx], [fld.id]: val };
          setDetailRows(updated);
        } else {
          setFormData((prev) => ({ ...prev, [fld.id]: val }));
        }
      }
    });
    setLovModalOpen(true);
  };

  // Detail Row Management
  const handleAddDetailRow = () => {
    if (!detailTable) return;
    const newDetail: Record<string, any> = {};
    const pkField = detailTable.fields.find((f) => f.id === detailTable.primaryKeyFieldId) || detailTable.fields[0];
    const existingCount = (appData[detailTable.id] || []).length + detailRows.length + 1;
    newDetail[pkField.id] = `ITEM-${String(existingCount).padStart(5, '0')}`;
    detailTable.fields.forEach((f) => {
      if (f.id !== pkField.id) {
        newDetail[f.id] = f.defaultValue !== undefined ? f.defaultValue : '';
      }
    });
    setDetailRows([...detailRows, newDetail]);
  };

  const handleRemoveDetailRow = (index: number) => {
    setDetailRows(detailRows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 font-sans" id="app-runner-runtime">
      {/* Navigation Top Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Play className="w-5 h-5 ml-0.5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 font-display text-base flex items-center gap-2">
              {schema.appTitle || "Live Application Runtime"}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                Active Session
              </span>
            </h2>
            <p className="text-xs text-slate-500">{schema.appDescription}</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('forms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'forms' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Forms & Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'tables' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            Live Data Grids
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'reports' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics Reports
          </button>
        </div>
      </div>

      {/* Mode 1: Forms & Master-Detail Entry */}
      {activeTab === 'forms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Records Selector Sidebar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-bold text-slate-800 text-xs font-display flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  {currentTable.label} Records ({currentRecords.length})
                </span>
              </div>
              <button
                type="button"
                onClick={handleNewRecord}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                title="Create New Record"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            </div>

            {/* Form Selector Dropdown */}
            {schema.forms.length > 1 && (
              <div className="pb-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Form</label>
                <select
                  value={activeFormId}
                  onChange={(e) => setActiveFormId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  {schema.forms.map((f) => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Search */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                placeholder="Filter records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Records List */}
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {currentRecords.map((rec, idx) => {
                const pkField = currentTable.fields.find((f) => f.id === currentTable.primaryKeyFieldId) || currentTable.fields[0];
                const dispField = currentTable.fields[1] || pkField;
                const pkVal = rec[pkField.id] || rec.id || idx;
                const isSelected = selectedRecordId === pkVal;

                return (
                  <div
                    key={pkVal}
                    onClick={() => handleSelectRecord(rec)}
                    className={`p-3 rounded-2xl text-xs cursor-pointer transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold shadow-xs'
                        : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-[11px] text-indigo-600 font-bold">{rec[pkField.id]}</div>
                      <div className="text-slate-900 font-medium">{String(rec[dispField.id] || 'Unnamed')}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestDelete(rec);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Editor Panel */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 font-display text-base">
                  {currentForm?.title || `${currentTable.label} Entry Form`}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRecordId ? `Editing Record: ${selectedRecordId}` : 'Creating New Record'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNewRecord}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Reset Form
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-6 text-xs">
              {/* Form Master Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentTable.fields.map((fld) => {
                  const isPk = fld.id === currentTable.primaryKeyFieldId || fld.isPrimaryKey;
                  const isFk = fld.type === 'lov' && fld.lovType === 'foreign_key';

                  return (
                    <div key={fld.id} className="space-y-1">
                      <label className="block font-bold text-slate-700">
                        {fld.label} {fld.required && <span className="text-red-500">*</span>}
                      </label>

                      {/* Readonly Auto ID */}
                      {fld.type === 'autoid' || isPk ? (
                        <input
                          type="text"
                          readOnly
                          value={formData[fld.id] || ''}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-indigo-700 font-mono font-bold cursor-not-allowed"
                        />
                      ) : fld.type === 'lov' && isFk ? (
                        /* LOV Modal Trigger */
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            placeholder="Click picker to lookup record..."
                            value={formData[fld.id] || ''}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenLOV(fld)}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center gap-1 transition-colors"
                          >
                            <Search className="w-3.5 h-3.5" />
                            Lookup
                          </button>
                        </div>
                      ) : fld.type === 'select' ? (
                        <select
                          value={formData[fld.id] || ''}
                          onChange={(e) => setFormData({ ...formData, [fld.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Option --</option>
                          {fld.staticOptions?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : fld.type === 'boolean' ? (
                        <label className="flex items-center gap-2 pt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!formData[fld.id]}
                            onChange={(e) => setFormData({ ...formData, [fld.id]: e.target.checked })}
                            className="text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="font-semibold text-slate-800">Enabled / Active</span>
                        </label>
                      ) : (
                        <input
                          type={fld.type === 'number' ? 'number' : fld.type === 'date' ? 'date' : 'text'}
                          required={fld.required}
                          value={formData[fld.id] ?? ''}
                          onChange={(e) => setFormData({ ...formData, [fld.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Master-Detail Sub-Grid (Line Items) */}
              {currentForm?.layoutType === 'master_detail_grid' && detailTable && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 font-display text-sm flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-pink-600" />
                        {detailTable.label} (Master-Detail Line Items)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Cascade linked to current record ({selectedRecordId || 'new'})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDetailRow}
                      className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Line Item
                    </button>
                  </div>

                  {detailRows.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                      No line items attached. Click "Add Line Item" to insert child records.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <tr>
                            {detailTable.fields
                              .filter((f) => f.id !== currentForm.detailForeignKeyField)
                              .map((f) => (
                                <th key={f.id} className="p-2.5">{f.label}</th>
                              ))}
                            <th className="p-2.5 w-10 text-center">✕</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {detailRows.map((dRow, dIdx) => (
                            <tr key={dIdx} className="hover:bg-slate-50">
                              {detailTable.fields
                                .filter((f) => f.id !== currentForm.detailForeignKeyField)
                                .map((f) => {
                                  const isDetailPk = f.id === detailTable.primaryKeyFieldId;
                                  const isDetailFk = f.type === 'lov' && f.lovType === 'foreign_key';

                                  return (
                                    <td key={f.id} className="p-2">
                                      {isDetailPk ? (
                                        <span className="font-mono text-slate-600 font-bold">{dRow[f.id]}</span>
                                      ) : isDetailFk ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            readOnly
                                            value={dRow[f.id] || ''}
                                            className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleOpenLOV(f, true, dIdx)}
                                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                            title="Lookup"
                                          >
                                            <Search className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <input
                                          type={f.type === 'number' ? 'number' : 'text'}
                                          value={dRow[f.id] ?? ''}
                                          onChange={(e) => {
                                            const updated = [...detailRows];
                                            updated[dIdx] = { ...updated[dIdx], [f.id]: e.target.value };
                                            setDetailRows(updated);
                                          }}
                                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                                        />
                                      )}
                                    </td>
                                  );
                                })}
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDetailRow(dIdx)}
                                  className="text-slate-400 hover:text-red-600 p-1"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save Record to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mode 2: Live Data Grids */}
      {activeTab === 'tables' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 font-display text-sm">Table:</span>
              <select
                value={activeTableId}
                onChange={(e) => setActiveTableId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                {schema.tables.map((t) => (
                  <option key={t.id} value={t.id}>{t.label} ({t.name})</option>
                ))}
              </select>
            </div>

            <div className="relative flex items-center w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                placeholder="Search rows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  {currentTable.fields.map((f) => (
                    <th key={f.id} className="p-3">{f.label}</th>
                  ))}
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={currentTable.fields.length + 1} className="p-8 text-center text-slate-400">
                      No records in table "{currentTable.label}".
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {currentTable.fields.map((f) => (
                        <td key={f.id} className="p-3 font-medium">
                          {String(r[f.id] ?? '-')}
                        </td>
                      ))}
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(r)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Delete Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode 3: Analytics Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 font-display text-base">
                  {schema.reports.find((r) => r.id === activeReportId)?.title || "Analytics Engine"}
                </h3>
                <p className="text-xs text-slate-500">Live dynamic aggregates calculated directly from schema state</p>
              </div>

              {schema.reports.length > 1 && (
                <select
                  value={activeReportId}
                  onChange={(e) => setActiveReportId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {schema.reports.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Render Analytics Charts */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Paid', total: 5900, count: 4 },
                  { name: 'Sent', total: 11700, count: 6 },
                  { name: 'Draft', total: 2400, count: 2 },
                  { name: 'Overdue', total: 1800, count: 1 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Total Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* LOV Picker Modal */}
      {lovModalOpen && lovConfig && (
        <LOVPickerModal
          isOpen={lovModalOpen}
          onClose={() => setLovModalOpen(false)}
          targetTable={lovConfig.targetTable}
          targetFieldId={lovConfig.targetFieldId}
          displayFieldId={lovConfig.displayFieldId}
          tableData={appData[lovConfig.targetTable.id] || []}
          onSelect={(_, val, disp) => {
            lovConfig.onSelect(val, disp);
          }}
        />
      )}

      {/* Referential Integrity Warning Dialog */}
      {integrityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 font-display text-base">Referential Integrity Constraint</h3>
            </div>

            {integrityWarning.blockingReasons.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  This record cannot be deleted because foreign key constraints with <strong>RESTRICT</strong> rules exist:
                </p>
                <div className="p-3 bg-red-50 rounded-2xl border border-red-200 space-y-1 text-xs text-red-700">
                  {integrityWarning.blockingReasons.map((reason, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIntegrityWarning(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Deleting this parent record will automatically trigger cascading actions:
                </p>
                <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200 space-y-1.5 text-xs text-pink-900">
                  {integrityWarning.cascadedDeletions.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>Cascade Delete in "{c.childTableName}"</span>
                      <span className="font-bold font-mono">{c.rowCount} row(s)</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIntegrityWarning(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCascadeDelete}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm"
                  >
                    Confirm Cascade Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
