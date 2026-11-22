import { TableDefinition, FormDefinition, SchemaValidationIssue } from '../types';

export function validateSchema(tables: TableDefinition[], forms: FormDefinition[]): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];

  tables.forEach((table) => {
    // Check primary key
    const pkField = table.fields.find((f) => f.id === table.primaryKeyFieldId || f.isPrimaryKey);
    if (!pkField) {
      issues.push({
        id: `missing-pk-${table.id}`,
        severity: 'error',
        title: `Table "${table.label}" has no Primary Key`,
        description: `Every relational table requires a Primary Key for indexing and referential integrity.`,
        relatedTableIds: [table.id],
        autoFixable: true,
        autoFixAction: `Set ${table.fields[0]?.label || 'ID'} as Primary Key`
      });
    }

    // Check LOV foreign key integrity
    table.fields.forEach((f) => {
      if (f.type === 'lov' && f.lovType === 'foreign_key') {
        const targetTable = tables.find((t) => t.id === f.foreignKeyTargetTable);
        if (!targetTable) {
          issues.push({
            id: `broken-fk-table-${f.id}`,
            severity: 'error',
            title: `Broken Foreign Key in "${table.label}.${f.label}"`,
            description: `Target table for field "${f.label}" no longer exists.`,
            relatedTableIds: [table.id]
          });
        } else if (f.foreignKeyTargetField) {
          const targetField = targetTable.fields.find((tf) => tf.id === f.foreignKeyTargetField);
          if (!targetField) {
            issues.push({
              id: `broken-fk-field-${f.id}`,
              severity: 'warning',
              title: `Invalid Target Field in "${table.label}.${f.label}"`,
              description: `Referenced field in target table "${targetTable.label}" was not found.`,
              relatedTableIds: [table.id, targetTable.id]
            });
          }
        }
      }
    });

    // Check detail table master relationship
    if (table.isDetailTable && table.masterTableId) {
      const masterTable = tables.find((t) => t.id === table.masterTableId);
      if (!masterTable) {
        issues.push({
          id: `broken-master-table-${table.id}`,
          severity: 'error',
          title: `Detail Table "${table.label}" points to non-existent Master`,
          description: `The master table specified for this detail entity was not found.`,
          relatedTableIds: [table.id]
        });
      }
    }
  });

  // Validate form bindings
  forms.forEach((form) => {
    const table = tables.find((t) => t.id === form.tableId);
    if (!table) {
      issues.push({
        id: `form-missing-table-${form.id}`,
        severity: 'error',
        title: `Form "${form.title}" references missing table`,
        description: `The base table bound to this form does not exist in schema.`,
        relatedTableIds: [],
        relatedFormIds: [form.id]
      });
    }
  });

  return issues;
}
