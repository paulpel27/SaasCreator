import React, { useState } from 'react';
import { 
  TableDefinition, 
  FieldDefinition, 
  FieldType, 
  LOVType,
  ForeignKeyRelationship 
} from '../types';
import { D3SchemaMap } from './D3SchemaMap';
import { ForeignKeyManager } from './ForeignKeyManager';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Key, 
  Link2, 
  Layers, 
  Settings2, 
  Eye, 
  Sparkles, 
  Share2, 
  Network, 
  Check, 
  X,
  FileCode,
  ArrowRight,
  Info
} from 'lucide-react';

interface DatabaseManagerProps {
  tables: TableDefinition[];
  onUpdateTables: (updatedTables: TableDefinition[]) => void;
  onOpenAiGenerator?: () => void;
}

export const DatabaseManager: React.FC<DatabaseManagerProps> = ({
  tables,
  onUpdateTables,
  onOpenAiGenerator
}) => {
  const [activeTab, setActiveTab] = useState<'visual_map' | 'tables' | 'foreign_keys'>('visual_map');
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || '');
  const [editingTable, setEditingTable] = useState<TableDefinition | null>(null);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  // Table Modal form state
  const [tableName, setTableName] = useState('');
  const [tableLabel, setTableLabel] = useState('');
  const [tableDesc, setTableDesc] = useState('');
  const [isDetailTable, setIsDetailTable] = useState(false);
  const [masterTableId, setMasterTableId] = useState('');

  // Field Modal form state
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('string');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldUnique, setFieldUnique] = useState(false);
  const [isPrimaryKey, setIsPrimaryKey] = useState(false);
  const [autoIdPrefix, setAutoIdPrefix] = useState('ID-');
  const [autoIdDigits, setAutoIdDigits] = useState(4);
  const [lovType, setLovType] = useState<LOVType>('static');
  const [staticOptionsStr, setStaticOptionsStr] = useState('Option 1, Option 2, Option 3');
  const [fkTargetTable, setFkTargetTable] = useState('');
  const [fkTargetField, setFkTargetField] = useState('');
  const [fkDisplayField, setFkDisplayField] = useState('');

  const openNewTableModal = () => {
    setEditingTable(null);
    setTableName('');
    setTableLabel('');
    setTableDesc('');
    setIsDetailTable(false);
    setMasterTableId(tables[0]?.id || '');
    setShowTableModal(true);
  };

  const openEditTableModal = (table: TableDefinition) => {
    setEditingTable(table);
    setTableName(table.name);
    setTableLabel(table.label);
    setTableDesc(table.description || '');
    setIsDetailTable(!!table.isDetailTable);
    setMasterTableId(table.masterTableId || tables[0]?.id || '');
    setShowTableModal(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim() || !tableLabel.trim()) return;

    if (editingTable) {
      const updated = tables.map((t) => {
        if (t.id === editingTable.id) {
          return {
            ...t,
            name: tableName.trim().toLowerCase().replace(/\s+/g, '_'),
            label: tableLabel.trim(),
            description: tableDesc.trim(),
            isDetailTable,
            masterTableId: isDetailTable ? masterTableId : undefined
          };
        }
        return t;
      });
      onUpdateTables(updated);
    } else {
      const newId = `tbl_${Date.now()}`;
      const defaultPkId = `fld_id_${Date.now()}`;
      const newTable: TableDefinition = {
        id: newId,
        name: tableName.trim().toLowerCase().replace(/\s+/g, '_'),
        label: tableLabel.trim(),
        description: tableDesc.trim(),
        primaryKeyFieldId: defaultPkId,
        isDetailTable,
        masterTableId: isDetailTable ? masterTableId : undefined,
        fields: [
          {
            id: defaultPkId,
            name: 'id',
            label: `${tableLabel.trim()} ID`,
            type: 'autoid',
            isPrimaryKey: true,
            required: true,
            autoIdPrefix: `${tableLabel.slice(0, 3).toUpperCase()}-`,
            autoIdDigits: 4
          }
        ],
        foreignKeys: []
      };
      onUpdateTables([...tables, newTable]);
      setSelectedTableId(newId);
    }

    setShowTableModal(false);
  };

  const handleDeleteTable = (tableId: string) => {
    if (tables.length <= 1) {
      alert("At least one table is required in your schema.");
      return;
    }
    if (confirm("Are you sure you want to delete this table?")) {
      const updated = tables.filter((t) => t.id !== tableId);
      onUpdateTables(updated);
      setSelectedTableId(updated[0]?.id || '');
    }
  };

  // Field Management
  const openNewFieldModal = () => {
    setEditingField(null);
    setFieldName('');
    setFieldLabel('');
    setFieldType('string');
    setFieldRequired(false);
    setFieldUnique(false);
    setIsPrimaryKey(false);
    setAutoIdPrefix('REC-');
    setAutoIdDigits(4);
    setLovType('static');
    setStaticOptionsStr('Option 1, Option 2, Option 3');
    setFkTargetTable(tables.find((t) => t.id !== selectedTable?.id)?.id || tables[0]?.id || '');
    setFkTargetField('');
    setFkDisplayField('');
    setShowFieldModal(true);
  };

  const openEditFieldModal = (field: FieldDefinition) => {
    setEditingField(field);
    setFieldName(field.name);
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldRequired(!!field.required);
    setFieldUnique(!!field.unique);
    setIsPrimaryKey(field.id === selectedTable?.primaryKeyFieldId || !!field.isPrimaryKey);
    setAutoIdPrefix(field.autoIdPrefix || 'ID-');
    setAutoIdDigits(field.autoIdDigits || 4);
    setLovType(field.lovType || 'static');
    setStaticOptionsStr((field.staticOptions || []).join(', '));
    setFkTargetTable(field.foreignKeyTargetTable || tables[0]?.id || '');
    setFkTargetField(field.foreignKeyTargetField || '');
    setFkDisplayField(field.foreignKeyDisplayField || '');
    setShowFieldModal(true);
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !fieldName.trim() || !fieldLabel.trim()) return;

    const staticOptions = staticOptionsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const fieldObj: FieldDefinition = {
      id: editingField ? editingField.id : `fld_${Date.now()}`,
      name: fieldName.trim().toLowerCase().replace(/\s+/g, '_'),
      label: fieldLabel.trim(),
      type: fieldType,
      required: fieldRequired,
      unique: fieldUnique,
      isPrimaryKey,
      autoIdPrefix: fieldType === 'autoid' ? autoIdPrefix : undefined,
      autoIdDigits: fieldType === 'autoid' ? autoIdDigits : undefined,
      lovType: fieldType === 'lov' ? lovType : undefined,
      staticOptions: fieldType === 'select' || (fieldType === 'lov' && lovType === 'static') ? staticOptions : undefined,
      foreignKeyTargetTable: fieldType === 'lov' && lovType === 'foreign_key' ? fkTargetTable : undefined,
      foreignKeyTargetField: fieldType === 'lov' && lovType === 'foreign_key' ? fkTargetField : undefined,
      foreignKeyDisplayField: fieldType === 'lov' && lovType === 'foreign_key' ? fkDisplayField : undefined
    };

    const updatedTables = tables.map((t) => {
      if (t.id === selectedTable.id) {
        let newFields = [...t.fields];
        if (editingField) {
          newFields = newFields.map((f) => (f.id === editingField.id ? fieldObj : f));
        } else {
          newFields.push(fieldObj);
        }

        let newPk = t.primaryKeyFieldId;
        if (isPrimaryKey) {
          newPk = fieldObj.id;
        }

        return {
          ...t,
          primaryKeyFieldId: newPk,
          fields: newFields
        };
      }
      return t;
    });

    onUpdateTables(updatedTables);
    setShowFieldModal(false);
  };

  const handleDeleteField = (fieldId: string) => {
    if (!selectedTable) return;
    if (selectedTable.fields.length <= 1) {
      alert("A table must have at least one field.");
      return;
    }
    const updatedTables = tables.map((t) => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          fields: t.fields.filter((f) => f.id !== fieldId)
        };
      }
      return t;
    });
    onUpdateTables(updatedTables);
  };

  const handleAddForeignKey = (tableId: string, fk: ForeignKeyRelationship) => {
    const updated = tables.map((t) => {
      if (t.id === tableId) {
        return {
          ...t,
          foreignKeys: [...(t.foreignKeys || []), fk]
        };
      }
      return t;
    });
    onUpdateTables(updated);
  };

  const handleDeleteForeignKey = (tableId: string, fkId: string) => {
    const updated = tables.map((t) => {
      if (t.id === tableId) {
        return {
          ...t,
          foreignKeys: (t.foreignKeys || []).filter((f) => f.id !== fkId)
        };
      }
      return t;
    });
    onUpdateTables(updated);
  };

  return (
    <div className="space-y-6 font-sans" id="database-manager-workspace">
      {/* Workspace Sub-Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs" id="db-manager-header">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('visual_map')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'visual_map'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            id="tab-visual-map"
          >
            <Network className="w-4 h-4 text-indigo-600" />
            Visual D3 Schema Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'tables'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            id="tab-tables-fields"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            Tables & Fields
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('foreign_keys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'foreign_keys'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            id="tab-foreign-keys"
          >
            <Link2 className="w-4 h-4 text-indigo-600" />
            Foreign Keys & Rules
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenAiGenerator && (
            <button
              type="button"
              onClick={onOpenAiGenerator}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-indigo-200/60"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Schema Generator
            </button>
          )}
          <button
            type="button"
            onClick={openNewTableModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Table
          </button>
        </div>
      </div>

      {/* Tab 1: D3 Visual Schema Map */}
      {activeTab === 'visual_map' && (
        <div className="space-y-3 animate-fade-in" id="visual-map-view">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-bold text-slate-900 font-display text-base flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-600" />
                Relational Database Entity Map (D3 Powered)
              </h3>
              <p className="text-xs text-slate-500">
                Interactive graphical map with force simulation, directional foreign key curves, cardinality pills, and drag-and-drop table positioning.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
              {tables.length} Tables • {tables.reduce((acc, t) => acc + (t.foreignKeys?.length || 0), 0)} Constraints
            </span>
          </div>

          <D3SchemaMap
            tables={tables}
            onSelectTable={(tableId) => {
              setSelectedTableId(tableId);
              setActiveTab('tables');
            }}
            onEditTable={(table) => {
              openEditTableModal(table);
            }}
          />
        </div>
      )}

      {/* Tab 2: Tables & Fields Editor */}
      {activeTab === 'tables' && selectedTable && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in" id="tables-editor-view">
          {/* Tables Sidebar List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-800 text-xs font-display flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                Schema Tables ({tables.length})
              </span>
              <button
                type="button"
                onClick={openNewTableModal}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Add New Table"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {tables.map((tbl) => {
                const isSelected = tbl.id === selectedTable.id;
                return (
                  <button
                    key={tbl.id}
                    type="button"
                    onClick={() => setSelectedTableId(tbl.id)}
                    className={`w-full text-left p-3 rounded-2xl text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{tbl.label}</span>
                        {tbl.isDetailTable && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            isSelected ? 'bg-pink-400/30 text-white' : 'bg-pink-100 text-pink-700'
                          }`}>
                            Detail
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] block font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {tbl.fields.length} columns
                      </span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Details & Columns Grid */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            {/* Table Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 font-display text-lg">{selectedTable.label}</h3>
                  <code className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-mono">
                    {selectedTable.name}
                  </code>
                  {selectedTable.isDetailTable && (
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-pink-100 text-pink-700 font-bold">
                      Master-Detail Child
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedTable.description || "No description configured."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditTableModal(selectedTable)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Settings
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTable(selectedTable.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={openNewFieldModal}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Column
                </button>
              </div>
            </div>

            {/* Columns Table */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Field Label</th>
                    <th className="p-3">Name / SQL Column</th>
                    <th className="p-3">Data Type</th>
                    <th className="p-3">Constraints</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {selectedTable.fields.map((fld) => {
                    const isPk = fld.id === selectedTable.primaryKeyFieldId || fld.isPrimaryKey;
                    const isFk = fld.type === 'lov' && fld.lovType === 'foreign_key';

                    return (
                      <tr key={fld.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                          {isPk && <span title="Primary Key"><Key className="w-3.5 h-3.5 text-amber-500" /></span>}
                          {isFk && <span title="Foreign Key"><Link2 className="w-3.5 h-3.5 text-indigo-600" /></span>}
                          <span>{fld.label}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {fld.name}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                            isPk ? 'bg-amber-100 text-amber-800' : isFk ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {fld.type}
                            {fld.type === 'autoid' && ` (${fld.autoIdPrefix}...)`}
                            {fld.type === 'lov' && ` (${fld.lovType})`}
                          </span>
                        </td>
                        <td className="p-3 space-x-1">
                          {isPk && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              PRIMARY KEY
                            </span>
                          )}
                          {fld.required && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                              NOT NULL
                            </span>
                          )}
                          {fld.unique && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                              UNIQUE
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => openEditFieldModal(fld)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Edit Column"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(fld.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Delete Column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Foreign Key Constraints */}
      {activeTab === 'foreign_keys' && (
        <div className="animate-fade-in" id="foreign-keys-view">
          <ForeignKeyManager
            tables={tables}
            onAddForeignKey={handleAddForeignKey}
            onDeleteForeignKey={handleDeleteForeignKey}
          />
        </div>
      )}

      {/* Table Create/Edit Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans" id="table-editor-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 font-display text-base">
                {editingTable ? "Edit Table Properties" : "Create New Database Table"}
              </h3>
              <button onClick={() => setShowTableModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveTable} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Invoices"
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">System / SQL Table Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sales_invoices"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the purpose of this data model entity..."
                  value={tableDesc}
                  onChange={(e) => setTableDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isDetailTable}
                    onChange={(e) => setIsDetailTable(e.target.checked)}
                    className="text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span>Is Master-Detail Child Table?</span>
                </label>
                {isDetailTable && (
                  <div className="pt-2">
                    <label className="block font-bold text-slate-700 mb-1">Master (Parent) Table</label>
                    <select
                      value={masterTableId}
                      onChange={(e) => setMasterTableId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      {tables.filter((t) => t.id !== editingTable?.id).map((t) => (
                        <option key={t.id} value={t.id}>{t.label} ({t.name})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                >
                  {editingTable ? "Update Table" : "Create Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Create/Edit Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans" id="field-editor-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 font-display text-base">
                {editingField ? "Edit Column Definition" : "Add Column to Table"}
              </h3>
              <button onClick={() => setShowFieldModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveField} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Column Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit Price"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SQL Field Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. unit_price"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Data Type</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as FieldType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="string">String / Text</option>
                  <option value="number">Number (Float / Integer)</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean (True / False)</option>
                  <option value="select">Dropdown Select (Static Options)</option>
                  <option value="autoid">Auto-Generated Identifier (Prefix + Digits)</option>
                  <option value="lov">List of Values (LOV / Relational Lookup)</option>
                </select>
              </div>

              {/* Auto ID Options */}
              {fieldType === 'autoid' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Code Prefix</label>
                    <input
                      type="text"
                      value={autoIdPrefix}
                      onChange={(e) => setAutoIdPrefix(e.target.value)}
                      placeholder="e.g. INV-"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Number of Digits</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={autoIdDigits}
                      onChange={(e) => setAutoIdDigits(parseInt(e.target.value) || 4)}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* LOV / Foreign Key Options */}
              {fieldType === 'lov' && (
                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-3">
                  <div>
                    <label className="block font-bold text-indigo-950 mb-1">LOV Lookup Type</label>
                    <select
                      value={lovType}
                      onChange={(e) => setLovType(e.target.value as LOVType)}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-800"
                    >
                      <option value="foreign_key">Foreign Key Relational Lookup</option>
                      <option value="static">Static Choice Modal</option>
                    </select>
                  </div>
                  {lovType === 'foreign_key' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-indigo-950 mb-1">Target Table</label>
                        <select
                          value={fkTargetTable}
                          onChange={(e) => setFkTargetTable(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-800"
                        >
                          {tables.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-indigo-950 mb-1">Key Value Field</label>
                        <select
                          value={fkTargetField}
                          onChange={(e) => setFkTargetField(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-800"
                        >
                          <option value="">Default Primary Key</option>
                          {tables.find((t) => t.id === fkTargetTable)?.fields.map((f) => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Static Select Options */}
              {(fieldType === 'select' || (fieldType === 'lov' && lovType === 'static')) && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Options (Comma separated)</label>
                  <input
                    type="text"
                    value={staticOptionsStr}
                    onChange={(e) => setStaticOptionsStr(e.target.value)}
                    placeholder="Pending, Approved, Rejected"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                    className="text-indigo-600 rounded"
                  />
                  <span>Required (Not Null)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPrimaryKey}
                    onChange={(e) => setIsPrimaryKey(e.target.checked)}
                    className="text-amber-600 rounded"
                  />
                  <span>Primary Key</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFieldModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                >
                  {editingField ? "Update Column" : "Add Column"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
