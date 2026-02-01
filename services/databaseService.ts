
import { ConvexHttpClient } from "convex/browser";
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
const isConfigured = !!convexUrl && convexUrl !== 'undefined' && convexUrl.startsWith('http');

const client = isConfigured ? new ConvexHttpClient(convexUrl) : null;

export const databaseService = {
  getConvexUrl(): string {
    return convexUrl;
  },

  isConnected(): boolean {
    return isConfigured && !!client;
  },

  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    if (!isConfigured) {
      console.warn("Convex não configurado. Usando URL temporária.");
      return URL.createObjectURL(file);
    }

    try {
      // 1. Gera URL de upload via mutação
      const uploadUrlResponse = await fetch(`${convexUrl}/api/mutation/media/generateUploadUrl`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: {} })
      });
      const uploadData = await uploadUrlResponse.json();
      const uploadUrl = uploadData.value;

      // 2. Faz o upload do binário diretamente para a URL gerada
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // 3. Obtém a URL pública do arquivo
      const getUrlResponse = await fetch(`${convexUrl}/api/query/media/getPublicUrl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: { storageId } })
      });
      const urlData = await getUrlResponse.json();
      return urlData.value;
    } catch (error) {
      console.error("Erro no Storage do Convex:", error);
      return null;
    }
  },

  async updatePresence(username: string): Promise<void> {
    if (!isConfigured) return;
    try {
      await fetch(`${convexUrl}/api/mutation/profiles/updatePresence`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: { username, lastSeen: Date.now() } })
      });
    } catch (e) {}
  },

  async getVideos(): Promise<Video[] | null> {
    if (!isConfigured) {
      const local = localStorage.getItem('CORE_VIDEOS');
      return local ? JSON.parse(local) : INITIAL_VIDEOS;
    }
    try {
      const response = await fetch(`${convexUrl}/api/query/videos/list`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: {} })
      });
      const data = await response.json();
      const videos = data.value || [];
      return videos.map((v: any) => ({
        ...v,
        id: v.id || v._id
      }));
    } catch (error) {
      return INITIAL_VIDEOS;
    }
  },

  async saveVideo(video: Video): Promise<void> {
    if (!isConfigured) {
      const current = await this.getVideos() || [];
      const updated = [video, ...current.filter(v => v.id !== video.id)];
      localStorage.setItem('CORE_VIDEOS', JSON.stringify(updated));
      return;
    }
    try {
      await fetch(`${convexUrl}/api/mutation/videos/save`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: video })
      });
    } catch (error) {}
  },

  async getProfiles(): Promise<any[] | null> {
    if (!isConfigured) {
      const local = localStorage.getItem('CORE_PROFILES');
      return local ? JSON.parse(local) : [];
    }
    try {
      const response = await fetch(`${convexUrl}/api/query/profiles/list`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: {} })
      });
      const data = await response.json();
      return data.value || [];
    } catch (error) {
      return [];
    }
  },

  async saveProfile(account: any): Promise<void> {
    if (!isConfigured) {
      const current = await this.getProfiles() || [];
      const updated = [account, ...current.filter(a => a.profile.username !== account.profile.username)];
      localStorage.setItem('CORE_PROFILES', JSON.stringify(updated));
      return;
    }
    try {
      await fetch(`${convexUrl}/api/mutation/profiles/save`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ args: account })
      });
    } catch (error) {}
  }
};
