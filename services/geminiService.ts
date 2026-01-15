
import { GoogleGenAI } from "@google/genai";

// Guideline: Always use process.env.API_KEY directly when initializing the client.

export const generateAiVideo = async (prompt: string): Promise<string> => {
  // Guideline: For Veo models, check if a paid API key is selected.
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey && typeof (window as any).aistudio?.openSelectKey === 'function') {
      await (window as any).aistudio.openSelectKey();
      // Proceed assuming success as per guidelines: "assume the key selection was successful after triggering openSelectKey() and proceed"
    }
  }

  // Guideline: Create a new GoogleGenAI instance right before making an API call.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Estilo cinematográfico, alta qualidade, 1080p: ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    // Guideline: Append API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Erro ao gerar vídeo com Veo:', error);
    throw error;
  }
};

export const getTrendingNews = async (): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Quais são as 3 principais tendências ou notícias de hoje sobre programação e tecnologia no Brasil?",
      config: { 
        tools: [{ googleSearch: {} }] 
      },
    });
    // Guideline: Extract groundingChunks for search grounding.
    return response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return [];
  }
};

export const generateRepostCaption = async (originalDescription: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O usuário quer republicar um vídeo com esta descrição: "${originalDescription}". Crie uma legenda curta em português.`,
    });
    // Guideline: Access .text property directly.
    return response.text || 'Incrível! 🚀';
  } catch (error) {
    return 'Olha isso! 🔥';
  }
};

export const suggestComment = async (videoDescription: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O vídeo diz: "${videoDescription}". Sugira um comentário curto.`,
    });
    // Guideline: Access .text property directly.
    return response.text || 'Muito bom!';
  } catch (error) {
    return 'Incrível! ✨';
  }
};
