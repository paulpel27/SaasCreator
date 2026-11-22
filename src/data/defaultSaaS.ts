import { SaaSAppSchema } from '../types';

export const defaultSaaSApp: SaaSAppSchema = {
  appTitle: "Enterprise ERP & SaaS Hub",
  appDescription: "Relational cloud system managing clients, multi-tier orders, line items, and analytics",
  logoIcon: "Layers",
  tables: [
    {
      id: "tbl_customers",
      name: "customers",
      label: "Customers",
      description: "Directory of commercial clients, accounts, and contact representatives",
      primaryKeyFieldId: "fld_cust_id",
      fields: [
        {
          id: "fld_cust_id",
          name: "id",
          label: "Customer ID",
          type: "autoid",
          isPrimaryKey: true,
          required: true,
          autoIdPrefix: "CUST-",
          autoIdDigits: 4,
          description: "Unique auto-generated customer code"
        },
        {
          id: "fld_cust_name",
          name: "company_name",
          label: "Company / Client Name",
          type: "string",
          required: true,
          unique: true,
          maxLength: 100
        },
        {
          id: "fld_cust_email",
          name: "contact_email",
          label: "Billing Email",
          type: "string",
          required: true,
          regex: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"
        },
        {
          id: "fld_cust_tier",
          name: "tier",
          label: "Subscription Tier",
          type: "select",
          staticOptions: ["Startup", "Growth", "Enterprise", "VIP Partner"],
          defaultValue: "Growth"
        },
        {
          id: "fld_cust_credit",
          name: "credit_limit",
          label: "Credit Limit ($)",
          type: "number",
          min: 0,
          max: 1000000,
          defaultValue: 25000
        },
        {
          id: "fld_cust_active",
          name: "is_active",
          label: "Account Active",
          type: "boolean",
          defaultValue: true
        }
      ],
      foreignKeys: []
    },
    {
      id: "tbl_products",
      name: "products",
      label: "Products & Services",
      description: "Catalog of software licenses, consulting packages, and hardware items",
      primaryKeyFieldId: "fld_prod_id",
      fields: [
        {
          id: "fld_prod_id",
          name: "id",
          label: "Product Code",
          type: "autoid",
          isPrimaryKey: true,
          required: true,
          autoIdPrefix: "PRD-",
          autoIdDigits: 3
        },
        {
          id: "fld_prod_name",
          name: "product_name",
          label: "Product / Service Title",
          type: "string",
          required: true,
          unique: true
        },
        {
          id: "fld_prod_category",
          name: "category",
          label: "Category",
          type: "select",
          staticOptions: ["Cloud Subscription", "Professional Services", "Support Plan", "Hardware Asset"]
        },
        {
          id: "fld_prod_unit_price",
          name: "unit_price",
          label: "Standard Unit Price ($)",
          type: "number",
          required: true,
          min: 0
        },
        {
          id: "fld_prod_stock",
          name: "stock_quantity",
          label: "Available Inventory",
          type: "number",
          defaultValue: 100
        }
      ],
      foreignKeys: []
    },
    {
      id: "tbl_invoices",
      name: "invoices",
      label: "Invoices",
      description: "Master invoice headers issued to clients",
      primaryKeyFieldId: "fld_inv_id",
      fields: [
        {
          id: "fld_inv_id",
          name: "id",
          label: "Invoice Number",
          type: "autoid",
          isPrimaryKey: true,
          required: true,
          autoIdPrefix: "INV-2026-",
          autoIdDigits: 4
        },
        {
          id: "fld_inv_cust_id",
          name: "customer_id",
          label: "Customer Account",
          type: "lov",
          lovType: "foreign_key",
          required: true,
          foreignKeyTargetTable: "tbl_customers",
          foreignKeyTargetField: "fld_cust_id",
          foreignKeyDisplayField: "fld_cust_name"
        },
        {
          id: "fld_inv_date",
          name: "issue_date",
          label: "Issue Date",
          type: "date",
          required: true
        },
        {
          id: "fld_inv_due_date",
          name: "due_date",
          label: "Payment Due Date",
          type: "date",
          required: true
        },
        {
          id: "fld_inv_status",
          name: "status",
          label: "Invoice Status",
          type: "select",
          staticOptions: ["Draft", "Sent", "Paid", "Overdue", "Cancelled"],
          defaultValue: "Sent"
        },
        {
          id: "fld_inv_total",
          name: "total_amount",
          label: "Total Amount ($)",
          type: "number",
          min: 0,
          defaultValue: 0
        }
      ],
      foreignKeys: [
        {
          id: "fk_inv_customer",
          name: "FK_Invoices_Customer",
          sourceTableId: "tbl_invoices",
          sourceFieldId: "fld_inv_cust_id",
          targetTableId: "tbl_customers",
          targetFieldId: "fld_cust_id",
          relationshipType: "many-to-one",
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          description: "Links invoice to registered customer"
        }
      ]
    },
    {
      id: "tbl_invoice_items",
      name: "invoice_items",
      label: "Invoice Line Items",
      description: "Individual products and quantities associated with an invoice",
      isDetailTable: true,
      masterTableId: "tbl_invoices",
      primaryKeyFieldId: "fld_item_id",
      fields: [
        {
          id: "fld_item_id",
          name: "id",
          label: "Line Item ID",
          type: "autoid",
          isPrimaryKey: true,
          required: true,
          autoIdPrefix: "ITEM-",
          autoIdDigits: 5
        },
        {
          id: "fld_item_inv_id",
          name: "invoice_id",
          label: "Parent Invoice",
          type: "lov",
          lovType: "foreign_key",
          required: true,
          foreignKeyTargetTable: "tbl_invoices",
          foreignKeyTargetField: "fld_inv_id",
          foreignKeyDisplayField: "fld_inv_id"
        },
        {
          id: "fld_item_prod_id",
          name: "product_id",
          label: "Selected Product",
          type: "lov",
          lovType: "foreign_key",
          required: true,
          foreignKeyTargetTable: "tbl_products",
          foreignKeyTargetField: "fld_prod_id",
          foreignKeyDisplayField: "fld_prod_name"
        },
        {
          id: "fld_item_qty",
          name: "quantity",
          label: "Quantity",
          type: "number",
          required: true,
          min: 1,
          defaultValue: 1
        },
        {
          id: "fld_item_price",
          name: "unit_price",
          label: "Applied Rate ($)",
          type: "number",
          required: true,
          min: 0
        },
        {
          id: "fld_item_total",
          name: "line_total",
          label: "Subtotal ($)",
          type: "number",
          min: 0
        }
      ],
      foreignKeys: [
        {
          id: "fk_item_invoice",
          name: "FK_InvoiceItems_Invoice",
          sourceTableId: "tbl_invoice_items",
          sourceFieldId: "fld_item_inv_id",
          targetTableId: "tbl_invoices",
          targetFieldId: "fld_inv_id",
          relationshipType: "many-to-one",
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
          description: "Detail items cascade delete when parent invoice is deleted"
        },
        {
          id: "fk_item_product",
          name: "FK_InvoiceItems_Product",
          sourceTableId: "tbl_invoice_items",
          sourceFieldId: "fld_item_prod_id",
          targetTableId: "tbl_products",
          targetFieldId: "fld_prod_id",
          relationshipType: "many-to-one",
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          description: "Blocks product deletion if referenced in line items"
        }
      ]
    },
    {
      id: "tbl_projects",
      name: "projects",
      label: "Client Projects",
      description: "Deliverables, milestones, and client engagement tracks",
      primaryKeyFieldId: "fld_proj_id",
      fields: [
        {
          id: "fld_proj_id",
          name: "id",
          label: "Project Code",
          type: "autoid",
          isPrimaryKey: true,
          required: true,
          autoIdPrefix: "PRJ-",
          autoIdDigits: 3
        },
        {
          id: "fld_proj_name",
          name: "project_name",
          label: "Project Name",
          type: "string",
          required: true
        },
        {
          id: "fld_proj_cust_id",
          name: "customer_id",
          label: "Client Account",
          type: "lov",
          lovType: "foreign_key",
          required: true,
          foreignKeyTargetTable: "tbl_customers",
          foreignKeyTargetField: "fld_cust_id",
          foreignKeyDisplayField: "fld_cust_name"
        },
        {
          id: "fld_proj_status",
          name: "status",
          label: "Status",
          type: "select",
          staticOptions: ["Planning", "In Progress", "Review", "Completed", "On Hold"],
          defaultValue: "In Progress"
        },
        {
          id: "fld_proj_budget",
          name: "budget",
          label: "Budget Allocated ($)",
          type: "number",
          min: 0,
          defaultValue: 15000
        }
      ],
      foreignKeys: [
        {
          id: "fk_proj_customer",
          name: "FK_Projects_Customer",
          sourceTableId: "tbl_projects",
          sourceFieldId: "fld_proj_cust_id",
          targetTableId: "tbl_customers",
          targetFieldId: "fld_cust_id",
          relationshipType: "many-to-one",
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          description: "Relates project to client customer account"
        }
      ]
    }
  ],
  forms: [
    {
      id: "frm_invoice_entry",
      name: "invoice_entry",
      title: "Invoice & Line Items Management",
      tableId: "tbl_invoices",
      layoutType: "master_detail_grid",
      detailTableId: "tbl_invoice_items",
      detailMasterKeyField: "fld_inv_id",
      detailForeignKeyField: "fld_item_inv_id",
      fields: [
        { id: "ff_1", tableFieldId: "fld_inv_id", label: "Invoice Number", controlType: "readonly_autoid", gridColSpan: 6 },
        { id: "ff_2", tableFieldId: "fld_inv_cust_id", label: "Customer Account", controlType: "lov_modal", isRequired: true, gridColSpan: 6 },
        { id: "ff_3", tableFieldId: "fld_inv_date", label: "Issue Date", controlType: "date", isRequired: true, gridColSpan: 4 },
        { id: "ff_4", tableFieldId: "fld_inv_due_date", label: "Due Date", controlType: "date", isRequired: true, gridColSpan: 4 },
        { id: "ff_5", tableFieldId: "fld_inv_status", label: "Status", controlType: "select", gridColSpan: 4 },
        { id: "ff_6", tableFieldId: "fld_inv_total", label: "Calculated Total ($)", controlType: "number", gridColSpan: 12 }
      ],
      detailFields: [
        { id: "dff_1", tableFieldId: "fld_item_prod_id", label: "Product / Item", controlType: "lov_modal", isRequired: true, gridColSpan: 4 },
        { id: "dff_2", tableFieldId: "fld_item_qty", label: "Qty", controlType: "number", isRequired: true, gridColSpan: 2 },
        { id: "dff_3", tableFieldId: "fld_item_price", label: "Unit Price ($)", controlType: "number", isRequired: true, gridColSpan: 3 },
        { id: "dff_4", tableFieldId: "fld_item_total", label: "Subtotal ($)", controlType: "number", gridColSpan: 3 }
      ]
    },
    {
      id: "frm_customer_entry",
      name: "customer_entry",
      title: "New Customer Registration",
      tableId: "tbl_customers",
      layoutType: "single",
      fields: [
        { id: "cff_1", tableFieldId: "fld_cust_id", label: "Customer ID", controlType: "readonly_autoid", gridColSpan: 4 },
        { id: "cff_2", tableFieldId: "fld_cust_name", label: "Company Name", controlType: "text", isRequired: true, gridColSpan: 8 },
        { id: "cff_3", tableFieldId: "fld_cust_email", label: "Billing Email", controlType: "text", isRequired: true, gridColSpan: 6 },
        { id: "cff_4", tableFieldId: "fld_cust_tier", label: "Subscription Tier", controlType: "select", gridColSpan: 6 },
        { id: "cff_5", tableFieldId: "fld_cust_credit", label: "Credit Limit ($)", controlType: "number", gridColSpan: 6 },
        { id: "cff_6", tableFieldId: "fld_cust_active", label: "Active Status", controlType: "checkbox", gridColSpan: 6 }
      ]
    },
    {
      id: "frm_product_entry",
      name: "product_entry",
      title: "Product Catalog Management",
      tableId: "tbl_products",
      layoutType: "single",
      fields: [
        { id: "pff_1", tableFieldId: "fld_prod_id", label: "Product Code", controlType: "readonly_autoid", gridColSpan: 4 },
        { id: "pff_2", tableFieldId: "fld_prod_name", label: "Product Name", controlType: "text", isRequired: true, gridColSpan: 8 },
        { id: "pff_3", tableFieldId: "fld_prod_category", label: "Category", controlType: "select", gridColSpan: 6 },
        { id: "pff_4", tableFieldId: "fld_prod_unit_price", label: "Unit Price ($)", controlType: "number", isRequired: true, gridColSpan: 6 },
        { id: "pff_5", tableFieldId: "fld_prod_stock", label: "Stock Quantity", controlType: "number", gridColSpan: 12 }
      ]
    }
  ],
  reports: [
    {
      id: "rep_invoice_analytics",
      name: "invoice_analytics",
      title: "Invoice Revenue & Status Breakdown",
      primaryTableId: "tbl_invoices",
      chartType: "bar",
      groupField: "fld_inv_status",
      metricFields: [
        { id: "rm_1", label: "Total Revenue ($)", field: "fld_inv_total", aggregation: "sum", format: "currency" },
        { id: "rm_2", label: "Invoice Count", field: "fld_inv_id", aggregation: "count", format: "number" }
      ]
    },
    {
      id: "rep_customer_tiers",
      name: "customer_tiers",
      title: "Customer Distribution by Tier",
      primaryTableId: "tbl_customers",
      chartType: "pie",
      groupField: "fld_cust_tier",
      metricFields: [
        { id: "rm_3", label: "Total Customers", field: "fld_cust_id", aggregation: "count", format: "number" },
        { id: "rm_4", label: "Total Credit Assigned ($)", field: "fld_cust_credit", aggregation: "sum", format: "currency" }
      ]
    }
  ],
  menus: [
    {
      id: "menu_billing",
      title: "Sales & Billing",
      icon: "DollarSign",
      order: 1,
      submenus: [
        { id: "sub_inv_entry", title: "Invoices & Lines", type: "form", targetId: "frm_invoice_entry" },
        { id: "sub_inv_analytics", title: "Revenue Reports", type: "report", targetId: "rep_invoice_analytics" }
      ]
    },
    {
      id: "menu_crm",
      title: "CRM & Customers",
      icon: "Users",
      order: 2,
      submenus: [
        { id: "sub_cust_entry", title: "Customers Directory", type: "form", targetId: "frm_customer_entry" },
        { id: "sub_cust_tiers", title: "Tier Analysis", type: "report", targetId: "rep_customer_tiers" }
      ]
    },
    {
      id: "menu_catalog",
      title: "Product Catalog",
      icon: "Package",
      order: 3,
      submenus: [
        { id: "sub_prod_entry", title: "Products & Pricing", type: "form", targetId: "frm_product_entry" }
      ]
    }
  ]
};

export const sampleInitialDatabaseData: Record<string, any[]> = {
  tbl_customers: [
    {
      fld_cust_id: "CUST-0001",
      fld_cust_name: "Acme Cloud Technologies",
      fld_cust_email: "billing@acmecloud.io",
      fld_cust_tier: "Enterprise",
      fld_cust_credit: 50000,
      fld_cust_active: true
    },
    {
      fld_cust_id: "CUST-0002",
      fld_cust_name: "Apex Global Dynamics",
      fld_cust_email: "accounts@apexglobal.com",
      fld_cust_tier: "VIP Partner",
      fld_cust_credit: 100000,
      fld_cust_active: true
    },
    {
      fld_cust_id: "CUST-0003",
      fld_cust_name: "Starlight Digital Labs",
      fld_cust_email: "finance@starlightlabs.co",
      fld_cust_tier: "Growth",
      fld_cust_credit: 20000,
      fld_cust_active: true
    },
    {
      fld_cust_id: "CUST-0004",
      fld_cust_name: "Quantum Leap Ventures",
      fld_cust_email: "ops@quantumleap.ai",
      fld_cust_tier: "Startup",
      fld_cust_credit: 10000,
      fld_cust_active: true
    }
  ],
  tbl_products: [
    {
      fld_prod_id: "PRD-001",
      fld_prod_name: "Enterprise Cloud Node License",
      fld_prod_category: "Cloud Subscription",
      fld_prod_unit_price: 1200,
      fld_prod_stock: 500
    },
    {
      fld_prod_id: "PRD-002",
      fld_prod_name: "AI Database Optimizer Addon",
      fld_prod_category: "Cloud Subscription",
      fld_prod_unit_price: 450,
      fld_prod_stock: 999
    },
    {
      fld_prod_id: "PRD-003",
      fld_prod_name: "Custom Integration Architecture Sprint",
      fld_prod_category: "Professional Services",
      fld_prod_unit_price: 3500,
      fld_prod_stock: 50
    },
    {
      fld_prod_id: "PRD-004",
      fld_prod_name: "24/7 Dedicated SRE Support SLA",
      fld_prod_category: "Support Plan",
      fld_prod_unit_price: 800,
      fld_prod_stock: 100
    }
  ],
  tbl_invoices: [
    {
      fld_inv_id: "INV-2026-0001",
      fld_inv_cust_id: "CUST-0001",
      fld_inv_date: "2026-08-01",
      fld_inv_due_date: "2026-08-31",
      fld_inv_status: "Paid",
      fld_inv_total: 5900
    },
    {
      fld_inv_id: "INV-2026-0002",
      fld_inv_cust_id: "CUST-0002",
      fld_inv_date: "2026-08-05",
      fld_inv_due_date: "2026-09-05",
      fld_inv_status: "Sent",
      fld_inv_total: 8200
    },
    {
      fld_inv_id: "INV-2026-0003",
      fld_inv_cust_id: "CUST-0003",
      fld_inv_date: "2026-08-10",
      fld_inv_due_date: "2026-09-10",
      fld_inv_status: "Sent",
      fld_inv_total: 3500
    }
  ],
  tbl_invoice_items: [
    {
      fld_item_id: "ITEM-00001",
      fld_item_inv_id: "INV-2026-0001",
      fld_item_prod_id: "PRD-001",
      fld_item_qty: 2,
      fld_item_price: 1200,
      fld_item_total: 2400
    },
    {
      fld_item_id: "ITEM-00002",
      fld_item_inv_id: "INV-2026-0001",
      fld_item_prod_id: "PRD-003",
      fld_item_qty: 1,
      fld_item_price: 3500,
      fld_item_total: 3500
    },
    {
      fld_item_id: "ITEM-00003",
      fld_item_inv_id: "INV-2026-0002",
      fld_item_prod_id: "PRD-001",
      fld_item_qty: 4,
      fld_item_price: 1200,
      fld_item_total: 4800
    },
    {
      fld_item_id: "ITEM-00004",
      fld_item_inv_id: "INV-2026-0002",
      fld_item_prod_id: "PRD-002",
      fld_item_qty: 2,
      fld_item_price: 450,
      fld_item_total: 900
    },
    {
      fld_item_id: "ITEM-00005",
      fld_item_inv_id: "INV-2026-0002",
      fld_item_prod_id: "PRD-004",
      fld_item_qty: 1,
      fld_item_price: 2500,
      fld_item_total: 2500
    },
    {
      fld_item_id: "ITEM-00006",
      fld_item_inv_id: "INV-2026-0003",
      fld_item_prod_id: "PRD-003",
      fld_item_qty: 1,
      fld_item_price: 3500,
      fld_item_total: 3500
    }
  ],
  tbl_projects: [
    {
      fld_proj_id: "PRJ-001",
      fld_proj_name: "Cloud Data Lake Migration",
      fld_proj_cust_id: "CUST-0001",
      fld_proj_status: "In Progress",
      fld_proj_budget: 45000
    },
    {
      fld_proj_id: "PRJ-002",
      fld_proj_name: "AI Copilot Integration",
      fld_proj_cust_id: "CUST-0002",
      fld_proj_status: "Planning",
      fld_proj_budget: 75000
    }
  ]
};

export const DEFAULT_SAAS_SCHEMA = defaultSaaSApp;
export const DEFAULT_SAAS_DATA = sampleInitialDatabaseData;
