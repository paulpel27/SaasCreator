import React, { useState, useMemo } from 'react';
import { TableDefinition, FieldDefinition } from '../types';
import { Search, Check, Database, X, Link2 } from 'lucide-react';

interface LOVPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedRecord: any, value: any, displayLabel: string) => void;
  targetTable: TableDefinition;
  targetFieldId?: string;
  displayFieldId?: string;
  tableData: any[];
  title?: string;
}

export const LOVPickerModal: React.FC<LOVPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  targetTable,
  targetFieldId,
  displayFieldId,
  tableData,
  title
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const targetPkField = targetFieldId 
    ? targetTable.fields.find((f) => f.id === targetFieldId) || targetTable.fields[0]
    : targetTable.fields.find((f) => f.id === targetTable.primaryKeyFieldId) || targetTable.fields[0];

  const targetDispField = displayFieldId
    ? targetTable.fields.find((f) => f.id === displayFieldId) || targetTable.fields[1] || targetPkField
    : targetTable.fields[1] || targetPkField;

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter((row) => {
      return Object.values(row).some((val) => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      );
    });
  }, [tableData, searchQuery]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedRow) return;
    const val = selectedRow[targetPkField.id] ?? selectedRow.id;
    const disp = selectedRow[targetDispField.id] ?? selectedRow.name ?? String(val);
    onSelect(selectedRow, val, disp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans" id="lov-picker-modal-overlay">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]" id="lov-picker-dialog">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display text-base">
                {title || `Select ${targetTable.label}`}
              </h3>
              <p className="text-xs text-slate-500">
                Relational foreign key lookup from table <code className="font-mono text-indigo-600">{targetTable.name}</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              placeholder={`Search in ${targetTable.label}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Table Records List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredRows.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-500" />
              No matching records found in table "{targetTable.label}".
            </div>
          ) : (
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-12 text-center">Select</th>
                    <th className="p-3">{targetPkField.label} (Key)</th>
                    <th className="p-3">{targetDispField.label}</th>
                    {targetTable.fields
                      .filter((f) => f.id !== targetPkField.id && f.id !== targetDispField.id)
                      .slice(0, 2)
                      .map((f) => (
                        <th key={f.id} className="p-3 hidden sm:table-cell">{f.label}</th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRows.map((row, idx) => {
                    const rowKey = row[targetPkField.id] ?? row.id ?? idx;
                    const isSelected = selectedRow && (selectedRow[targetPkField.id] === row[targetPkField.id]);

                    return (
                      <tr
                        key={rowKey}
                        onClick={() => setSelectedRow(row)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/90 text-indigo-950 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="radio"
                            checked={!!isSelected}
                            onChange={() => setSelectedRow(row)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-indigo-700">
                          {row[targetPkField.id] ?? '-'}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {row[targetDispField.id] ?? '-'}
                        </td>
                        {targetTable.fields
                          .filter((f) => f.id !== targetPkField.id && f.id !== targetDispField.id)
                          .slice(0, 2)
                          .map((f) => (
                            <td key={f.id} className="p-3 text-slate-500 hidden sm:table-cell">
                              {String(row[f.id] ?? '-')}
                            </td>
                          ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedRow ? (
              <span className="text-indigo-700 font-semibold">
                Selected: {selectedRow[targetDispField.id] || selectedRow[targetPkField.id]}
              </span>
            ) : (
              'Choose a record to associate'
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedRow}
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Apply Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
