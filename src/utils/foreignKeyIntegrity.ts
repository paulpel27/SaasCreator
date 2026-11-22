import { TableDefinition, ForeignKeyRelationship } from '../types';

export interface IntegrityCheckResult {
  canDelete: boolean;
  blockingReasons: string[];
  cascadedDeletions: Array<{
    childTableId: string;
    childTableName: string;
    childField: string;
    rowCount: number;
  }>;
  nullifiedReferences: Array<{
    childTableId: string;
    childTableName: string;
    childField: string;
    rowCount: number;
  }>;
}

export function checkReferentialIntegrity(
  tableId: string,
  primaryKeyFieldId: string,
  recordId: any,
  tables: TableDefinition[],
  allData: Record<string, any[]>
): IntegrityCheckResult {
  const blockingReasons: string[] = [];
  const cascadedDeletions: IntegrityCheckResult['cascadedDeletions'] = [];
  const nullifiedReferences: IntegrityCheckResult['nullifiedReferences'] = [];

  // Find all foreign keys referencing this table
  tables.forEach((childTable) => {
    // 1. Direct explicit foreign keys
    const fks = childTable.foreignKeys || [];
    fks.forEach((fk) => {
      if (fk.targetTableId === tableId) {
        const childRows = allData[childTable.id] || [];
        const matchingRows = childRows.filter((r) => String(r[fk.sourceFieldId]) === String(recordId));
        if (matchingRows.length > 0) {
          if (fk.onDelete === 'RESTRICT') {
            blockingReasons.push(
              `Restricted by table "${childTable.label}": ${matchingRows.length} dependent record(s) reference this key (${fk.name})`
            );
          } else if (fk.onDelete === 'CASCADE') {
            cascadedDeletions.push({
              childTableId: childTable.id,
              childTableName: childTable.label,
              childField: fk.sourceFieldId,
              rowCount: matchingRows.length
            });
          } else if (fk.onDelete === 'SET NULL') {
            nullifiedReferences.push({
              childTableId: childTable.id,
              childTableName: childTable.label,
              childField: fk.sourceFieldId,
              rowCount: matchingRows.length
            });
          }
        }
      }
    });

    // 2. LOV foreign key fields
    childTable.fields.forEach((f) => {
      if (f.type === 'lov' && f.lovType === 'foreign_key' && f.foreignKeyTargetTable === tableId) {
        // If not already covered by explicit FK
        const alreadyCovered = fks.some((fk) => fk.sourceFieldId === f.id && fk.targetTableId === tableId);
        if (!alreadyCovered) {
          const childRows = allData[childTable.id] || [];
          const matchingRows = childRows.filter((r) => String(r[f.id]) === String(recordId));
          if (matchingRows.length > 0) {
            blockingReasons.push(
              `Referenced by ${matchingRows.length} record(s) in "${childTable.label}" via field "${f.label}"`
            );
          }
        }
      }
    });

    // 3. Detail table master relationship
    if (childTable.isDetailTable && childTable.masterTableId === tableId) {
      const childRows = allData[childTable.id] || [];
      // Find foreign key field pointing to master
      const masterFkField = childTable.fields.find(
        (f) => f.foreignKeyTargetTable === tableId || f.name.includes(tableId) || f.name.includes('master')
      );
      if (masterFkField) {
        const matchingRows = childRows.filter((r) => String(r[masterFkField.id]) === String(recordId));
        if (matchingRows.length > 0) {
          const alreadyInCascade = cascadedDeletions.some((c) => c.childTableId === childTable.id);
          if (!alreadyInCascade) {
            cascadedDeletions.push({
              childTableId: childTable.id,
              childTableName: childTable.label,
              childField: masterFkField.id,
              rowCount: matchingRows.length
            });
          }
        }
      }
    }
  });

  return {
    canDelete: blockingReasons.length === 0,
    blockingReasons,
    cascadedDeletions,
    nullifiedReferences
  };
}

export function executeDeleteWithIntegrity(
  tableId: string,
  primaryKeyFieldId: string,
  recordId: any,
  tables: TableDefinition[],
  allData: Record<string, any[]>
): {
  updatedData: Record<string, any[]>;
  deletedChildCount: number;
  nullifiedChildCount: number;
  reportMessages: string[];
} {
  const updatedData: Record<string, any[]> = JSON.parse(JSON.stringify(allData));
  let deletedChildCount = 0;
  let nullifiedChildCount = 0;
  const reportMessages: string[] = [];

  // Remove primary record
  const currentTableRows = updatedData[tableId] || [];
  updatedData[tableId] = currentTableRows.filter((r) => String(r[primaryKeyFieldId]) !== String(recordId));
  reportMessages.push(`Deleted record ${recordId} from table ${tableId}`);

  // Cascade or Set Null in related child tables
  tables.forEach((childTable) => {
    const fks = childTable.foreignKeys || [];
    fks.forEach((fk) => {
      if (fk.targetTableId === tableId) {
        const childRows = updatedData[childTable.id] || [];
        if (fk.onDelete === 'CASCADE') {
          const remaining = childRows.filter((r) => String(r[fk.sourceFieldId]) !== String(recordId));
          const removedCount = childRows.length - remaining.length;
          if (removedCount > 0) {
            deletedChildCount += removedCount;
            updatedData[childTable.id] = remaining;
            reportMessages.push(`Cascade-deleted ${removedCount} record(s) in "${childTable.label}"`);
          }
        } else if (fk.onDelete === 'SET NULL') {
          let modified = 0;
          updatedData[childTable.id] = childRows.map((r) => {
            if (String(r[fk.sourceFieldId]) === String(recordId)) {
              modified++;
              return { ...r, [fk.sourceFieldId]: null };
            }
            return r;
          });
          if (modified > 0) {
            nullifiedChildCount += modified;
            reportMessages.push(`Nullified foreign key in ${modified} record(s) in "${childTable.label}"`);
          }
        }
      }
    });

    // Detail tables default to cascade
    if (childTable.isDetailTable && childTable.masterTableId === tableId) {
      const childRows = updatedData[childTable.id] || [];
      const masterFkField = childTable.fields.find(
        (f) => f.foreignKeyTargetTable === tableId || f.name.includes(tableId)
      );
      if (masterFkField) {
        const remaining = childRows.filter((r) => String(r[masterFkField.id]) !== String(recordId));
        const removedCount = childRows.length - remaining.length;
        if (removedCount > 0) {
          deletedChildCount += removedCount;
          updatedData[childTable.id] = remaining;
          reportMessages.push(`Cascade-deleted ${removedCount} detail row(s) in "${childTable.label}"`);
        }
      }
    }
  });

  return {
    updatedData,
    deletedChildCount,
    nullifiedChildCount,
    reportMessages
  };
}
