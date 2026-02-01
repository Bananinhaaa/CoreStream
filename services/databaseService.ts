
import { ConvexHttpClient } from "convex/browser";
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
const isConfigured = !!convexUrl && convexUrl !== 'undefined';

// Cliente oficial do Convex
const client = isConfigured ? new ConvexHttpClient(convexUrl) : null;

export const databaseService = {
  isConnected(): boolean {
    return !!client;
  },

  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    if (!client || !isConfigured) return URL.createObjectURL(file);

    try {
      // 1. Pede ao Convex uma URL temporária de upload
      const uploadUrlResponse = await fetch(`${convexUrl}/api/mutation/media/generateUploadUrl`, { method: "POST" });
      const { uploadUrl } = await uploadUrlResponse.json();

      // 2. Faz o upload do binário diretamente
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // 3. Pede a URL pública permanente
      const getUrlResponse = await fetch(`${convexUrl}/api/query/media/getPublicUrl`, {
        method: "POST",
        body: JSON.stringify({ storageId })
      });
      const { url } = await getUrlResponse.json();
      return url;
    } catch (error) {
      console.error("Erro no Storage do Convex:", error);
      return null;
    }
  },

  async updatePresence(username: string): Promise<void> {
    if (!client) return;
    try {
      await fetch(`${convexUrl}/api/mutation/profiles/updatePresence`, {
        method: 'POST',
        body: JSON.stringify({ username, lastSeen: Date.now() })
      });
    } catch (e) {}
  },

  async getVideos(): Promise<Video[] | null> {
    if (!client) {
      const local = localStorage.getItem('CORE_VIDEOS');
      return local ? JSON.parse(local) : INITIAL_VIDEOS;
    }
    try {
      const response = await fetch(`${convexUrl}/api/query/videos/list`);
      const videos = await response.json();
      return videos.map((v: any) => ({
        ...v,
        id: v._id || v.id
      }));
    } catch (error) {
      return INITIAL_VIDEOS;
    }
  },

  async saveVideo(video: Video): Promise<void> {
    if (!client) {
      const current = await this.getVideos() || [];
      const updated = [video, ...current.filter(v => v.id !== video.id)];
      localStorage.setItem('CORE_VIDEOS', JSON.stringify(updated));
      return;
    }
    try {
      await fetch(`${convexUrl}/api/mutation/videos/save`, {
        method: 'POST',
        body: JSON.stringify(video)
      });
    } catch (error) {}
  },

  async getProfiles(): Promise<any[] | null> {
    if (!client) {
      const local = localStorage.getItem('CORE_PROFILES');
      return local ? JSON.parse(local) : [];
    }
    try {
      const response = await fetch(`${convexUrl}/api/query/profiles/list`);
      return await response.json();
    } catch (error) {
      return [];
    }
  },

  async saveProfile(account: any): Promise<void> {
    if (!client) {
      const current = await this.getProfiles() || [];
      const updated = [account, ...current.filter(a => a.profile.username !== account.profile.username)];
      localStorage.setItem('CORE_PROFILES', JSON.stringify(updated));
      return;
    }
    try {
      await fetch(`${convexUrl}/api/mutation/profiles/save`, {
        method: 'POST',
        body: JSON.stringify(account)
      });
    } catch (error) {}
  }
};
