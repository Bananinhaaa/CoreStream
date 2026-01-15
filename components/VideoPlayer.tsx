
import React, { useState, useRef, useEffect } from 'react';
import { Video, UserProfile } from '../types';
import { HeartIcon, CommentIcon, RepostIcon, MusicIcon, VerifiedBadge, TrashIcon } from './Icons';
import CommentsDrawer from './CommentsDrawer';
import RepostDrawer from './RepostDrawer';
import { renderWithMentions } from '../utils/mentionHelper';
import { formatNumber } from '../utils/formatters';

interface VideoPlayerProps {
  video: Video;
  isActive: boolean;
  onLike: (id: string) => void;
  onFollow: (username: string) => void;
  onRepost: (id: string, caption?: string) => void;
  onAddComment: (vId: string, text: string, parentId?: string) => void;
  onNavigateToProfile: (username: string) => void;
  currentUser: UserProfile;
  isFollowing: boolean;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  isRepostedByMe: boolean;
  onDeleteComment?: (vId: string, cId: string) => void;
  onToggleComments?: (vId: string) => void;
  onDeleteVideo?: (vId: string) => void;
  onLikeComment?: (vId: string, cId: string) => void;
  allAccounts?: UserProfile[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  video, isActive, onLike, onFollow, onRepost, onAddComment, onNavigateToProfile, currentUser, isFollowing, isMuted, setIsMuted, isRepostedByMe,
  onDeleteComment, onDeleteVideo, onLikeComment, allAccounts = []
}) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isRepostOpen, setIsRepostOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => console.log("Auto-play blocked"));
    } else {
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'CoreStream Video',
        text: video.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  const handleConfirmRepost = (caption?: string) => {
    onRepost(video.id, caption);
    setIsRepostOpen(false);
  };

  const safeCommentsCount = (video.comments || []).length;

  return (
    <div className="relative w-full h-full bg-black group">
      <video 
        ref={videoRef} 
        src={video.url} 
        loop 
        muted={isMuted} 
        playsInline
        className="w-full h-full object-cover" 
        onClick={() => setIsMuted(!isMuted)}
      />

      <div className="absolute top-24 left-6 z-30 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xl">
          <svg className="w-3 h-3 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2.5" />
             <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2.5" />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-widest text-white drop-shadow-md">
            {formatNumber(video.views || 0)} <span className="opacity-40 ml-0.5">Views</span>
          </span>
        </div>
      </div>

      <div className="absolute bottom-8 left-6 right-20 z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-3 pointer-events-auto" onClick={(e) => { e.stopPropagation(); onNavigateToProfile(video.username); }}>
          <div className="w-11 h-11 rounded-full border-2 border-white/20 overflow-hidden shadow-lg text-black bg-white flex items-center justify-center font-black uppercase text-[10px]">
            {video.avatar ? <img src={video.avatar} className="w-full h-full object-cover" /> : video.username.charAt(0)}
          </div>
          <div>
            <p className="font-black text-sm flex items-center gap-1 text-white shadow-black drop-shadow-md">@{video.username} {video.isVerified && <VerifiedBadge size="14" />}</p>
            {!isFollowing && video.username !== currentUser.username && (
               <button onClick={(e) => { e.stopPropagation(); onFollow(video.username); }} className="text-white text-[10px] font-black uppercase tracking-widest mt-0.5 bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">Seguir</button>
            )}
          </div>
        </div>
        <div className="text-sm font-medium mb-4 line-clamp-3 leading-relaxed drop-shadow-md pointer-events-auto text-white">
          {renderWithMentions(video.description || '', onNavigateToProfile)}
        </div>
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full w-fit border border-white/10">
          <MusicIcon />
          <p className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[150px] text-white">{video.music || 'Original Audio'}</p>
        </div>
      </div>

      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-7 z-20">
        {(video.username === currentUser.username || currentUser.isAdmin) && (
           <button onClick={() => onDeleteVideo?.(video.id)} className="flex flex-col items-center group/btn opacity-40 hover:opacity-100 transition-opacity">
              <div className="p-2 bg-black/20 rounded-full backdrop-blur-md border border-white/10">
                <TrashIcon size="24" />
              </div>
              <span className="text-[7px] font-black mt-1 uppercase tracking-widest">Apagar</span>
           </button>
        )}

        <button onClick={() => onLike(video.id)} className="flex flex-col items-center group/btn">
          <div className="p-2 transition-transform group-active/btn:scale-125">
            <HeartIcon liked={video.isLiked} />
          </div>
          <span className="text-[10px] font-black mt-1 drop-shadow-lg text-white">{formatNumber(video.likes || 0)}</span>
        </button>
        
        <button onClick={() => setIsCommentsOpen(true)} className="flex flex-col items-center group/btn">
          <div className="p-2 transition-transform group-active/btn:scale-125">
            <CommentIcon />
          </div>
          <span className="text-[10px] font-black mt-1 drop-shadow-lg text-white">{formatNumber(safeCommentsCount)}</span>
        </button>

        <button onClick={() => setIsRepostOpen(true)} className="flex flex-col items-center group/btn">
          <div className="p-2 transition-transform group-active/btn:scale-125">
            <RepostIcon active={isRepostedByMe} />
          </div>
          <span className="text-[10px] font-black mt-1 drop-shadow-lg text-white">{formatNumber(video.reposts || 0)}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center group/btn opacity-80 active:scale-110 transition-transform">
          <div className="p-2">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <span className="text-[10px] font-black mt-1 drop-shadow-lg text-white uppercase tracking-tighter">Share</span>
        </button>
      </div>

      <CommentsDrawer 
        isOpen={isCommentsOpen} 
        onClose={() => setIsCommentsOpen(false)} 
        comments={video.comments || []} 
        onAddComment={(t, pId) => onAddComment(video.id, t, pId)} 
        videoOwner={video.username}
        currentUser={currentUser.username}
        onUserClick={onNavigateToProfile}
        onLikeComment={(cId) => onLikeComment?.(video.id, cId)}
        onDeleteComment={(cId) => onDeleteComment?.(video.id, cId)}
        allAccounts={allAccounts}
      />

      <RepostDrawer 
        isOpen={isRepostOpen}
        onClose={() => setIsRepostOpen(false)}
        video={video}
        currentUser={currentUser}
        onConfirm={handleConfirmRepost}
      />
    </div>
  );
};

export default VideoPlayer;
