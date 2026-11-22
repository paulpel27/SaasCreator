export type FieldType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'select' 
  | 'autoid' 
  | 'lov';

export type LOVType = 'static' | 'dynamic_sql' | 'foreign_key';

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  regex?: string;
  defaultValue?: any;
  isPrimaryKey?: boolean;
  // LOV & Relationship specifics
  lovType?: LOVType;
  staticOptions?: string[];
  foreignKeyTargetTable?: string;
  foreignKeyTargetField?: string;
  foreignKeyDisplayField?: string;
  // Auto ID specifics
  autoIdPrefix?: string;
  autoIdDigits?: number;
  description?: string;
}

export type RelationshipType = 'one-to-many' | 'many-to-one' | 'one-to-one';
export type OnDeleteAction = 'RESTRICT' | 'CASCADE' | 'SET NULL';
export type OnUpdateAction = 'RESTRICT' | 'CASCADE';

export interface ForeignKeyRelationship {
  id: string;
  name: string;
  sourceTableId: string;
  sourceFieldId: string;
  targetTableId: string;
  targetFieldId: string;
  relationshipType: RelationshipType;
  onDelete: OnDeleteAction;
  onUpdate: OnUpdateAction;
  description?: string;
}

export interface TableDefinition {
  id: string;
  name: string;
  label: string;
  description?: string;
  primaryKeyFieldId: string;
  isDetailTable?: boolean;
  masterTableId?: string;
  fields: FieldDefinition[];
  foreignKeys?: ForeignKeyRelationship[];
  position?: { x: number; y: number };
}

export type FormControlType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'checkbox' 
  | 'select' 
  | 'textarea' 
  | 'lov_modal'
  | 'readonly_autoid';

export interface FormField {
  id: string;
  tableFieldId: string;
  label: string;
  controlType: FormControlType;
  placeholder?: string;
  isRequired?: boolean;
  isHidden?: boolean;
  defaultValue?: any;
  gridColSpan?: number; // 1 to 12
  helpText?: string;
}

export type FormLayoutType = 'single' | 'master_detail_grid';

export interface FormDefinition {
  id: string;
  name: string;
  title: string;
  tableId: string;
  layoutType: FormLayoutType;
  detailTableId?: string;
  detailMasterKeyField?: string;
  detailForeignKeyField?: string;
  fields: FormField[];
  detailFields?: FormField[];
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';
export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'metric_cards';

export interface ReportMetric {
  id: string;
  label: string;
  field: string;
  aggregation: AggregationType;
  format?: 'currency' | 'number' | 'percent';
}

export interface ReportDefinition {
  id: string;
  name: string;
  title: string;
  primaryTableId: string;
  chartType: ChartType;
  groupField?: string;
  metricFields: ReportMetric[];
}

export interface MenuSubItem {
  id: string;
  title: string;
  type: 'form' | 'report' | 'custom';
  targetId: string;
  allowedRoles?: string[];
}

export interface MenuCategory {
  id: string;
  title: string;
  icon: string;
  order: number;
  submenus: MenuSubItem[];
}

export interface SaaSAppSchema {
  appTitle: string;
  appDescription: string;
  logoIcon?: string;
  tables: TableDefinition[];
  forms: FormDefinition[];
  reports: ReportDefinition[];
  menus: MenuCategory[];
}

export interface SchemaValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  relatedTableIds: string[];
  relatedFormIds?: string[];
  autoFixable?: boolean;
  autoFixAction?: string;
}
