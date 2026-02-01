
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
const isConfigured = !!convexUrl && convexUrl !== 'undefined' && convexUrl.includes('.cloud');
const PROFILES_STORAGE_KEY = 'CORE_PROFILES_V2';

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
    if (!isConfigured) {
      if (bucket === 'avatars') return await blobToBase64(file);
      return URL.createObjectURL(file);
    }
    
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
      console.warn("CORE: Upload Fallback:", e);
      return bucket === 'avatars' ? await blobToBase64(file) : URL.createObjectURL(file); 
    }
  },

  async updatePresence(username: string): Promise<void> {
    if (!isConfigured) return;
    fetch(`${convexUrl}/updatePresence`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, lastSeen: Date.now() })
    }).catch(() => {});
  },

  async getVideos(): Promise<Video[] | null> {
    const local = localStorage.getItem('CORE_VIDEOS');
    const localData = local ? JSON.parse(local) : INITIAL_VIDEOS;
    if (!isConfigured) return localData;
    try {
      const response = await fetch(`${convexUrl}/listVideos`, { method: 'POST' });
      const data = await response.json();
      return Array.isArray(data.value) ? data.value : localData;
    } catch (e) { return localData; }
  },

  async saveVideo(video: Video): Promise<void> {
    if (isConfigured) {
      try {
        await fetch(`${convexUrl}/saveVideo`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(video)
        });
      } catch (e) { console.error("CORE: Erro ao salvar vídeo nuvem:", e); }
    }
    const current = JSON.parse(localStorage.getItem('CORE_VIDEOS') || '[]');
    const updated = [video, ...current.filter((v: any) => v.id !== video.id)];
    localStorage.setItem('CORE_VIDEOS', JSON.stringify(updated));
  },

  async getProfiles(): Promise<any[] | null> {
    const local = localStorage.getItem(PROFILES_STORAGE_KEY);
    const localData = local ? JSON.parse(local) : [];
    if (!isConfigured) return localData;
    try {
      const response = await fetch(`${convexUrl}/listProfiles`, { method: 'POST' });
      const data = await response.json();
      return Array.isArray(data.value) ? data.value : localData;
    } catch (e) { return localData; }
  },

  async saveProfile(account: any): Promise<void> {
    if (isConfigured) {
      try {
        // Normalizamos para o backend (campos achatados)
        const payload = {
          profile: account.profile,
          username: account.profile.username,
          displayName: account.profile.displayName,
          bio: account.profile.bio,
          avatar: account.profile.avatar,
          email: account.email,
          password: account.password || '',
          followingMap: account.followingMap || {},
          isVerified: !!account.profile.isVerified,
          isAdmin: !!account.profile.isAdmin,
          followers: account.profile.followers || 0,
          following: account.profile.following || 0,
          likes: account.profile.likes || 0
        };
        
        await fetch(`${convexUrl}/saveProfile`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (e) { console.error("CORE: Erro ao salvar perfil nuvem:", e); }
    }
    
    // Cache Local (Formato completo AccountData)
    const current = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '[]');
    const updated = [account, ...current.filter((a: any) => {
      const u1 = a.profile?.username || a.username;
      const u2 = account.profile?.username || account.username;
      return u1 !== u2;
    })];
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));
  }
};
