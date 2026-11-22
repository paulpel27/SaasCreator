import { SaaSAppSchema } from '../types';

export interface SaaSTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  schema: SaaSAppSchema;
  seedData: Record<string, any[]>;
}

export const PRESET_TEMPLATES: SaaSTemplate[] = [
  {
    id: "tpl_crm_invoicing",
    name: "Enterprise ERP & Invoicing Hub",
    category: "Finance & Sales",
    description: "Complete relational customer billing, tiered accounts, invoice line items, and revenue charts.",
    icon: "Receipt",
    schema: {
      appTitle: "Enterprise Billing Hub",
      appDescription: "Client management and master-detail invoice generation",
      logoIcon: "DollarSign",
      tables: [
        {
          id: "t_cust",
          name: "clients",
          label: "Clients",
          description: "Registered corporate client accounts",
          primaryKeyFieldId: "f_c_id",
          fields: [
            { id: "f_c_id", name: "id", label: "Client ID", type: "autoid", isPrimaryKey: true, required: true, autoIdPrefix: "CL-", autoIdDigits: 4 },
            { id: "f_c_name", name: "name", label: "Client Name", type: "string", required: true },
            { id: "f_c_email", name: "email", label: "Contact Email", type: "string", required: true },
            { id: "f_c_tier", name: "tier", label: "Account Tier", type: "select", staticOptions: ["Standard", "Pro", "Enterprise"] }
          ],
          foreignKeys: []
        },
        {
          id: "t_inv",
          name: "invoices",
          label: "Invoices",
          description: "Issued customer invoices",
          primaryKeyFieldId: "f_i_id",
          fields: [
            { id: "f_i_id", name: "id", label: "Invoice #", type: "autoid", isPrimaryKey: true, required: true, autoIdPrefix: "INV-", autoIdDigits: 4 },
            { id: "f_i_client", name: "client_id", label: "Client", type: "lov", lovType: "foreign_key", required: true, foreignKeyTargetTable: "t_cust", foreignKeyTargetField: "f_c_id", foreignKeyDisplayField: "f_c_name" },
            { id: "f_i_date", name: "date", label: "Date", type: "date", required: true },
            { id: "f_i_amount", name: "total", label: "Total ($)", type: "number", defaultValue: 0 }
          ],
          foreignKeys: [
            { id: "fk_inv_cl", name: "FK_Invoice_Client", sourceTableId: "t_inv", sourceFieldId: "f_i_client", targetTableId: "t_cust", targetFieldId: "f_c_id", relationshipType: "many-to-one", onDelete: "RESTRICT", onUpdate: "CASCADE" }
          ]
        }
      ],
      forms: [
        {
          id: "f_inv",
          name: "invoice_form",
          title: "Invoice Manager",
          tableId: "t_inv",
          layoutType: "single",
          fields: []
        }
      ],
      reports: [
        {
          id: "r_inv",
          name: "inv_report",
          title: "Invoice Overview",
          primaryTableId: "t_inv",
          chartType: "bar",
          groupField: "f_i_client",
          metricFields: [
            { id: "m_inv_tot", label: "Total Revenue", field: "f_i_amount", aggregation: "sum", format: "currency" }
          ]
        }
      ],
      menus: []
    },
    seedData: {
      t_cust: [
        { f_c_id: "CL-0001", f_c_name: "Acme Corp", f_c_email: "billing@acme.com", f_c_tier: "Enterprise" },
        { f_c_id: "CL-0002", f_c_name: "Beta Global", f_c_email: "contact@betaglobal.com", f_c_tier: "Pro" }
      ],
      t_inv: [
        { f_i_id: "INV-0001", f_i_client: "CL-0001", f_i_date: "2026-08-01", f_i_amount: 4500 },
        { f_i_id: "INV-0002", f_i_client: "CL-0002", f_i_date: "2026-08-05", f_i_amount: 8200 }
      ]
    }
  },
  {
    id: "tpl_project_tracker",
    name: "Agile Project & Task Tracker",
    category: "Operations",
    description: "Sprints, epics, tasks, priority assignments, and progress analytics.",
    icon: "Kanban",
    schema: {
      appTitle: "Agile Project Engine",
      appDescription: "Sprint planning and task execution",
      logoIcon: "CheckSquare",
      tables: [
        {
          id: "t_proj",
          name: "projects",
          label: "Projects",
          primaryKeyFieldId: "f_p_id",
          fields: [
            { id: "f_p_id", name: "id", label: "Project Code", type: "autoid", isPrimaryKey: true, required: true, autoIdPrefix: "PRJ-", autoIdDigits: 3 },
            { id: "f_p_title", name: "title", label: "Project Title", type: "string", required: true },
            { id: "f_p_budget", name: "budget", label: "Budget ($)", type: "number" }
          ],
          foreignKeys: []
        },
        {
          id: "t_task",
          name: "tasks",
          label: "Tasks",
          isDetailTable: true,
          masterTableId: "t_proj",
          primaryKeyFieldId: "f_t_id",
          fields: [
            { id: "f_t_id", name: "id", label: "Task ID", type: "autoid", isPrimaryKey: true, required: true, autoIdPrefix: "TSK-", autoIdDigits: 4 },
            { id: "f_t_proj", name: "project_id", label: "Project", type: "lov", lovType: "foreign_key", required: true, foreignKeyTargetTable: "t_proj", foreignKeyTargetField: "f_p_id", foreignKeyDisplayField: "f_p_title" },
            { id: "f_t_desc", name: "description", label: "Task Description", type: "string", required: true },
            { id: "f_t_status", name: "status", label: "Status", type: "select", staticOptions: ["Todo", "In Progress", "Done"] }
          ],
          foreignKeys: [
            { id: "fk_tsk_prj", name: "FK_Task_Project", sourceTableId: "t_task", sourceFieldId: "f_t_proj", targetTableId: "t_proj", targetFieldId: "f_p_id", relationshipType: "many-to-one", onDelete: "CASCADE", onUpdate: "CASCADE" }
          ]
        }
      ],
      forms: [
        {
          id: "f_proj",
          name: "project_form",
          title: "Project Management",
          tableId: "t_proj",
          layoutType: "master_detail_grid",
          detailTableId: "t_task",
          detailForeignKeyField: "f_t_proj",
          fields: []
        }
      ],
      reports: [
        {
          id: "r_proj",
          name: "proj_report",
          title: "Tasks by Project",
          primaryTableId: "t_proj",
          chartType: "bar",
          groupField: "f_p_title",
          metricFields: [
            { id: "m_proj_cnt", label: "Budget Total", field: "f_p_budget", aggregation: "sum", format: "currency" }
          ]
        }
      ],
      menus: []
    },
    seedData: {
      t_proj: [
        { f_p_id: "PRJ-001", f_p_title: "Cloud Infrastructure 2.0", f_p_budget: 65000 },
        { f_p_id: "PRJ-002", f_p_title: "Mobile App Redesign", f_p_budget: 35000 }
      ],
      t_task: [
        { f_t_id: "TSK-0001", f_t_proj: "PRJ-001", f_t_desc: "Set up CI/CD pipeline", f_t_status: "Done" },
        { f_t_id: "TSK-0002", f_t_proj: "PRJ-001", f_t_desc: "Configure auto-scaling groups", f_t_status: "In Progress" },
        { f_t_id: "TSK-0003", f_t_proj: "PRJ-002", f_t_desc: "Design Figma wireframes", f_t_status: "In Progress" }
      ]
    }
  }
];

export const saasTemplates = PRESET_TEMPLATES;
