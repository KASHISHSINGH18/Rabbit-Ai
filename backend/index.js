import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as XLSX from 'xlsx';
import swaggerUi from 'swagger-ui-express';
import { generateSummary } from './aiService.js';
import { sendEmailSummary } from './emailService.js';

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and XLSX are allowed.'));
    }
  }
});

// Swagger documentation
const swaggerDocument = {
  openapi: '3.0.0',
  info: { title: 'Sales Insight Automator API', version: '1.0.0' },
  paths: {
    '/upload': {
      post: {
        summary: 'Upload Sales Data and Generate AI Summary',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary', description: 'CSV or XLSX file (5MB limit)' },
                  email_address: { type: 'string', format: 'email', description: 'Recipient email address' }
                },
                required: ['file', 'email_address']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Bad Request' },
          '500': { description: 'Internal Server Error' }
        }
      }
    }
  }
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'File is required' });
    }
    const email_address = req.body.email_address;
    if (!email_address) {
      return res.status(400).json({ detail: 'Email address is required' });
    }
    
    // Input Sanitization: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_address)) {
      return res.status(400).json({ detail: 'Invalid email address format' });
    }

    // Parse the file safely with XLSX
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(sheet);
    
    if (data.length === 0) {
      return res.status(400).json({ detail: 'File is empty or cannot be parsed' });
    }

    // Extract a sample for the AI (first 100 rows to avoid token explosion)
    const sampleData = data.slice(0, 100);
    const dataString = JSON.stringify(sampleData);

    const summary = await generateSummary(dataString);
    await sendEmailSummary(email_address, summary);

    res.json({ status: 'success', summary });
  } catch (err) {
    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json({ detail: err.message });
    }
    if (err.message === 'File too large') {
      return res.status(400).json({ detail: 'File size exceeds the allowable limit of 5 MB.' });
    }
    console.error(err);
    res.status(500).json({ detail: err.message || 'Internal Server Error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log(`Swagger docs at http://0.0.0.0:${port}/docs`);
});
