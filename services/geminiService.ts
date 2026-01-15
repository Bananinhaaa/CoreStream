
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAiVideo = async (prompt: string): Promise<string> => {
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
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Erro ao gerar vídeo com Veo:', error);
    throw error;
  }
};

export const getTrendingNews = async (): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Quais são as 3 principais tendências ou notícias de hoje sobre programação, scripters e tecnologia no Brasil?",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extraímos os chunks de grounding se disponíveis
    return response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  } catch (error) {
    return [];
  }
};

export const generateRepostCaption = async (originalDescription: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O usuário quer republicar um vídeo com esta descrição: "${originalDescription}". 
      Crie uma legenda de republicação curta, empolgante e com emojis em português.`,
    });
    return response.text || 'Incrível! 🚀';
  } catch (error) {
    return 'Olha isso! 🔥 #vibestream';
  }
};

export const suggestComment = async (videoDescription: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O vídeo diz: "${videoDescription}". Sugira um comentário curto e amigável em português.`,
    });
    return response.text || 'Muito bom!';
  } catch (error) {
    return 'Incrível! ✨';
  }
};
