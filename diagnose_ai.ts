import { GoogleGenAI } from "@google/genai";

async function diagnose() {
  console.log("--- DIAGNÓSTICO DE IA ---");
  
  // 1. Verificar variables de entorno
  console.log("Variables detectadas:");
  console.log("- GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "CONFIGURADA (longitud: " + process.env.GEMINI_API_KEY.length + ")" : "NO CONFIGURADA");
  console.log("- GROQ_API_KEY:", process.env.GROQ_API_KEY ? "CONFIGURADA" : "NO CONFIGURADA");
  console.log("- OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY ? "CONFIGURADA" : "NO CONFIGURADA");

  // 2. Probar Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: "test" });
      console.log("✅ Gemini: Conexión exitosa");
    } catch (e: any) {
      console.log("❌ Gemini: Error -", e.message);
    }
  }

  // 3. Probar Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{role: "user", content: "test"}] })
      });
      if (response.ok) console.log("✅ Groq: Conexión exitosa");
      else console.log("❌ Groq: Error -", await response.text());
    } catch (e: any) {
      console.log("❌ Groq: Error -", e.message);
    }
  }

  // 4. Probar OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: "google/gemini-2.0-flash-exp:free", messages: [{role: "user", content: "test"}] })
      });
      if (response.ok) console.log("✅ OpenRouter: Conexión exitosa");
      else console.log("❌ OpenRouter: Error -", await response.text());
    } catch (e: any) {
      console.log("❌ OpenRouter: Error -", e.message);
    }
  }
}

diagnose();
