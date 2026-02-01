
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
const isConfigured = !!convexUrl && convexUrl !== 'undefined' && convexUrl.includes('.cloud');

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
    } catch (e) { return URL.createObjectURL(file); }
  },

  async updatePresence(username: string): Promise<void> {
    if (!isConfigured) return;
    fetch(`${convexUrl}/updatePresence`, {
      method: 'POST',
      body: JSON.stringify({ username, lastSeen: Date.now() })
    }).catch(() => {});
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
      const { value } = await response.json();
      return value || localData;
    } catch (e) { return localData; }
  },

  async saveVideo(video: Video): Promise<void> {
    // Sempre salva no local como backup imediato
    const current = JSON.parse(localStorage.getItem('CORE_VIDEOS') || '[]');
    const updated = [video, ...current.filter((v: any) => v.id !== video.id)];
    localStorage.setItem('CORE_VIDEOS', JSON.stringify(updated));

    if (isConfigured) {
      fetch(`${convexUrl}/saveVideo`, {
        method: 'POST',
        body: JSON.stringify(video)
      }).catch(console.error);
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
      const { value } = await response.json();
      return value || localData;
    } catch (e) { return localData; }
  },

  async saveProfile(account: any): Promise<void> {
    // Backup local imediato
    const current = JSON.parse(localStorage.getItem('CORE_PROFILES') || '[]');
    const updated = [account, ...current.filter((a: any) => a.profile.username !== account.profile.username)];
    localStorage.setItem('CORE_PROFILES', JSON.stringify(updated));

    if (isConfigured) {
      fetch(`${convexUrl}/saveProfile`, {
        method: 'POST',
        body: JSON.stringify(account)
      }).catch(console.error);
    }
  }
};
