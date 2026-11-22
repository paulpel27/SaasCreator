import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for Gemini AI client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// AI Schema Generator Route
app.post('/api/ai/generate-schema', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a relational database architect. Based on the user's description, generate a complete SaaSAppSchema JSON and seedData JSON.

User Description: "${prompt}"

Return ONLY a valid raw JSON object (without markdown code blocks) with this exact schema:
{
  "schema": {
    "appTitle": "String name of the SaaS",
    "appDescription": "Short description",
    "tables": [
      {
        "id": "tbl_customers",
        "name": "customers",
        "label": "Customers",
        "primaryKeyFieldId": "fld_cust_id",
        "fields": [
          {
            "id": "fld_cust_id",
            "name": "id",
            "label": "Customer ID",
            "type": "autoid",
            "isPrimaryKey": true,
            "autoIdPrefix": "CUST-",
            "autoIdDigits": 4
          },
          {
            "id": "fld_name",
            "name": "name",
            "label": "Full Name",
            "type": "string",
            "required": true
          }
        ],
        "foreignKeys": []
      }
    ],
    "forms": [],
    "reports": [],
    "menus": []
  },
  "seedData": {
    "tbl_customers": [
      { "fld_cust_id": "CUST-0001", "fld_name": "Example Corp" }
    ]
  }
}`
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.json(parsed);
    }

    // High quality offline fallback generator
    const defaultTitle = prompt.length > 30 ? `${prompt.slice(0, 27)}...` : prompt;
    const fallbackSchema = {
      schema: {
        appTitle: defaultTitle,
        appDescription: `Custom relational SaaS workspace generated for ${prompt}`,
        tables: [
          {
            id: 'tbl_main',
            name: 'main_records',
            label: 'Main Records',
            primaryKeyFieldId: 'fld_m_id',
            fields: [
              { id: 'fld_m_id', name: 'id', label: 'Record ID', type: 'autoid', isPrimaryKey: true, autoIdPrefix: 'REC-', autoIdDigits: 4 },
              { id: 'fld_m_title', name: 'title', label: 'Title / Subject', type: 'string', required: true },
              { id: 'fld_m_status', name: 'status', label: 'Status', type: 'select', staticOptions: ['Active', 'Pending', 'Closed'] },
              { id: 'fld_m_date', name: 'created_date', label: 'Date', type: 'date' }
            ],
            foreignKeys: []
          },
          {
            id: 'tbl_details',
            name: 'line_items',
            label: 'Line Items',
            primaryKeyFieldId: 'fld_d_id',
            isDetailTable: true,
            masterTableId: 'tbl_main',
            fields: [
              { id: 'fld_d_id', name: 'id', label: 'Item ID', type: 'autoid', isPrimaryKey: true, autoIdPrefix: 'ITEM-', autoIdDigits: 4 },
              { id: 'fld_d_master_id', name: 'main_id', label: 'Parent Record', type: 'lov', lovType: 'foreign_key', foreignKeyTargetTable: 'tbl_main' },
              { id: 'fld_d_desc', name: 'description', label: 'Item Description', type: 'string', required: true },
              { id: 'fld_d_amount', name: 'amount', label: 'Amount ($)', type: 'number' }
            ],
            foreignKeys: [
              {
                id: 'fk_detail_to_main',
                name: 'FK_LineItems_Main',
                sourceTableId: 'tbl_details',
                sourceFieldId: 'fld_d_master_id',
                targetTableId: 'tbl_main',
                targetFieldId: 'fld_m_id',
                relationshipType: 'many-to-one',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
              }
            ]
          }
        ],
        forms: [
          {
            id: 'form_main',
            tableId: 'tbl_main',
            title: `${defaultTitle} Manager`,
            layoutType: 'master_detail_grid',
            detailTableId: 'tbl_details',
            detailForeignKeyField: 'fld_d_master_id',
            sections: []
          }
        ],
        reports: [
          {
            id: 'rep_overview',
            title: `${defaultTitle} Analytics`,
            primaryTableId: 'tbl_main',
            chartType: 'bar',
            groupByFieldId: 'fld_m_status'
          }
        ],
        menus: [
          {
            id: 'menu_main',
            title: 'Workspace',
            icon: 'Layers',
            submenus: [
              { id: 'sub_entry', title: 'Data Entry', targetType: 'form', targetId: 'form_main' }
            ]
          }
        ]
      },
      seedData: {
        tbl_main: [
          { fld_m_id: 'REC-0001', fld_m_title: 'Initial Alpha Entry', fld_m_status: 'Active', fld_m_date: '2026-08-16' },
          { fld_m_id: 'REC-0002', fld_m_title: 'Beta Operations Review', fld_m_status: 'Pending', fld_m_date: '2026-08-17' }
        ],
        tbl_details: [
          { fld_d_id: 'ITEM-0001', fld_d_master_id: 'REC-0001', fld_d_desc: 'Initial provisioning module', fld_d_amount: 1500 },
          { fld_d_id: 'ITEM-0002', fld_d_master_id: 'REC-0001', fld_d_desc: 'Security policy audit', fld_d_amount: 850 },
          { fld_d_id: 'ITEM-0003', fld_d_master_id: 'REC-0002', fld_d_desc: 'Database normalization pass', fld_d_amount: 2200 }
        ]
      }
    };

    return res.json(fallbackSchema);
  } catch (err: any) {
    console.error('Schema generation error:', err);
    res.status(500).json({ error: err.message || 'Internal server error during schema generation' });
  }
});

// AI Chat Assistant Route
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, schemaContext } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert SaaS relational database engineer and system architect.
Current Schema Overview: ${JSON.stringify(schemaContext?.tables?.map((t: any) => ({ name: t.name, fields: t.fields.map((f: any) => f.name), fks: t.foreignKeys })))}

User Query: "${message}"

Give a concise, helpful, practical recommendation regarding database normalization, foreign keys, SQL indexing, cascade deletes, or UI structure.`
      });

      return res.json({ reply: response.text });
    }

    return res.json({
      reply: `For optimal database structure, make sure your primary keys are unique and foreign keys reference existing table records. You can check the D3 Schema Map to inspect relational connections graphically.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chat service error' });
  }
});

// Production vs Development static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In dev mode, use Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
