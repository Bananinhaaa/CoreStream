
export interface Comment {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  text: string;
  timestamp: number;
  likes: number;
  isLikedByMe?: boolean;
  isVerified?: boolean;
  replies?: Comment[];
}

export interface Video {
  id: string;
  url: string;
  username: string;
  displayName: string;
  avatar: string;
  description: string;
  likes: number;
  comments: Comment[];
  reposts: number;
  views: number;
  isLiked: boolean;
  isFollowing: boolean;
  music: string;
  isVerified?: boolean;
  commentsDisabled?: boolean;
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'repost' | 'mention' | 'reply' | 'security';
  fromUser: string;
  fromAvatar: string;
  timestamp: number;
  text: string;
  videoId?: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner?: string;
  phone?: string;
  email: string;
  followers: number;
  following: number;
  likes: number;
  isVerified?: boolean;
  isAdmin?: boolean;
  isBanned?: boolean;
  banReason?: string;
  profileColor?: string;
  twoFactorEnabled?: boolean;
  repostedVideoIds: string[];
  notifications: Notification[];
  lastUsernameChange?: number; // Timestamp da última troca de username
  lastDisplayNameChange?: number; // Timestamp da última troca de nome
}
