import { Video, UserProfile, Comment, Notification } from '../types';
import { INITIAL_VIDEOS } from '../constants';

export const databaseService = {
  // Busca todos os vídeos. Se não houver nada no localStorage, usa os iniciais.
  async getVideos(): Promise<Video[]> {
    try {
      const saved = localStorage.getItem('CORE_VIDEOS_FOLDER_V1');
      const localVideos = saved ? JSON.parse(saved) : [];
      
      // Mescla vídeos iniciais com os do usuário, removendo duplicatas por ID
      const allVideos = [...localVideos, ...INITIAL_VIDEOS];
      const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());
      
      return uniqueVideos.sort((a, b) => b.id.localeCompare(a.id));
    } catch (error) {
      console.error("Erro ao carregar vídeos:", error);
      return INITIAL_VIDEOS;
    }
  },

  async saveVideo(video: Video): Promise<void> {
    try {
      const saved = localStorage.getItem('CORE_VIDEOS_FOLDER_V1');
      const current = saved ? JSON.parse(saved) : [];
      const updatedVideos = [video, ...current];
      localStorage.setItem('CORE_VIDEOS_FOLDER_V1', JSON.stringify(updatedVideos));
      console.log("Vídeo salvo localmente com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar vídeo:", error);
    }
  },

  async updateInteraction(type: 'like' | 'follow', targetId: string, userId: string): Promise<void> {
    console.log(`Log Global: Usuário ${userId} -> ${type} em ${targetId}`);
    // No futuro, aqui você fará chamadas ao Supabase
  }
};
