export const hasSelectedApiKey = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).aistudio?.hasSelectedApiKey) {
    return await (window as any).aistudio.hasSelectedApiKey();
  }
  return false;
};

export const openSelectKey = async (): Promise<void> => {
  if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
    await (window as any).aistudio.openSelectKey();
  }
};

export const handleAiError = async (error: any): Promise<boolean> => {
  const errorMessage = error?.message || '';
  if (errorMessage.includes('Forbidden') || errorMessage.includes('403') || errorMessage.includes('Requested entity was not found')) {
    const confirm = window.confirm('Parece que hay un problema con la clave de API de Gemini (Error 403/Forbidden). ¿Deseas seleccionar una clave de API válida ahora?');
    if (confirm) {
      await openSelectKey();
      return true; // Key selection triggered
    }
  }
  return false;
};
