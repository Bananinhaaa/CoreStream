
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
const isConfigured = !!convexUrl && convexUrl !== 'undefined' && convexUrl.includes('.cloud');

const PROFILES_STORAGE_KEY = 'CORE_PROFILES_V3';
const VIDEOS_STORAGE_KEY = 'CORE_VIDEOS_V3';

// Helper para IndexedDB (Guardar vídeos pesados localmente)
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CoreStreamOffline', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('videos');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveBlobLocally = async (id: string, blob: Blob) => {
  const db = await openDB();
  const tx = db.transaction('videos', 'readwrite');
  tx.objectStore('videos').put(blob, id);
  return new Promise((res) => tx.oncomplete = res);
};

const getBlobLocally = async (id: string): Promise<string | null> => {
  const db = await openDB();
  const tx = db.transaction('videos', 'readonly');
  const request = tx.objectStore('videos').get(id);
  return new Promise((res) => {
    request.onsuccess = () => {
      if (request.result instanceof Blob) res(URL.createObjectURL(request.result));
      else res(null);
    };
    request.onerror = () => res(null);
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
    const localJson = localStorage.getItem(VIDEOS_STORAGE_KEY);
    let videos: Video[] = localJson ? JSON.parse(localJson) : INITIAL_VIDEOS;

    // Recupera URLs de blobs salvos no IndexedDB para vídeos locais
    for (const v of videos) {
      if (v.url.startsWith('blob:') || !v.url.startsWith('http')) {
        const storedUrl = await getBlobLocally(v.id);
        if (storedUrl) v.url = storedUrl;
      }
    }

    if (!isConfigured) return videos;

    try {
      const response = await fetch(`${convexUrl}/listVideos`, { method: 'POST' });
      const data = await response.json();
      const remoteVideos = Array.isArray(data.value) ? data.value : [];
      
      const vMap = new Map();
      remoteVideos.forEach((v: Video) => vMap.set(v.id, v));
      videos.forEach((v: Video) => { if (!vMap.has(v.id)) vMap.set(v.id, v); });
      
      return Array.from(vMap.values());
    } catch (e) { return videos; }
  },

  async saveVideo(video: Video, file?: File | Blob): Promise<void> {
    // 1. Salva metadados localmente
    const current = JSON.parse(localStorage.getItem(VIDEOS_STORAGE_KEY) || '[]');
    const updated = [video, ...current.filter((v: any) => v.id !== video.id)];
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(updated));

    // 2. Se estiver offline e tiver arquivo, salva o binário no IndexedDB
    if (!isConfigured && file) {
      await saveBlobLocally(video.id, file);
    }

    // 3. Salva na Nuvem
    if (isConfigured) {
      try {
        await fetch(`${convexUrl}/saveVideo`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(video)
        });
      } catch (e) { console.error("Cloud Save Failed", e); }
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
      } catch (e) {}
    }
  },

  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    if (!isConfigured) return null;
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
    } catch (e) { return null; }
  }
};
