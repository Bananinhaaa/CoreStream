
import { createClient } from '@supabase/supabase-js';
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined') 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const LOCAL_VIDEOS_KEY = 'CORE_STORAGE_VIDEOS_V3';
const LOCAL_PROFILES_KEY = 'CORE_STORAGE_PROFILES_V3';

export const databaseService = {
  // --- STORAGE (UPLOAD DE ARQUIVOS) ---
  async uploadFile(bucket: 'videos' | 'avatars', file: File | Blob, path: string): Promise<string | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type
      });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicUrl;
    } catch (error) {
      console.error(`Erro no upload para ${bucket}:`, error);
      return null;
    }
  },

  // --- VÍDEOS ---
  async getVideos(): Promise<Video[]> {
    let localVideos: Video[] = [];
    try {
      const saved = localStorage.getItem(LOCAL_VIDEOS_KEY);
      localVideos = saved ? JSON.parse(saved) : [];
    } catch (e) {}

    if (!supabase) return localVideos.length > 0 ? localVideos : INITIAL_VIDEOS;

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      const remoteVideos = data && data.length > 0 ? data.map(this.mapVideo) : INITIAL_VIDEOS;
      localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(remoteVideos));
      return remoteVideos;
    } catch (error) {
      return localVideos.length > 0 ? localVideos : INITIAL_VIDEOS;
    }
  },

  mapVideo(v: any): Video {
    return {
      id: v.id,
      url: v.url,
      username: v.owner_username,
      displayName: v.owner_display_name || v.owner_username,
      avatar: v.owner_avatar || '',
      description: v.description,
      likes: v.likes_count || 0,
      comments: v.comments_json || [],
      reposts: v.reposts_count || 0,
      views: v.views_count || 0,
      isLiked: false,
      isFollowing: false,
      music: v.music_name || 'Original Audio',
      isVerified: v.owner_is_verified || false
    };
  },

  async saveVideo(video: Video): Promise<void> {
    try {
      const saved = localStorage.getItem(LOCAL_VIDEOS_KEY);
      const videos = saved ? JSON.parse(saved) : [];
      const updatedVideos = [video, ...videos.filter((v: Video) => v.id !== video.id)];
      localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(updatedVideos));
    } catch (e) {}

    if (!supabase) return;
    try {
      await supabase.from('videos').upsert([{
        id: video.id,
        url: video.url,
        owner_username: video.username,
        owner_display_name: video.displayName,
        owner_avatar: video.avatar,
        description: video.description,
        likes_count: video.likes,
        reposts_count: video.reposts,
        views_count: video.views,
        music_name: video.music,
        owner_is_verified: video.isVerified,
        comments_json: video.comments
      }], { onConflict: 'id' });
    } catch (error) {
      console.error("Erro ao salvar vídeo:", error);
    }
  },

  // --- PERFIS ---
  async getProfiles(): Promise<any[]> {
    let profilesLocal: any[] = [];
    try {
      const localData = localStorage.getItem(LOCAL_PROFILES_KEY);
      profilesLocal = localData ? JSON.parse(localData) : [];
    } catch (e) {}

    if (!supabase) return profilesLocal;

    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      
      const profilesApi = data.map((p: any) => ({
        email: p.email,
        password: p.password,
        followingMap: p.following_map || {},
        profile: {
          username: p.username,
          displayName: p.display_name,
          bio: p.bio,
          avatar: p.avatar_url,
          email: p.email,
          followers: p.followers_count || 0,
          following: p.following_count || 0,
          likes: p.likes_total || 0,
          isVerified: p.is_verified,
          isAdmin: p.is_admin,
          isBanned: p.is_banned,
          profileColor: p.profile_color,
          repostedVideoIds: p.reposted_ids || [],
          notifications: p.notifications_json || []
        }
      }));

      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profilesApi));
      return profilesApi;
    } catch (error) {
      return profilesLocal;
    }
  },

  async saveProfile(account: any): Promise<void> {
    try {
      const saved = localStorage.getItem(LOCAL_PROFILES_KEY);
      const profiles = saved ? JSON.parse(saved) : [];
      const updatedProfiles = [...profiles.filter((p: any) => p.profile.username !== account.profile.username), account];
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(updatedProfiles));
    } catch (e) {}

    if (!supabase) return;
    try {
      const p = account.profile;
      await supabase.from('profiles').upsert({
        username: p.username,
        display_name: p.displayName,
        email: p.email,
        password: account.password,
        bio: p.bio,
        avatar_url: p.avatar,
        followers_count: p.followers,
        following_count: p.following,
        likes_total: p.likes,
        is_verified: p.isVerified,
        is_admin: p.isAdmin,
        is_banned: p.isBanned,
        profile_color: p.profileColor,
        following_map: account.followingMap,
        reposted_ids: p.repostedVideoIds,
        notifications_json: p.notifications
      }, { onConflict: 'username' });
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    }
  }
};
