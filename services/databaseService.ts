
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

// Em uma aplicação real com Convex, usaríamos os Hooks. 
// Para este ambiente, simulamos a integração via API/Client para manter a estrutura do app.
const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';

// Status de configuração
const isConfigured = !!convexUrl && convexUrl !== 'undefined';

if (!isConfigured) {
  console.warn("CoreStream: Convex não configurado. Verifique VITE_CONVEX_URL. Usando modo LocalStorage.");
}

export const databaseService = {
  isConnected(): boolean {
    return isConfigured;
  },

  /**
   * No Convex, o upload funciona em dois passos:
   * 1. Gera uma URL de upload
   * 2. Faz o POST do arquivo para essa URL
   */
  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    if (!isConfigured) return URL.createObjectURL(file);

    try {
      // 1. Chamar a função do Convex para gerar a URL (Exemplo de nome de função: 'media:generateUploadUrl')
      // Como estamos no frontend, simulamos a chamada que você faria ao seu backend Convex
      const uploadUrlResponse = await fetch(`${convexUrl}/api/generateUploadUrl`, { method: 'POST' });
      const { uploadUrl } = await uploadUrlResponse.json();

      // 2. Enviar o arquivo
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // 3. Retornar a URL pública (No Convex, você gera uma URL persistente para o storageId)
      const getUrlResponse = await fetch(`${convexUrl}/api/getPublicUrl`, {
        method: 'POST',
        body: JSON.stringify({ storageId })
      });
      const { url } = await getUrlResponse.json();
      return url;
    } catch (error) {
      console.error("Erro upload Convex:", error);
      return null;
    }
  },

  async updatePresence(username: string): Promise<void> {
    if (!isConfigured) return;
    // No Convex, isso seria uma Mutation: mutation(api.users.updatePresence, { username })
    fetch(`${convexUrl}/api/mutation/users/updatePresence`, {
      method: 'POST',
      body: JSON.stringify({ username, lastSeen: Date.now() })
    }).catch(() => {});
  },

  async getVideos(): Promise<Video[] | null> {
    if (!isConfigured) {
      const local = localStorage.getItem('CORE_VIDEOS');
      return local ? JSON.parse(local) : INITIAL_VIDEOS;
    }
    try {
      const response = await fetch(`${convexUrl}/api/query/videos/list`);
      const data = await response.json();
      return data.map(this.mapVideo);
    } catch (error) {
      return INITIAL_VIDEOS;
    }
  },

  mapVideo(v: any): Video {
    return {
      id: v._id || v.id,
      url: v.url,
      username: v.username,
      displayName: v.displayName || v.username,
      avatar: v.avatar || '',
      description: v.description,
      likes: v.likes || 0,
      comments: v.comments || [],
      reposts: v.reposts || 0,
      views: v.views || 0,
      isLiked: false,
      isFollowing: false,
      music: v.music || 'Original Audio',
      isVerified: v.isVerified || false
    };
  },

  async saveVideo(video: Video): Promise<void> {
    if (!isConfigured) {
      const current = await this.getVideos() || [];
      const updated = [video, ...current.filter(v => v.id !== video.id)];
      localStorage.setItem('CORE_VIDEOS', JSON.stringify(updated));
      return;
    }
    fetch(`${convexUrl}/api/mutation/videos/save`, {
      method: 'POST',
      body: JSON.stringify(video)
    });
  },

  async getProfiles(): Promise<any[] | null> {
    if (!isConfigured) {
      const local = localStorage.getItem('CORE_PROFILES');
      return local ? JSON.parse(local) : [];
    }
    try {
      const response = await fetch(`${convexUrl}/api/query/profiles/list`);
      const data = await response.json();
      return data;
    } catch (error) {
      return [];
    }
  },

  async saveProfile(account: any): Promise<void> {
    if (!isConfigured) {
      const current = await this.getProfiles() || [];
      const updated = [account, ...current.filter(a => a.profile.username !== account.profile.username)];
      localStorage.setItem('CORE_PROFILES', JSON.stringify(updated));
      return;
    }
    fetch(`${convexUrl}/api/mutation/profiles/save`, {
      method: 'POST',
      body: JSON.stringify(account)
    });
  }
};
