import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Proxy for Groq
import OpenAI from 'openai';

app.post('/api/groq', async (req, res) => {
  const { messages, model } = req.body;
  
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const completion = await openai.chat.completions.create({
      messages,
      model: model || 'llama-3.3-70b-versatile',
    });

    res.json({ content: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('Groq API error:', error);
    const errorMessage = error?.message || 'Failed to call Groq API';
    res.status(error?.status || 500).json({ error: errorMessage });
  }
});

// API Proxy for OpenRouter
app.post('/api/openrouter', async (req, res) => {
  const { messages, model, config } = req.body;
  
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured' });
  }

  try {
    const completionParams: any = {
      messages,
      model: model || 'gemini-3-flash-preview',
      provider: {
        require_parameters: true,
        data_collection: "allow",
        allow_fallbacks: true
      }
    };

    // Limit max_tokens to avoid 402 errors and ensure reasonable output
    completionParams.max_tokens = config?.maxOutputTokens || 4000;

    if (config?.responseMimeType === 'application/json') {
      // We don't use response_format: { type: 'json_object' } here because many free OpenRouter models don't support it.
      // Instead, we rely on the system prompt to enforce JSON output.
      if (!messages.some((m: any) => m.role === 'system')) {
        messages.unshift({
          role: 'system',
          content: 'You must respond with valid JSON.'
        });
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://ungrd-app.com', // Required by OpenRouter for free models
        'X-Title': 'UNGRD App',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(completionParams)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error response:', errorText);
      let errorMsg = errorText;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error && parsed.error.message) {
          errorMsg = parsed.error.message;
        } else if (parsed.error) {
          errorMsg = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
        }
      } catch (e) {
        // Ignore JSON parse error
      }
      return res.status(response.status).json({ error: errorMsg });
    }

    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content;

    if (content == null) {
      console.error('OpenRouter returned null content:', completion);
      return res.status(500).json({ error: 'El modelo no devolvió ningún contenido. Puede deberse a filtros de seguridad o un error interno del modelo.' });
    }

    res.json({ content });
  } catch (error: any) {
    console.error('OpenRouter API error:', error);
    const errorMessage = error?.message || 'Failed to call OpenRouter API';
    res.status(500).json({ error: errorMessage });
  }
});

// Lazy initialization of AI client
let ai: GoogleGenAI | null = null;
function getAiClient() {
  if (!ai) {
    const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!envKey) {
      console.warn('GEMINI_API_KEY is not set. Gemini features will be disabled.');
      return null;
    }
    const apiKey = envKey.trim().replace(/^["']|["']$/g, '');
    // Only block if it's the literal placeholder from .env.example
    if (apiKey === 'MY_GEMINI_API_KEY' || apiKey === '') {
      console.warn('GEMINI_API_KEY is a placeholder or empty. Gemini features will be disabled.');
      return null;
    }
    console.log(`Initializing Gemini client. API Key length: ${apiKey.length}`);
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

app.get('/api/providers', (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const isGeminiValid = geminiKey.length >= 20 && !geminiKey.startsWith('MY_');
  
  res.json({
    gemini: isGeminiValid,
    groq: !!process.env.GROQ_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY
  });
});

app.get('/api/debug-env', (req, res) => {
  res.json({
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    groqKeyConfigured: !!process.env.GROQ_API_KEY,
    openRouterKeyConfigured: !!process.env.OPENROUTER_API_KEY,
  });
});

// API Proxy for Gemini
app.post('/api/gemini', async (req, res) => {
  const { prompt, model, config, extraParts } = req.body;
  
  const aiClient = getAiClient();
  if (!aiClient) {
    return res.status(500).json({ error: 'API_KEY_INVALID: La clave API de Gemini configurada no es válida o es un valor de prueba. Por favor, configura una clave válida en el panel de Secrets de AI Studio.' });
  }

  try {
    const contents: any[] = [{ parts: [{ text: prompt }] }];
    if (extraParts && Array.isArray(extraParts)) {
      contents[0].parts.push(...extraParts);
    }

    try {
      console.log(`Calling Gemini model: ${model || 'gemini-3-flash-preview'}`);
      const response = await aiClient.models.generateContent({
        model: model || 'gemini-3-flash-preview',
        contents: contents,
        config: config,
      });

      console.log('Gemini response received. Text length:', response.text?.length || 0);
      if (!response.text) {
        console.warn('Gemini returned empty text. Response object:', JSON.stringify(response, null, 2));
      }

      res.json({ content: response.text || "" });
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
      if ((model === 'gemini-3-flash-preview' || !model) && (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED'))) {
        console.warn("Primary model overloaded, falling back to gemini-3.1-flash-lite-preview");
        try {
          const fallbackResponse = await aiClient.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: contents,
            config: config,
          });
          return res.json({ content: fallbackResponse.text || "" });
        } catch (fallbackErr: any) {
          console.error('Gemini API fallback error:', fallbackErr);
          const fallbackErrorMessage = fallbackErr?.message || 'Failed to call Gemini API fallback';
          return res.status(fallbackErr?.status || 500).json({ error: fallbackErrorMessage });
        }
      }
      throw err;
    }
  } catch (error: any) {
    console.error('Gemini API error:', error);
    const errorMessage = error?.message || 'Failed to call Gemini API';
    res.status(error?.status || 500).json({ error: errorMessage });
  }
});

app.post('/api/process-pot', upload.single('pot'), async (req: any, res: any) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdf(dataBuffer);
    const text = data.text.substring(0, 30000); // Limit text to avoid token limits

    fs.unlinkSync(req.file.path);

    const aiClient = getAiClient();
    if (!aiClient) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const prompt = `Extrae la siguiente información del texto del Plan de Ordenamiento Territorial (POT) y responde en formato JSON:
    {
      "landUseZones": [{"name": "string", "type": "string", "restrictions": ["string"]}],
      "riskZones": [{"name": "string", "level": "string"}]
    }
    
    Texto:\n\n${text}`;

    let response;
    let retries = 3;
    let delay = 2000;
    
    while (retries > 0) {
      try {
        response = await aiClient.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
          }
        });
        break; // Success, exit loop
      } catch (err: any) {
        const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
        const isRetryable = errorMessage && (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE'));
        
        if (isRetryable) {
          console.warn(`Gemini API overloaded in process-pot, retrying... (${retries} left)`);
          
          // Try fallback model on last retry
          if (retries === 1) {
            console.warn("Falling back to gemini-3.1-flash-lite-preview");
            try {
              response = await aiClient.models.generateContent({
                model: 'gemini-3.1-flash-lite-preview',
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                  responseMimeType: 'application/json',
                }
              });
              break;
            } catch (fallbackErr) {
              throw fallbackErr;
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          retries--;
        } else {
          throw err;
        }
      }
    }

    if (!response) {
      throw new Error("Failed to generate content after retries");
    }

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing PDF.');
  }
});

app.post('/api/extract-pdf-text', upload.single('file'), async (req: any, res: any) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdf(dataBuffer);
    const text = data.text;

    fs.unlinkSync(req.file.path);
    res.json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error extracting text from PDF.');
  }
});

// Vite middleware setup
import { createServer as createViteServer } from 'vite';

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
