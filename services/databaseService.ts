
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

// Detecta a URL do Convex. Se não houver, o app opera em modo local.
const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
const isConfigured = !!convexUrl && convexUrl !== 'undefined' && convexUrl.includes('.cloud');

const PROFILES_STORAGE_KEY = 'CORE_PROFILES_V3';
const VIDEOS_STORAGE_KEY = 'CORE_VIDEOS_V3';

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
      const remoteVideos = Array.isArray(data.value) ? data.value : [];
      
      // Mescla vídeos locais (temporários) com remotos (permanentes)
      const vMap = new Map();
      remoteVideos.forEach((v: Video) => vMap.set(v.id, v));
      local.forEach((v: Video) => {
        if (!vMap.has(v.id)) vMap.set(v.id, v);
      });
      
      return Array.from(vMap.values());
    } catch (e) { return local; }
  },

  async saveVideo(video: Video): Promise<void> {
    // 1. Salva no cache local (perderá a mídia no refresh se for blob:)
    const current = JSON.parse(localStorage.getItem(VIDEOS_STORAGE_KEY) || '[]');
    const updated = [video, ...current.filter((v: any) => v.id !== video.id)];
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(updated));

    // 2. Salva na Nuvem (Isso é o que garante que o vídeo NÃO suma)
    if (isConfigured) {
      try {
        await fetch(`${convexUrl}/saveVideo`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(video)
        });
      } catch (e) {
        console.error("ERRO CRÍTICO NA NUVEM: O vídeo não pôde ser persistido no servidor.", e);
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
    const username = profile.username;
    if (!username) return;

    // Normalização agressiva para garantir que nada se perca
    const cleanAccount = {
      profile: {
        ...profile,
        lastSeen: profile.lastSeen || Date.now()
      },
      email: account.email || profile.email || '',
      password: account.password || profile.password || '',
      followingMap: account.followingMap || profile.followingMap || {}
    };

    // 1. Persistência Local (Garante que você veja sua conta ao reabrir a aba)
    const current = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '[]');
    const filtered = current.filter((a: any) => (a.profile?.username || a.username) !== username);
    const updated = [cleanAccount, ...filtered];
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));

    // 2. Sincronização Cloud (Garante que OUTRAS pessoas te vejam)
    if (isConfigured) {
      try {
        await fetch(`${convexUrl}/saveProfile`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanAccount)
        });
      } catch (e) {
        console.error("FALHA DE SINCRONIZAÇÃO: Seu perfil ficou apenas local por enquanto.");
      }
    }
  },

  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    // Se for avatar e estivermos sem nuvem, usamos Base64 (permanente no LocalStorage)
    if (bucket === 'avatars' && !isConfigured) {
      return await fileToBase64(file);
    }

    // Vídeos são grandes demais. Sem nuvem, usamos Blob temporário (perderá no refresh).
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
