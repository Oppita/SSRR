import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import cors from 'cors';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// FIX ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Crear carpeta uploads si no existe
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

// CORS - Permitir todas las origenes en producción (ajusta según necesites)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// HEALTH
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GROQ
app.post('/api/groq', async (req, res) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const completion = await openai.chat.completions.create({
      messages: req.body.messages,
      model: req.body.model || 'llama-3.3-70b-versatile',
    });

    res.json({ content: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('GroQ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GEMINI
let ai: GoogleGenAI | null = null;

function getAiClient() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY no configurada');
      return null;
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

app.post('/api/gemini', async (req, res) => {
  const aiClient = getAiClient();
  if (!aiClient) {
    return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: req.body.prompt }] }],
    });

    res.json({ content: response.text || "" });
  } catch (error: any) {
    console.error('Gemini Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PDF
app.post('/api/extract-pdf-text', upload.single('file'), async (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const data = await pdf(fs.readFileSync(req.file.path));
    fs.unlinkSync(req.file.path);
    res.json({ text: data.text });
  } catch (error: any) {
    console.error('PDF Error:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Error processing PDF' });
  }
});

// PRODUCCIÓN - SPA fallback (DEBE ir DESPUÉS de todas las rutas API)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist');

  app.use(express.static(distPath));

  // Solo servir index.html para rutas que NO empiecen con /api
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// START
const port = process.env.PORT || 10000;

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`📁 Uploads dir: ${uploadsDir}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
