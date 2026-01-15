
import { createClient } from '@supabase/supabase-js';
import { Video } from '../types';
import { INITIAL_VIDEOS } from '../constants';

// Estas variáveis devem ser configuradas na Vercel/GitHub como variáveis de ambiente
// Fix: Casting import.meta to any to resolve TypeScript error 'Property env does not exist on type ImportMeta'
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Inicializa o cliente apenas se as chaves existirem para evitar crash
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const databaseService = {
  /**
   * Busca vídeos do Supabase. 
   * Se o Supabase não estiver configurado, retorna o localStorage ou iniciais.
   */
  async getVideos(): Promise<Video[]> {
    if (!supabase) {
      console.warn("Supabase não configurado. Usando armazenamento local.");
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
        // Mapeia o formato do banco para o formato da interface Video do app
        return data.map((v: any) => ({
          id: v.id,
          url: v.url,
          username: v.owner_username,
          displayName: v.owner_display_name || v.owner_username,
          avatar: v.owner_avatar || '',
          description: v.description,
          likes: v.likes_count || 0,
          comments: v.comments_json || [], // Assumindo que guardamos comentários como JSONB
          reposts: v.reposts_count || 0,
          views: v.views_count || 0,
          isLiked: false, // Isso seria checado por usuário em uma tabela separada
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

  /**
   * Salva um novo vídeo no Supabase.
   */
  async saveVideo(video: Video): Promise<void> {
    if (!supabase) {
      const saved = localStorage.getItem('CORE_VIDEOS_FOLDER_V1');
      const current = saved ? JSON.parse(saved) : [];
      localStorage.setItem('CORE_VIDEOS_FOLDER_V1', JSON.stringify([video, ...current]));
      return;
    }

    try {
      const { error } = await supabase.from('videos').insert([{
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

      if (error) throw error;
    } catch (error) {
      console.error("Erro Supabase SaveVideo:", error);
    }
  },

  /**
   * Atualiza interações (likes, views) em tempo real.
   */
  async updateInteraction(type: 'like' | 'follow' | 'view', targetId: string, userId: string): Promise<void> {
    if (!supabase) return;

    try {
      if (type === 'view') {
        await supabase.rpc('increment_views', { video_id: targetId });
      } else if (type === 'like') {
        // Lógica de like (incrementar contador e salvar na tabela de junção)
        await supabase.from('likes').upsert({ user_id: userId, video_id: targetId });
        await supabase.rpc('increment_likes', { video_id: targetId });
      }
    } catch (error) {
      console.error(`Erro ao processar ${type}:`, error);
    }
  }
};
