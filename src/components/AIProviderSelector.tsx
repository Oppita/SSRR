import React, { useEffect, useState } from 'react';
import { getAIProvider, setAIProvider, AIProvider, getAIModel, setAIModel } from '../services/aiProviderService';

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export const AIProviderSelector: React.FC<{ className?: string }> = ({ className }) => {
  const [provider, setProvider] = useState<AIProvider>(getAIProvider());
  const [model, setModel] = useState<string>(getAIModel());
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (provider === 'openrouter') {
      const fetchModels = async () => {
        setIsLoadingModels(true);
        try {
          const response = await fetch('https://openrouter.ai/api/v1/models');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const freeModels = data.data.filter((m: OpenRouterModel) => 
            m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0"
          );
          setOpenRouterModels(freeModels);
          
          // If current model is not in the list, select the first free model
          if (freeModels.length > 0 && !freeModels.find((m: OpenRouterModel) => m.id === model)) {
            handleModelChange(freeModels[0].id);
          }
        } catch (error) {
          console.error("Failed to fetch OpenRouter models:", error);
          // Fallback to default models if fetch fails
          setOpenRouterModels([
            { id: "google/gemini-2.0-pro-exp-02-05", name: "GEMINI 2.0 PRO EXP", pricing: { prompt: "0", completion: "0" } },
            { id: "anthropic/claude-3.5-sonnet", name: "CLAUDE 3.5 SONNET", pricing: { prompt: "0", completion: "0" } },
            { id: "openai/gpt-4o", name: "GPT-4O", pricing: { prompt: "0", completion: "0" } },
            { id: "meta-llama/llama-3.3-70b-instruct", name: "LLAMA 3.3 70B", pricing: { prompt: "0", completion: "0" } }
          ]);
        } finally {
          setIsLoadingModels(false);
        }
      };
      fetchModels();
    }
  }, [provider]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setAIProvider(newProvider);
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    setAIModel(newModel);
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-1.5 rounded-xl border-2 border-indigo-500 shadow-md ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse ml-1" />
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
          className="bg-white text-slate-900 text-[11px] font-black px-2 py-1.5 rounded-lg border border-slate-200 outline-none hover:bg-slate-50 transition-all min-w-[120px] cursor-pointer"
          title="Proveedor de IA"
        >
          <option value="gemini">GEMINI (Google)</option>
          <option value="groq">GROQ (Llama 3.3)</option>
          <option value="openrouter">OPENROUTER (Varios)</option>
        </select>
      </div>
      
      {(provider === 'openrouter' || provider === 'groq') && (
        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg border border-slate-700 outline-none hover:bg-slate-800 transition-all min-w-[180px] max-w-[250px] cursor-pointer"
          disabled={isLoadingModels && provider === 'openrouter'}
          title="Modelo de IA"
        >
          {provider === 'groq' ? (
            <>
              <option value="llama-3.3-70b-versatile">LLAMA 3.3 70B VERSATILE</option>
              <option value="llama3-70b-8192">LLAMA 3 70B 8192</option>
              <option value="mixtral-8x7b-32768">MIXTRAL 8X7B 32768</option>
            </>
          ) : isLoadingModels ? (
            <option value="">Cargando modelos...</option>
          ) : openRouterModels.length > 0 ? (
            openRouterModels.map((m) => (
              <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
            ))
          ) : (
            <>
              <option value="gemini-3-flash-preview">GEMINI 3 FLASH</option>
              <option value="google/gemini-2.0-pro-exp-02-05">GEMINI 2.0 PRO EXP</option>
              <option value="anthropic/claude-3.5-sonnet">CLAUDE 3.5 SONNET</option>
              <option value="openai/gpt-4o">GPT-4O</option>
              <option value="meta-llama/llama-3.3-70b-instruct">LLAMA 3.3 70B</option>
            </>
          )}
        </select>
      )}
    </div>
  );
};
