
import { createClient } from '@supabase/supabase-js';
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const LOCAL_VIDEOS_KEY = 'CORE_VIDEOS_PERSISTENT_V2';
const LOCAL_PROFILES_KEY = 'CORE_PROFILES_PERSISTENT_V2';

export const databaseService = {
  // --- VÍDEOS ---
  async getVideos(): Promise<Video[]> {
    if (!supabase) {
      const saved = localStorage.getItem(LOCAL_VIDEOS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_VIDEOS;
    }
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((v: any) => ({
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
        }));
      }
      return INITIAL_VIDEOS;
    } catch (error) {
      console.error("Erro Supabase GetVideos:", error);
      const saved = localStorage.getItem(LOCAL_VIDEOS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_VIDEOS;
    }
  },

  async saveVideo(video: Video): Promise<void> {
    // Salva no LocalStorage como backup/primário
    const saved = localStorage.getItem(LOCAL_VIDEOS_KEY);
    const videos = saved ? JSON.parse(saved) : [];
    const updatedVideos = [video, ...videos.filter((v: Video) => v.id !== video.id)];
    localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(updatedVideos));

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
      console.error("Erro Supabase SaveVideo:", error);
    }
  },

  // --- PERFIS (ACCOUNTS) ---
  async getProfiles(): Promise<any[]> {
    if (!supabase) {
      const saved = localStorage.getItem(LOCAL_PROFILES_KEY);
      return saved ? JSON.parse(saved) : [];
    }
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      
      const profiles = data.map((p: any) => ({
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

      // Mantém o localstorage sincronizado com o que veio do banco
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
      return profiles;
    } catch (error) {
      console.error("Erro Supabase GetProfiles:", error);
      const saved = localStorage.getItem(LOCAL_PROFILES_KEY);
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveProfile(account: any): Promise<void> {
    // Salva no LocalStorage como backup/primário
    const saved = localStorage.getItem(LOCAL_PROFILES_KEY);
    const profiles = saved ? JSON.parse(saved) : [];
    const updatedProfiles = [...profiles.filter((p: any) => p.profile.username !== account.profile.username), account];
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(updatedProfiles));

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
      console.error("Erro Supabase SaveProfile:", error);
    }
  },

  async updateInteraction(type: 'like' | 'follow' | 'view', targetId: string, userId: string): Promise<void> {
    if (!supabase) return;
    try {
      if (type === 'view') {
        await supabase.rpc('increment_views', { video_id: targetId });
      } else if (type === 'like') {
        await supabase.rpc('increment_likes', { video_id: targetId });
      }
    } catch (error) {}
  }
};
