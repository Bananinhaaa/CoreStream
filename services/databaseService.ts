
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
const isConfigured = !!convexUrl && convexUrl !== 'undefined' && convexUrl.includes('.cloud');

// Função auxiliar para converter Blob em Base64 para persistência local
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const databaseService = {
  getConvexUrl(): string {
    return convexUrl;
  },

  isConnected(): boolean {
    return isConfigured;
  },

  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    // Se não estiver configurado ou for um avatar pequeno, usamos Base64 para persistência real no LocalStorage
    if (!isConfigured) {
      if (bucket === 'avatars') {
        console.log("CORE: Convertendo avatar para Base64 (Persistência Local)");
        return await blobToBase64(file);
      }
      return URL.createObjectURL(file);
    }
    
    try {
      // 1. Gera URL de upload no Convex
      const response = await fetch(`${convexUrl}/api/mutation/media/generateUploadUrl`, { method: "POST" });
      if (!response.ok) throw new Error("Upload URL failed");
      const { value: uploadUrl } = await response.json();
      
      // 2. Upload binário para o Storage do Convex
      const result = await fetch(uploadUrl, { method: "POST", body: file });
      if (!result.ok) throw new Error("File upload failed");
      const { storageId } = await result.json();
      
      // 3. Obtém URL pública permanente
      const getUrlResponse = await fetch(`${convexUrl}/api/query/media/getPublicUrl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: { storageId } })
      });
      if (!getUrlResponse.ok) throw new Error("Public URL failed");
      const { value: url } = await getUrlResponse.json();
      
      return url;
    } catch (e) { 
      console.error("Cloud Upload Error:", e);
      // Se falhar o cloud, retorna Base64 como fallback para não perder a foto do usuário
      return await blobToBase64(file); 
    }
  },

  async updatePresence(username: string): Promise<void> {
    if (!isConfigured) return;
    const now = Date.now();
    fetch(`${convexUrl}/updatePresence`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, lastSeen: now })
    }).catch(() => {});
  },

  async getVideos(): Promise<Video[] | null> {
    const local = localStorage.getItem('CORE_VIDEOS');
    const localData = local ? JSON.parse(local) : INITIAL_VIDEOS;
    if (!isConfigured) return localData;
    try {
      const response = await fetch(`${convexUrl}/listVideos`, { method: 'POST' });
      const data = await response.json();
      return data.value || localData;
    } catch (e) { return localData; }
  },

  async saveVideo(video: Video): Promise<void> {
    if (isConfigured) {
      await fetch(`${convexUrl}/saveVideo`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(video)
      });
    }
    const current = JSON.parse(localStorage.getItem('CORE_VIDEOS') || '[]');
    const updated = [video, ...current.filter((v: any) => v.id !== video.id)];
    localStorage.setItem('CORE_VIDEOS', JSON.stringify(updated));
  },

  async getProfiles(): Promise<any[] | null> {
    const local = localStorage.getItem('CORE_PROFILES');
    const localData = local ? JSON.parse(local) : [];
    if (!isConfigured) return localData;
    try {
      const response = await fetch(`${convexUrl}/listProfiles`, { method: 'POST' });
      const data = await response.json();
      return data.value || localData;
    } catch (e) { return localData; }
  },

  async saveProfile(account: any): Promise<void> {
    if (isConfigured) {
      await fetch(`${convexUrl}/saveProfile`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account)
      });
    }
    const current = JSON.parse(localStorage.getItem('CORE_PROFILES') || '[]');
    const updated = [account, ...current.filter((a: any) => {
      const uname = a.profile ? a.profile.username : a.username;
      const targetName = account.profile ? account.profile.username : account.username;
      return uname !== targetName;
    })];
    localStorage.setItem('CORE_PROFILES', JSON.stringify(updated));
  }
};
