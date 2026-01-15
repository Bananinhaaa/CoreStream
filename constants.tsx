import { Video } from './types';

// Vídeos de demonstração para garantir que o app funcione imediatamente
export const INITIAL_VIDEOS: Video[] = [
  {
    id: 'demo-1',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lighting-in-the-rain-31242-large.mp4',
    username: 'cyberpunk',
    displayName: 'Neo City',
    avatar: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&h=100&fit=crop',
    description: 'A chuva em Neo City nunca para. #cyberpunk #neon #vibes',
    likes: 12400,
    comments: [
      {
        id: 'c1',
        username: 'coder_king',
        displayName: 'Dev Master',
        avatar: '',
        text: 'Essa iluminação está insana! 🔥',
        timestamp: Date.now() - 100000,
        likes: 45
      }
    ],
    reposts: 850,
    views: 45000,
    isLiked: false,
    isFollowing: false,
    music: 'Lofi Cyber - Night Drive',
    isVerified: true
  },
  {
    id: 'demo-2',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
    username: 'nature_vibe',
    displayName: 'Natureza Viva',
    avatar: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop',
    description: 'Paz é encontrar o silêncio no barulho da água. 🌿✨',
    likes: 8900,
    comments: [],
    reposts: 120,
    views: 32000,
    isLiked: false,
    isFollowing: false,
    music: 'Nature Sounds - Relaxing Stream',
    isVerified: false
  }
];
