
import { createClient } from '@supabase/supabase-js';
import { Video, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const databaseService = {
  // --- VÍDEOS ---
  async getVideos(): Promise<Video[]> {
    if (!supabase) {
      const saved = localStorage.getItem('CORE_VIDEOS_FOLDER_V1');
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
      return INITIAL_VIDEOS;
    }
  },

  async saveVideo(video: Video): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('videos').insert([{
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
      }]);
    } catch (error) {
      console.error("Erro Supabase SaveVideo:", error);
    }
  },

  // --- PERFIS (ACCOUNTS) ---
  async getProfiles(): Promise<any[]> {
    if (!supabase) {
      const saved = localStorage.getItem('CORE_ACCOUNTS_FOLDER_V1');
      return saved ? JSON.parse(saved) : [];
    }
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data.map((p: any) => ({
        email: p.email,
        password: p.password, // Nota: Em produção, use Supabase Auth em vez de salvar senhas aqui
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
          repostedVideoIds: p.reposted_ids || [],
          notifications: p.notifications_json || []
        }
      }));
    } catch (error) {
      console.error("Erro Supabase GetProfiles:", error);
      return [];
    }
  },

  async saveProfile(account: any): Promise<void> {
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
