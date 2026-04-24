export function getGeminiApiKey(): string {
  // Intentar obtener la clave desde diferentes fuentes posibles
  const key = process.env.GEMINI_API_KEY || 
              import.meta.env.VITE_GEMINI_API_KEY || 
              process.env.API_KEY || 
              import.meta.env.VITE_API_KEY;

  console.log("Gemini API Key check:", key ? `Presente (longitud: ${key.length})` : "MISSING");

  if (!key) {
    console.error("CRITICAL: Gemini API key is missing in environment variables.");
    throw new Error("API key is missing. Please provide a valid API key.");
  }
  return key;
}
