
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
      // Retorna os vídeos da nuvem, mas se estiver vazio e tivermos locais, mantemos os locais
      return Array.isArray(data.value) && data.value.length > 0 ? data.value : local;
    } catch (e) { return local; }
  },

  async saveVideo(video: Video): Promise<void> {
    // 1. Salva localmente para feedback instantâneo
    const current = JSON.parse(localStorage.getItem(VIDEOS_STORAGE_KEY) || '[]');
    const updated = [video, ...current.filter((v: any) => v.id !== video.id)];
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(updated));

    // 2. Tenta subir para a nuvem
    if (isConfigured) {
      try {
        const response = await fetch(`${convexUrl}/saveVideo`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(video)
        });
        if (!response.ok) throw new Error("Falha no upload para o Convex");
      } catch (e) { 
        console.error("CORE Cloud Error:", e);
        throw e;
      }
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
      } catch (e) {}
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
    const profile = account.profile || account;
    const email = account.email || profile.email;
    const password = account.password || '';

    const payload = {
      profile: {
        ...profile,
        lastSeen: Date.now()
      },
      email,
      password,
      followingMap: account.followingMap || profile.followingMap || {}
    };

    // Salva local
    const current = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '[]');
    const updated = [payload, ...current.filter((a: any) => (a.profile?.username || a.username) !== profile.username)];
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));

    // Sincroniza Nuvem
    if (isConfigured) {
      try {
        await fetch(`${convexUrl}/saveProfile`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (e) {}
    }
  },

  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    if (bucket === 'avatars' && !isConfigured) {
      return await fileToBase64(file);
    }
    
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
