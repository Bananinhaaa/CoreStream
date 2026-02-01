
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
const isConfigured = !!convexUrl && convexUrl !== 'undefined' && convexUrl.includes('.cloud');

const PROFILES_STORAGE_KEY = 'CORE_PROFILES_V3';
const VIDEOS_STORAGE_KEY = 'CORE_VIDEOS_V3';

// Gerenciador de Banco de Dados Local (Arquivos Binários)
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CoreStream_Vault', 2);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveVideoFile = async (id: string, file: Blob) => {
  try {
    const db = await openDB();
    const tx = db.transaction('videos', 'readwrite');
    await tx.objectStore('videos').put(file, id);
    return new Promise((res) => tx.oncomplete = res);
  } catch (e) { console.error("Falha ao gravar no Vault:", e); }
};

const getVideoFile = async (id: string): Promise<string | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction('videos', 'readonly');
    const store = tx.objectStore('videos');
    const request = store.get(id);
    return new Promise((res) => {
      request.onsuccess = () => {
        if (request.result instanceof Blob) {
          res(URL.createObjectURL(request.result));
        } else res(null);
      };
      request.onerror = () => res(null);
    });
  } catch (e) { return null; }
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
    const localJson = localStorage.getItem(VIDEOS_STORAGE_KEY);
    let videos: Video[] = localJson ? JSON.parse(localJson) : INITIAL_VIDEOS;

    const updatedVideos = await Promise.all(videos.map(async (v) => {
      if (v.url.startsWith('blob:') || !v.url.startsWith('http')) {
        const persistedUrl = await getVideoFile(v.id);
        if (persistedUrl) return { ...v, url: persistedUrl };
      }
      return v;
    }));

    if (!isConfigured) return updatedVideos;

    try {
      const response = await fetch(`${convexUrl}/listVideos`, { method: 'POST' });
      const data = await response.json();
      const remoteVideos = Array.isArray(data.value) ? data.value : [];
      
      const vMap = new Map();
      remoteVideos.forEach((v: Video) => vMap.set(v.id, v));
      updatedVideos.forEach((v: Video) => {
        if (!vMap.has(v.id)) vMap.set(v.id, v);
      });
      
      return Array.from(vMap.values());
    } catch (e) { return updatedVideos; }
  },

  async saveVideo(video: Video, file?: File | Blob): Promise<void> {
    if (file) await saveVideoFile(video.id, file);

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
      } catch (e) { console.error("Cloud Save Error", e); }
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
    if (!profile.username) return;

    // Garante que o email seja preservado para o sistema de busca
    const payload = {
      profile: { ...profile, lastSeen: Date.now() },
      email: account.email || profile.email || '',
      password: account.password || profile.password || '',
      followingMap: account.followingMap || profile.followingMap || {}
    };

    const current = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '[]');
    const updated = [payload, ...current.filter((a: any) => (a.profile?.username || a.username) !== profile.username)];
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));

    if (isConfigured) {
      try {
        await fetch(`${convexUrl}/saveProfile`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.error("Convex Profile Save Error", e);
      }
    }
  },

  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    if (!isConfigured) return null;
    try {
      const response = await fetch(`${convexUrl}/api/mutation/media/generateUploadUrl`, { method: "POST" });
      const { value: uploadUrl } = await response.json();
      await fetch(uploadUrl, { method: "POST", body: file });
      return null; 
    } catch (e) { return null; }
  }
};
