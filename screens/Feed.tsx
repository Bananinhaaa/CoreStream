
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Video, UserProfile } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import { databaseService } from '../services/databaseService';

interface FeedProps {
  videos: Video[];
  onNavigateToProfile: (username: string) => void;
  currentUser: UserProfile;
  onAddComment: (videoId: string, text: string, replyTo?: string) => void;
  onDeleteComment: (videoId: string, commentId: string) => void;
  onToggleComments: (videoId: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onFollow: (username: string) => void;
  onRepost: (id: string) => void;
  onLike: (id: string) => void;
  followingMap: Record<string, boolean>;
  onSearchClick: () => void;
  onLikeComment: (vId: string, cId: string) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  initialVideoId?: string | null;
  onClearJump?: () => void;
  allAccounts?: UserProfile[];
  onIncrementView?: (videoId: string) => void;
}

const Feed: React.FC<FeedProps> = ({ 
  videos, onNavigateToProfile, currentUser, onAddComment, onDeleteComment,
  onToggleComments, onDeleteVideo, onFollow, onRepost, onLike,
  followingMap, onSearchClick, onLikeComment, isMuted, setIsMuted,
  initialVideoId, onClearJump, allAccounts = [], onIncrementView
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedTab, setFeedTab] = useState<'foryou' | 'following'>('foryou');
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedVideos = useRef<Set<string>>(new Set());
  const isConnected = databaseService.isConnected();

  const displayVideos = useMemo(() => {
    if (feedTab === 'foryou') return videos;
    return videos.filter(v => followingMap[v.username]);
  }, [videos, feedTab, followingMap]);

  useEffect(() => {
    const currentVideo = displayVideos[activeIndex];
    if (currentVideo && onIncrementView && !viewedVideos.current.has(currentVideo.id)) {
      onIncrementView(currentVideo.id);
      viewedVideos.current.add(currentVideo.id);
    }
  }, [activeIndex, displayVideos, onIncrementView]);

  useEffect(() => {
    if (initialVideoId && containerRef.current) {
      const idx = displayVideos.findIndex(v => v.id === initialVideoId);
      if (idx !== -1) {
        setActiveIndex(idx);
        const height = containerRef.current.clientHeight;
        containerRef.current.scrollTo({ top: idx * height, behavior: 'smooth' });
        onClearJump?.();
      }
    }
  }, [initialVideoId, displayVideos, onClearJump]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollPos / height);
    if (newIndex !== activeIndex) setActiveIndex(newIndex);
  };

  return (
    <div className="h-full w-full relative bg-black">
       <div className="absolute top-0 left-0 w-full z-40 flex justify-between items-center px-6 py-10 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <h1 className="text-xl font-black tracking-[0.2em] text-white italic">CORE</h1>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500'}`} title={isConnected ? 'Conectado à Nuvem' : 'Modo Offline'}></div>
          </div>
          
          <div className="flex gap-4 pointer-events-auto bg-black/60 backdrop-blur-2xl px-6 py-3 rounded-full border border-white/10 shadow-2xl shadow-black">
            <button 
              onClick={() => { setFeedTab('following'); setActiveIndex(0); if(containerRef.current) containerRef.current.scrollTop = 0; }}
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${feedTab === 'following' ? 'text-white' : 'text-gray-600'}`}
            >
              Seguindo
            </button>
            <div className="w-[1px] h-3 bg-white/10 self-center"></div>
            <button 
              onClick={() => { setFeedTab('foryou'); setActiveIndex(0); if(containerRef.current) containerRef.current.scrollTop = 0; }}
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${feedTab === 'foryou' ? 'text-white' : 'text-gray-600'}`}
            >
              Para Você
            </button>
          </div>

          <button onClick={onSearchClick} className="w-11 h-11 pointer-events-auto bg-black border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform">
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5"/></svg>
          </button>
       </div>

      {displayVideos.length > 0 ? (
        <div ref={containerRef} onScroll={handleScroll} className="video-snap-container no-scrollbar h-full">
          {displayVideos.map((video, index) => (
            <div key={video.id} className="video-snap-item">
              <div className="h-full w-full overflow-hidden relative bg-black">
                  <VideoPlayer 
                    video={video} 
                    isActive={index === activeIndex}
                    onLike={onLike}
                    onFollow={onFollow}
                    onRepost={onRepost}
                    onNavigateToProfile={onNavigateToProfile}
                    currentUser={currentUser}
                    onAddComment={onAddComment}
                    onDeleteComment={onDeleteComment}
                    onToggleComments={onToggleComments}
                    onDeleteVideo={onDeleteVideo}
                    isFollowing={!!followingMap[video.username]}
                    onLikeComment={onLikeComment}
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                    isRepostedByMe={currentUser.repostedVideoIds.includes(video.id)}
                    allAccounts={allAccounts}
                  />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center animate-view">
           <div className="relative mb-12">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center">
                 <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="1.5"/></svg>
              </div>
           </div>
           
           <h3 className="text-4xl font-black mb-4 italic tracking-tighter uppercase">CORE IS <span className="opacity-40">EMPTY</span></h3>
           <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] max-w-xs leading-relaxed mb-12">
             Seja a alma desta comunidade. Poste o primeiro vídeo.
           </p>

           <div className="space-y-4 w-full max-w-[200px]">
              <button onClick={onSearchClick} className="w-full bg-white text-black py-5 rounded-3xl font-black text-[9px] uppercase tracking-[0.3em]">EXPLORAR</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
