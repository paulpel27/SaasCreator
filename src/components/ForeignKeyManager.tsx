import React, { useState } from 'react';
import { TableDefinition, ForeignKeyRelationship, RelationshipType, OnDeleteAction, OnUpdateAction } from '../types';
import { Link2, Plus, Trash2, ShieldAlert, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ForeignKeyManagerProps {
  tables: TableDefinition[];
  onAddForeignKey: (tableId: string, fk: ForeignKeyRelationship) => void;
  onDeleteForeignKey: (tableId: string, fkId: string) => void;
}

export const ForeignKeyManager: React.FC<ForeignKeyManagerProps> = ({
  tables,
  onAddForeignKey,
  onDeleteForeignKey
}) => {
  const [sourceTableId, setSourceTableId] = useState<string>(tables[0]?.id || '');
  const [sourceFieldId, setSourceFieldId] = useState<string>('');
  const [targetTableId, setTargetTableId] = useState<string>(tables[1]?.id || tables[0]?.id || '');
  const [targetFieldId, setTargetFieldId] = useState<string>('');
  const [relType, setRelType] = useState<RelationshipType>('many-to-one');
  const [onDelete, setOnDelete] = useState<OnDeleteAction>('RESTRICT');
  const [onUpdate, setOnUpdate] = useState<OnUpdateAction>('CASCADE');
  const [fkName, setFkName] = useState<string>('');

  const sourceTable = tables.find((t) => t.id === sourceTableId);
  const targetTable = tables.find((t) => t.id === targetTableId);

  // List of all existing foreign keys across all tables
  const allForeignKeys: Array<{ table: TableDefinition; fk: ForeignKeyRelationship }> = [];
  tables.forEach((t) => {
    (t.foreignKeys || []).forEach((fk) => {
      allForeignKeys.push({ table: t, fk });
    });
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTableId || !sourceFieldId || !targetTableId || !targetFieldId) return;

    const sourceF = sourceTable?.fields.find((f) => f.id === sourceFieldId);
    const targetF = targetTable?.fields.find((f) => f.id === targetFieldId);

    const generatedName = fkName.trim() || `FK_${sourceTable?.name}_${targetTable?.name}`;

    const newFk: ForeignKeyRelationship = {
      id: `fk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: generatedName,
      sourceTableId,
      sourceFieldId,
      targetTableId,
      targetFieldId,
      relationshipType: relType,
      onDelete,
      onUpdate,
      description: `Links ${sourceTable?.label}.${sourceF?.label} to ${targetTable?.label}.${targetF?.label}`
    };

    onAddForeignKey(sourceTableId, newFk);

    // Reset form
    setFkName('');
    setSourceFieldId('');
    setTargetFieldId('');
  };

  return (
    <div className="space-y-6 font-sans" id="fk-manager-panel">
      {/* Creation Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 font-display text-base">Create Foreign Key Constraint</h3>
            <p className="text-xs text-slate-500">
              Enforce relational integrity and automated cascading deletes between database entities.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Source Table */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Source Table (Child)</label>
            <select
              value={sourceTableId}
              onChange={(e) => {
                setSourceTableId(e.target.value);
                setSourceFieldId('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>{t.label} ({t.name})</option>
              ))}
            </select>
          </div>

          {/* Source Field */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Source Foreign Key Field</label>
            <select
              value={sourceFieldId}
              onChange={(e) => setSourceFieldId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">-- Choose Field --</option>
              {sourceTable?.fields.map((f) => (
                <option key={f.id} value={f.id}>{f.label} ({f.type})</option>
              ))}
            </select>
          </div>

          {/* Target Table */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Table (Parent)</label>
            <select
              value={targetTableId}
              onChange={(e) => {
                setTargetTableId(e.target.value);
                setTargetFieldId('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>{t.label} ({t.name})</option>
              ))}
            </select>
          </div>

          {/* Target Field */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Primary Key Field</label>
            <select
              value={targetFieldId}
              onChange={(e) => setTargetFieldId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">-- Choose Field --</option>
              {targetTable?.fields.map((f) => (
                <option key={f.id} value={f.id}>{f.label} {f.id === targetTable.primaryKeyFieldId ? '(PK)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Constraint Rules */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">ON DELETE Action</label>
            <select
              value={onDelete}
              onChange={(e) => setOnDelete(e.target.value as OnDeleteAction)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="RESTRICT">RESTRICT (Prevent Deleting Parent)</option>
              <option value="CASCADE">CASCADE (Delete Children Automatically)</option>
              <option value="SET NULL">SET NULL (Clear Reference)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cardinality Type</label>
            <select
              value={relType}
              onChange={(e) => setRelType(e.target.value as RelationshipType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="many-to-one">Many-to-One (N : 1)</option>
              <option value="one-to-one">One-to-One (1 : 1)</option>
              <option value="one-to-many">One-to-Many (1 : N)</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex items-end gap-3">
            <div className="flex-1">
              <label className="block font-bold text-slate-700 mb-1">Constraint Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g., FK_Invoices_Customer"
                value={fkName}
                onChange={(e) => setFkName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={!sourceFieldId || !targetFieldId}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Constraint
            </button>
          </div>
        </form>
      </div>

      {/* Existing Constraints List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <h4 className="font-bold text-slate-900 font-display text-sm mb-4">
          Active Referential Constraints ({allForeignKeys.length})
        </h4>

        {allForeignKeys.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-500" />
            No explicit foreign key constraints defined yet. Add one above or define LOV fields.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allForeignKeys.map(({ table, fk }) => {
              const targetT = tables.find((t) => t.id === fk.targetTableId);
              const sourceF = table.fields.find((f) => f.id === fk.sourceFieldId);
              const targetF = targetT?.fields.find((f) => f.id === fk.targetFieldId);

              return (
                <div key={fk.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      fk.onDelete === 'CASCADE' ? 'bg-pink-50 text-pink-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{fk.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {fk.relationshipType}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          fk.onDelete === 'CASCADE' ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          ON DELETE {fk.onDelete}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{table.label}.{sourceF?.label || fk.sourceFieldId}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{targetT?.label || fk.targetTableId}.{targetF?.label || fk.targetFieldId}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteForeignKey(table.id, fk.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Remove Foreign Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
