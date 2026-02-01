
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
const isConfigured = !!convexUrl && convexUrl !== 'undefined' && convexUrl.includes('.cloud');
const PROFILES_STORAGE_KEY = 'CORE_PROFILES_V3';
const VIDEOS_STORAGE_KEY = 'CORE_VIDEOS';

const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const databaseService = {
  getConvexUrl(): string { return convexUrl; },
  isConnected(): boolean { return isConfigured; },

  async updatePresence(username: string): Promise<void> {
    if (!isConfigured) return;
    try {
      await fetch(`${convexUrl}/updatePresence`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, lastSeen: Date.now() })
      });
    } catch (e) {}
  },

  async getVideos(): Promise<Video[] | null> {
    const local = JSON.parse(localStorage.getItem(VIDEOS_STORAGE_KEY) || '[]');
    if (!isConfigured) return local.length ? local : INITIAL_VIDEOS;
    try {
      const response = await fetch(`${convexUrl}/listVideos`, { method: 'POST' });
      const data = await response.json();
      return Array.isArray(data.value) ? data.value : local;
    } catch (e) { return local; }
  },

  async saveVideo(video: Video): Promise<void> {
    // Persistência local primeiro (mesmo que temporária para a URL do vídeo)
    const current = JSON.parse(localStorage.getItem(VIDEOS_STORAGE_KEY) || '[]');
    const updated = [video, ...current.filter((v: any) => v.id !== video.id)];
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(updated));

    if (isConfigured) {
      try {
        await fetch(`${convexUrl}/saveVideo`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(video)
        });
      } catch (e) { 
        console.error("Erro ao salvar vídeo na nuvem:", e);
        throw e; // Lança para que o Create saiba que falhou o sync
      }
    } else {
      console.warn("CORE: Cloud não configurada. Vídeos salvos localmente desaparecerão ao recarregar se forem URLs blob.");
    }
  },

  async deleteVideo(id: string): Promise<void> {
    const current = JSON.parse(localStorage.getItem(VIDEOS_STORAGE_KEY) || '[]');
    const updated = current.filter((v: any) => v.id !== id);
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(updated));

    if (isConfigured) {
      try {
        await fetch(`${convexUrl}/deleteVideo`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
      } catch (e) { console.error("Cloud Error (Delete Video):", e); }
    }
  },

  async getProfiles(): Promise<any[] | null> {
    const local = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '[]');
    if (!isConfigured) return local;
    try {
      const response = await fetch(`${convexUrl}/listProfiles`, { method: 'POST' });
      const data = await response.json();
      return Array.isArray(data.value) ? data.value : local;
    } catch (e) { return local; }
  },

  async saveProfile(account: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '[]');
    const username = account.profile?.username || account.username;
    
    // Formatação robusta para garantir que o profile tenha os campos necessários
    const profile = account.profile || account;
    const email = account.email || profile.email;
    const password = account.password || '';

    const payload = {
      profile: profile,
      email: email,
      password: password,
      followingMap: account.followingMap || profile.followingMap || {}
    };

    const updated = [payload, ...current.filter((a: any) => (a.profile?.username || a.username) !== username)];
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));

    if (isConfigured) {
      try {
        await fetch(`${convexUrl}/saveProfile`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (e) { console.error("Cloud Error (Profile):", e); }
    }
  },

  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    // Em modo offline, avatars são convertidos para Base64 para persistirem no LocalStorage
    if (bucket === 'avatars' && !isConfigured) {
      return await fileToBase64(file);
    }
    
    // Vídeos são grandes demais para LocalStorage. Sem cloud, usamos Blob URL temporário.
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
      return bucket === 'avatars' ? await fileToBase64(file) : URL.createObjectURL(file); 
    }
  }
};
