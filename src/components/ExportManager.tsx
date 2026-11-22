import React, { useState } from 'react';
import { SaaSAppSchema } from '../types';
import { Download, Upload, Copy, Check, FileText, Code2, Database } from 'lucide-react';

interface ExportManagerProps {
  schema: SaaSAppSchema;
  appData: Record<string, any[]>;
  onImportSchema: (newSchema: SaaSAppSchema, newData?: Record<string, any[]>) => void;
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  schema,
  appData,
  onImportSchema
}) => {
  const [activeFormat, setActiveFormat] = useState<'sql' | 'typescript' | 'json' | 'csv'>('sql');
  const [copied, setCopied] = useState(false);

  // Generate SQL DDL & DML
  const generateSql = () => {
    let sql = `-- ==========================================\n`;
    sql += `-- SaasCreator Database DDL & DML Schema\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ==========================================\n\n`;

    schema.tables.forEach((t) => {
      sql += `-- Table: ${t.name}\n`;
      sql += `CREATE TABLE ${t.name} (\n`;

      const colDefs: string[] = [];
      t.fields.forEach((f) => {
        let col = `  ${f.name} `;
        if (f.id === t.primaryKeyFieldId || f.isPrimaryKey) {
          col += `VARCHAR(64) PRIMARY KEY`;
        } else if (f.type === 'number') {
          col += `NUMERIC(15, 2)`;
        } else if (f.type === 'date') {
          col += `DATE`;
        } else if (f.type === 'boolean') {
          col += `BOOLEAN DEFAULT TRUE`;
        } else {
          col += `VARCHAR(255)`;
        }
        if (f.required && f.id !== t.primaryKeyFieldId) col += ` NOT NULL`;
        if (f.unique) col += ` UNIQUE`;
        colDefs.push(col);
      });

      // Constraints
      (t.foreignKeys || []).forEach((fk) => {
        const targetTable = schema.tables.find((tbl) => tbl.id === fk.targetTableId);
        const sourceField = t.fields.find((fld) => fld.id === fk.sourceFieldId);
        const targetField = targetTable?.fields.find((fld) => fld.id === fk.targetFieldId);

        if (targetTable && sourceField && targetField) {
          colDefs.push(
            `  CONSTRAINT ${fk.name} FOREIGN KEY (${sourceField.name}) REFERENCES ${targetTable.name}(${targetField.name}) ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate}`
          );
        }
      });

      sql += colDefs.join(',\n');
      sql += `\n);\n\n`;
    });

    // Seed DML
    sql += `-- ==========================================\n`;
    sql += `-- Initial Seed Data\n`;
    sql += `-- ==========================================\n`;
    Object.entries(appData).forEach(([tblId, rows]) => {
      const tbl = schema.tables.find((t) => t.id === tblId);
      if (tbl && rows.length > 0) {
        rows.forEach((r) => {
          const colNames = tbl.fields.map((f) => f.name).join(', ');
          const values = tbl.fields
            .map((f) => {
              const val = r[f.id];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number' || typeof val === 'boolean') return `${val}`;
              return `'${String(val).replace(/'/g, "''")}'`;
            })
            .join(', ');
          sql += `INSERT INTO ${tbl.name} (${colNames}) VALUES (${values});\n`;
        });
      }
    });

    return sql;
  };

  // Generate TypeScript Interfaces
  const generateTypeScript = () => {
    let ts = `// Auto-generated TypeScript Types from SaasCreator\n\n`;
    schema.tables.forEach((t) => {
      const typeName = t.name.charAt(0).toUpperCase() + t.name.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      ts += `export interface ${typeName} {\n`;
      t.fields.forEach((f) => {
        let tType = 'string';
        if (f.type === 'number') tType = 'number';
        if (f.type === 'boolean') tType = 'boolean';
        if (f.type === 'date') tType = 'string';
        ts += `  ${f.name}${f.required ? '' : '?'}: ${tType};\n`;
      });
      ts += `}\n\n`;
    });
    return ts;
  };

  const getCodeContent = () => {
    if (activeFormat === 'sql') return generateSql();
    if (activeFormat === 'typescript') return generateTypeScript();
    return JSON.stringify({ schema, appData }, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getCodeContent();
    const ext = activeFormat === 'sql' ? 'sql' : activeFormat === 'typescript' ? 'ts' : 'json';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saas-schema-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 font-display text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Schema Exporter & SQL Migration Generator
          </h3>
          <p className="text-xs text-slate-500">
            Export production-ready PostgreSQL / MySQL scripts, TypeScript models, or JSON backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download File
          </button>
        </div>
      </div>

      {/* Format Selector */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFormat('sql')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFormat === 'sql' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          PostgreSQL / MySQL DDL
        </button>
        <button
          type="button"
          onClick={() => setActiveFormat('typescript')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFormat === 'typescript' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          TypeScript Interfaces
        </button>
        <button
          type="button"
          onClick={() => setActiveFormat('json')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFormat === 'json' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Raw JSON Snapshot
        </button>
      </div>

      {/* Code Viewer */}
      <div className="relative rounded-2xl bg-slate-900 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[480px]">
        <pre>{getCodeContent()}</pre>
      </div>
    </div>
  );
};
