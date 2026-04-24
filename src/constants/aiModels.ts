export const AI_MODELS = {
  gemini: {
    default: "gemini-3-flash-preview",
    fallback: "gemini-3.1-flash-lite-preview",
  },
  groq: {
    default: "llama-3.3-70b-versatile",
  },
  openrouter: {
    // Using a more compatible model on OpenRouter
    default: "meta-llama/llama-3-8b-instruct",
  }
};

export const FALLBACK_ORDER = ["gemini", "groq", "openrouter"];
