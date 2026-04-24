import { Type } from "@google/genai";
import { AI_MODELS, FALLBACK_ORDER } from "../constants/aiModels";

export type AIProvider = "gemini" | "groq" | "openrouter";

export const getAIProvider = (): AIProvider => {
  try {
    return (localStorage.getItem("ai_provider") as AIProvider) || "gemini";
  } catch (e) {
    return "gemini";
  }
};

export const setAIProvider = (provider: AIProvider) => {
  try {
    localStorage.setItem("ai_provider", provider);
  } catch (e) {
    console.error("Failed to save AI provider to localStorage", e);
  }
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    let errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    if (errorMessage === 'Failed to fetch' || errorMessage.includes('fetch')) {
      errorMessage = 'Error de red al contactar la IA. El servidor podría estar inactivo o bloqueado.';
    }
    console.error('AI generation error:', errorMessage);
    
    if (retries > 0) {
      console.log(`Retrying AI request... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw new Error(errorMessage);
  }
};

export const generateContent = async (
  prompt: string, 
  model?: string, 
  config?: any, 
  extraParts?: any[],
  forceProvider?: AIProvider
): Promise<string> => {
  const provider = forceProvider || getAIProvider();
  
  try {
    return await generateContentWithProvider(provider, prompt, model, config, extraParts);
  } catch (error: any) {
    console.warn(`Provider ${provider} failed. Trying fallback...`);
    
    // Find next provider in fallback order
    const currentIndex = FALLBACK_ORDER.indexOf(provider);
    if (currentIndex !== -1 && currentIndex < FALLBACK_ORDER.length - 1) {
      const nextProvider = FALLBACK_ORDER[currentIndex + 1] as AIProvider;
      return generateContent(prompt, model, config, extraParts, nextProvider);
    }
    
    throw error;
  }
};

const getValidModel = (provider: AIProvider, model?: string) => {
  if (provider === 'groq') {
    if (!model || model.includes('gemini') || model.includes('gpt')) return AI_MODELS.groq.default;
    return model;
  }
  if (provider === 'openrouter') {
    if (!model || model.includes('gemini-3-flash-preview')) return AI_MODELS.openrouter.default;
    return model;
  }
  return model || AI_MODELS.gemini.default;
};

const generateContentWithProvider = async (
  provider: AIProvider,
  prompt: string, 
  model?: string, 
  config?: any, 
  extraParts?: any[]
): Promise<string> => {
  const validModel = getValidModel(provider, model);
  
  let finalPrompt = prompt;
  if (config?.responseSchema || config?.responseMimeType === 'application/json') {
    const schemaStr = config.responseSchema ? `\n\nJSON Schema:\n${JSON.stringify(config.responseSchema, null, 2)}` : '';
    finalPrompt += `\n\nIMPORTANT: You must respond ONLY with a valid JSON object. Do not include any conversational text, markdown formatting (other than optionally a json code block), or explanations.${schemaStr}`;
  }
  
  return withRetry(async () => {
    if (provider === "groq") {
      let textContent = finalPrompt;
      if (extraParts) {
        extraParts.forEach(part => {
          if (part.text) textContent += "\n" + part.text;
        });
      }
      const messages: any[] = [{ role: "user", content: textContent }];
      
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages, 
          model: validModel,
        })
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const data = await response.json();
      return data.content;
    }
    
    if (provider === "openrouter") {
      const messages: any[] = [{ role: "user", content: [{ type: "text", text: finalPrompt }] }];
      if (extraParts) {
        extraParts.forEach(part => {
          if (part.text) messages[0].content.push({ type: "text", text: part.text });
          if (part.inlineData) {
            messages[0].content.push({ 
              type: "image_url", 
              image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` } 
            });
          }
        });
      }
      
      const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages, 
          model: validModel,
          config: { ...config, max_tokens: 2000 }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('402') || errorText.includes('credits')) {
          throw new Error("CREDITS_EXHAUSTED: No hay créditos disponibles en OpenRouter.");
        }
        throw new Error(errorText);
      }
      
      const data = await response.json();
      return data.content;
    }
    
    if (provider === "gemini") {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: finalPrompt, 
          model: validModel,
          config: config,
          extraParts: extraParts
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      const data = await response.json();
      return data.content;
    }
    
    throw new Error(`Unknown AI provider: ${provider}`);
  });
};

export const getAIModel = (): string => {
  try {
    const model = localStorage.getItem("ai_model");
    const validModels = [
      "gemini-3-flash-preview", 
      "google/gemini-2.0-pro-exp-02-05", 
      "anthropic/claude-3.5-sonnet", 
      "openai/gpt-4o",
      "llama-3.3-70b-versatile",
      "llama3-70b-8192",
      "mixtral-8x7b-32768"
    ];
    if (model && validModels.includes(model)) {
      return model;
    }
    return "gemini-3-flash-preview";
  } catch (e) {
    return "gemini-3-flash-preview";
  }
};

export const setAIModel = (model: string) => {
  try {
    localStorage.setItem("ai_model", model);
  } catch (e) {
    console.error("Failed to save AI model to localStorage", e);
  }
};

export const aiProviderService = {
  getAIProvider,
  setAIProvider,
  generateContent,
  getAIModel,
  setAIModel
};
