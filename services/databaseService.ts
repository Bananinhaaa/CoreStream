
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
const isConfigured = !!convexUrl && convexUrl !== 'undefined' && convexUrl.includes('.cloud');

if (!isConfigured) {
  console.warn("CORE: Backend Convex não detectado. Usando armazenamento local temporário. Vídeos e imagens sumirão ao reiniciar o site.");
} else {
  console.log("CORE: Conectado ao Cloud em " + convexUrl);
}

export const databaseService = {
  getConvexUrl(): string {
    return convexUrl;
  },

  isConnected(): boolean {
    return isConfigured;
  },

  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    if (!isConfigured) return URL.createObjectURL(file);
    try {
      const response = await fetch(`${convexUrl}/api/mutation/media/generateUploadUrl`, { method: "POST" });
      const { value: uploadUrl } = await response.json();
      const result = await fetch(uploadUrl, { method: "POST", body: file });
      const { storageId } = await result.json();
      const getUrlResponse = await fetch(`${convexUrl}/api/query/media/getPublicUrl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: { storageId } })
      });
      const { value: url } = await getUrlResponse.json();
      return url;
    } catch (e) { 
      console.error("Erro no upload para Cloud:", e);
      return URL.createObjectURL(file); 
    }
  },

  async updatePresence(username: string): Promise<void> {
    if (!isConfigured) return;
    const now = Date.now();
    fetch(`${convexUrl}/updatePresence`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, lastSeen: now })
    }).catch((err) => console.warn("Erro ao atualizar presença:", err));
    
    // Backup local do status online para feedback imediato
    const localProfiles = JSON.parse(localStorage.getItem('CORE_PROFILES') || '[]');
    const updated = localProfiles.map((p: any) => {
      const uname = p.profile ? p.profile.username : p.username;
      if (uname === username) {
        if (p.profile) p.profile.lastSeen = now;
        else p.lastSeen = now;
      }
      return p;
    });
    localStorage.setItem('CORE_PROFILES', JSON.stringify(updated));
  },

  async getVideos(): Promise<Video[] | null> {
    const local = localStorage.getItem('CORE_VIDEOS');
    const localData = local ? JSON.parse(local) : INITIAL_VIDEOS;
    
    if (!isConfigured) return localData;
    
    try {
      const response = await fetch(`${convexUrl}/api/query/videos/list`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: {} })
      });
      const data = await response.json();
      return data.value || localData;
    } catch (e) { 
      console.error("Erro ao buscar vídeos da nuvem:", e);
      return localData; 
    }
  },

  async saveVideo(video: Video): Promise<void> {
    // Sempre salva no local como backup imediato
    const current = JSON.parse(localStorage.getItem('CORE_VIDEOS') || '[]');
    const updated = [video, ...current.filter((v: any) => v.id !== video.id)];
    localStorage.setItem('CORE_VIDEOS', JSON.stringify(updated));

    if (isConfigured) {
      fetch(`${convexUrl}/saveVideo`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(video)
      }).catch(err => console.error("Falha ao salvar vídeo na nuvem:", err));
    }
  },

  async getProfiles(): Promise<any[] | null> {
    const local = localStorage.getItem('CORE_PROFILES');
    const localData = local ? JSON.parse(local) : [];

    if (!isConfigured) return localData;

    try {
      const response = await fetch(`${convexUrl}/api/query/profiles/list`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: {} })
      });
      const data = await response.json();
      return data.value || localData;
    } catch (e) { 
      console.error("Erro ao buscar perfis da nuvem:", e);
      return localData; 
    }
  },

  async saveProfile(account: any): Promise<void> {
    // Backup local imediato
    const current = JSON.parse(localStorage.getItem('CORE_PROFILES') || '[]');
    const updated = [account, ...current.filter((a: any) => {
      const uname = a.profile ? a.profile.username : a.username;
      const targetName = account.profile ? account.profile.username : account.username;
      return uname !== targetName;
    })];
    localStorage.setItem('CORE_PROFILES', JSON.stringify(updated));

    if (isConfigured) {
      fetch(`${convexUrl}/saveProfile`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account)
      }).catch(err => console.error("Falha ao salvar perfil na nuvem:", err));
    }
  }
};
