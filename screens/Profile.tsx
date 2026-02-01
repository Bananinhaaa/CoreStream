
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Video, UserProfile } from '../types';
import { VerifiedBadge, TrashIcon } from '../components/Icons';
import VideoPlayer from '../components/VideoPlayer';
import UserListDrawer from '../components/UserListDrawer';
import { formatNumber } from '../utils/formatters';
import { databaseService } from '../services/databaseService';

interface ProfileProps {
  videos: Video[];
  user: UserProfile;
  onUpdateProfile: (oldUsername: string, updates: any) => void;
  onLogout: () => void;
  isOwnProfile?: boolean;
  currentUser: UserProfile;
  onFollow: (username: string) => void;
  onLike: (id: string) => void;
  onRepost: (id: string) => void;
  onAddComment: (videoId: string, text: string) => void;
  onDeleteComment: (vId: string, cId: string) => void;
  onToggleComments: (vId: string) => void;
  onDeleteVideo: (id: string) => void;
  followingMap: Record<string, boolean>;
  onNavigateToProfile: (username: string) => void;
  onSwitchAccount: () => void;
  allAccountsData: any[];
  onOpenAdmin?: () => void;
  onOpenSupport?: () => void;
  onLikeComment: (vId: string, cId: string) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
}

const USERNAME_COOLDOWN = 30 * 24 * 60 * 60 * 1000;
const DISPLAYNAME_COOLDOWN = 7 * 24 * 60 * 60 * 1000;

const Profile: React.FC<ProfileProps> = ({ 
  videos, user, onUpdateProfile, onLogout, isOwnProfile, currentUser, 
  onFollow, onLike, onRepost, onAddComment, 
  onDeleteComment, onDeleteVideo,
  followingMap, onNavigateToProfile, onSwitchAccount, onOpenAdmin, onOpenSupport,
  onLikeComment, isMuted, setIsMuted, allAccountsData
}) => {
  if (!user) return null;

  const [activeTab, setActiveTab] = useState<'videos' | 'reposts'>('videos');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(() => ({...user}));
  const [error, setError] = useState('');
  const [listDrawer, setListDrawer] = useState<{ type: 'followers' | 'following' | null; isOpen: boolean }>({ type: null, isOpen: false });
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  const usernameDays = useMemo(() => {
    if (!user.lastUsernameChange) return 0;
    const rem = USERNAME_COOLDOWN - (Date.now() - user.lastUsernameChange);
    return Math.max(0, Math.ceil(rem / (24 * 60 * 60 * 1000)));
  }, [user.lastUsernameChange]);

  const displayDays = useMemo(() => {
    if (!user.lastDisplayNameChange) return 0;
    const rem = DISPLAYNAME_COOLDOWN - (Date.now() - user.lastDisplayNameChange);
    return Math.max(0, Math.ceil(rem / (24 * 60 * 60 * 1000)));
  }, [user.lastDisplayNameChange]);

  const canChangeUsername = user.isAdmin || usernameDays <= 0;
  const canChangeDisplayName = user.isAdmin || displayDays <= 0;

  const followersList = useMemo(() => 
    allAccountsData.filter(acc => acc.followingMap?.[user.username]).map(acc => acc.profile),
    [allAccountsData, user.username]
  );

  const followingList = useMemo(() => {
    const target = allAccountsData.find(acc => acc.profile.username === user.username);
    const map = target?.followingMap || {};
    return allAccountsData.filter(acc => map[acc.profile.username]).map(acc => acc.profile);
  }, [allAccountsData, user.username]);

  // Compressor de Imagem em Tempo Real
  const optimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 400;
          let w = img.width;
          let h = img.height;
          if (w > h) { if (w > max) { h *= max/w; w = max; } }
          else { if (h > max) { w *= max/h; h = max; } }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          canvas.toBlob(b => resolve(b || file), 'image/jpeg', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setError('');
    
    // Preview Instantâneo (UX)
    const previewUrl = URL.createObjectURL(file);
    setEditForm(prev => ({ ...prev, avatar: previewUrl }));

    try {
      const optimized = await optimizeImage(file);
      const fileName = `avatar_${user.username}_${Date.now()}.jpg`;
      const cloudUrl = await databaseService.uploadFile('avatars', optimized, fileName);
      
      if (cloudUrl) {
        setEditForm(prev => ({ ...prev, avatar: cloudUrl }));
      }
    } catch (err) {
      setError('Erro ao processar imagem.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (isUploadingPhoto) return;
    setIsSaving(true);
    setError('');

    const isCloud = databaseService.isConnected();
    if (isCloud && editForm.avatar?.startsWith('blob:')) {
      setError('Aguarde a sincronização da foto...');
      setIsSaving(false);
      return;
    }

    const updates: any = { ...editForm };
    if (editForm.username !== user.username) updates.lastUsernameChange = Date.now();
    if (editForm.displayName !== user.displayName) updates.lastDisplayNameChange = Date.now();

    try {
      await onUpdateProfile(user.username, updates);
      setIsEditing(false);
    } catch (err) {
      setError('Erro ao salvar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const myVideos = useMemo(() => videos.filter(v => v.username === user.username), [videos, user.username]);
  const repostedVideos = useMemo(() => videos.filter(v => user.repostedVideoIds?.includes(v.id)), [videos, user.repostedVideoIds]);

  const bgStyle = {
    background: user.profileColor && user.profileColor !== '#000000' 
      ? `linear-gradient(to bottom, ${user.profileColor} 0%, #000 600px)` 
      : '#000'
  };

  return (
    <div className={`h-full overflow-y-auto no-scrollbar pb-32 text-white animate-view ${user.isBanned && !isOwnProfile ? 'opacity-30 pointer-events-none' : ''}`} style={bgStyle}>
      <div className="h-44 bg-gradient-to-b from-black/60 to-transparent w-full" />
      
      <div className="px-6 -mt-20 flex flex-col items-center relative">
        {isOwnProfile && (
          <div className="absolute -top-10 right-6 flex gap-2">
            {currentUser.isAdmin && (
              <button onClick={onOpenAdmin} className="p-3 bg-white text-black rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-2xl">ADMIN</button>
            )}
            <button onClick={onSwitchAccount} className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl font-black text-[9px] uppercase tracking-widest border border-white/10">Contas</button>
          </div>
        )}

        <div className="w-32 h-32 rounded-[2.5rem] bg-black p-1.5 border-2 border-white/10 mb-6 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500">
           {user.avatar ? (
             <img src={user.avatar} className="w-full h-full object-cover rounded-[2.2rem]" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-4xl font-black italic bg-zinc-900 rounded-[2.2rem]">
               {user.displayName.charAt(0)}
             </div>
           )}
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black italic flex items-center gap-2 justify-center tracking-tighter">
            {user.displayName} {user.isVerified && <VerifiedBadge size="22" />}
          </h2>
          <p className="text-[11px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1 opacity-60">@{user.username}</p>
        </div>

        <div className="flex gap-12 mb-10 bg-white/5 backdrop-blur-md px-8 py-5 rounded-[2.5rem] border border-white/5">
           <div className="text-center cursor-pointer active:scale-95 transition-transform" onClick={() => setListDrawer({ type: 'followers', isOpen: true })}>
             <p className="font-black text-xl italic">{formatNumber(user.followers || 0)}</p>
             <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Seguidores</p>
           </div>
           <div className="text-center cursor-pointer active:scale-95 transition-transform" onClick={() => setListDrawer({ type: 'following', isOpen: true })}>
             <p className="font-black text-xl italic">{formatNumber(user.following || 0)}</p>
             <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Seguindo</p>
           </div>
           <div className="text-center">
             <p className="font-black text-xl italic">{formatNumber(user.likes || 0)}</p>
             <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Likes</p>
           </div>
        </div>

        <p className="text-sm text-gray-300 text-center mb-10 max-w-xs italic leading-relaxed font-medium">
          {user.bio || "Este scripter ainda não definiu um manifesto."}
        </p>

        <div className="w-full max-w-[280px]">
          {isOwnProfile ? (
            <button onClick={() => { setIsEditing(true); setEditForm({...user}); }} className="w-full bg-white text-black py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all">Editar Perfil</button>
          ) : (
            <button onClick={() => onFollow(user.username)} className={`w-full py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${followingMap[user.username] ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-black shadow-xl'}`}>
              {followingMap[user.username] ? 'Seguindo' : 'Seguir'}
            </button>
          )}
        </div>

        <div className="w-full flex border-b border-white/5 mt-12 mb-6">
          <button onClick={() => setActiveTab('videos')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'videos' ? 'border-b-2 border-white text-white' : 'text-gray-600'}`}>Meus Pulsos</button>
          <button onClick={() => setActiveTab('reposts')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reposts' ? 'border-b-2 border-white text-white' : 'text-gray-600'}`}>Republicados</button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 w-full">
          {(activeTab === 'videos' ? myVideos : repostedVideos).map(v => (
            <div key={v.id} onClick={() => setSelectedVideo(v)} className="aspect-[3/4] bg-zinc-900 overflow-hidden relative group rounded-xl border border-white/5 cursor-pointer">
              <video src={v.url} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/></svg>
                <span className="text-[10px] font-black">{formatNumber(v.likes)}</span>
              </div>
            </div>
          ))}
          {(activeTab === 'videos' ? myVideos : repostedVideos).length === 0 && (
            <div className="col-span-3 py-20 text-center opacity-20 italic text-xs uppercase tracking-widest">Nada por aqui ainda.</div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-view" onClick={() => !isSaving && setIsEditing(false)} />
          <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-[3rem] p-10 border border-white/10 max-h-[85vh] overflow-y-auto no-scrollbar shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
            <h3 className="text-2xl font-black italic uppercase mb-10 tracking-tighter">Sincronizar Identidade</h3>
            
            {error && <p className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black uppercase mb-6 text-center border border-rose-500/20">{error}</p>}

            <div className="space-y-8">
              <div className="flex flex-col items-center gap-6">
                 <div className="w-28 h-28 rounded-[2.5rem] bg-white/5 border-2 border-white/10 overflow-hidden relative group cursor-pointer shadow-2xl" onClick={() => !isUploadingPhoto && photoInputRef.current?.click()}>
                    <img src={editForm.avatar} className={`w-full h-full object-cover transition-all ${isUploadingPhoto ? 'opacity-30 blur-sm' : ''}`} />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] font-black uppercase tracking-widest">{isUploadingPhoto ? '...' : 'Trocar'}</p>
                    </div>
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                 </div>
                 <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase ml-2 tracking-widest">Handle (@)</label>
                  <input maxLength={20} type="text" disabled={!canChangeUsername} value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value.toLowerCase().trim()})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-white transition-all disabled:opacity-20 font-bold" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase ml-2 tracking-widest">Nome de Pulso</label>
                  <input maxLength={20} type="text" disabled={!canChangeDisplayName} value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-white transition-all disabled:opacity-20 font-bold" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase ml-2 tracking-widest">Manifesto (Bio)</label>
                  <textarea maxLength={200} value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none h-32 resize-none focus:border-white transition-all font-medium" />
                </div>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <button onClick={handleSaveProfile} disabled={isSaving || isUploadingPhoto} className="w-full bg-white text-black py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl disabled:opacity-30 active:scale-95 transition-all">
                {isSaving ? 'Sincronizando...' : 'Confirmar Alterações'}
              </button>
              <button onClick={onLogout} className="w-full border border-rose-500/20 text-rose-500/60 hover:text-rose-500 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all">Desconectar</button>
            </div>
          </div>
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 z-[2000] bg-black animate-view">
          <button onClick={() => setSelectedVideo(null)} className="absolute top-12 left-6 z-[2010] bg-white/10 backdrop-blur-xl border border-white/10 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Voltar</button>
          <VideoPlayer video={selectedVideo} isActive={true} onLike={onLike} onFollow={onFollow} onRepost={onRepost} onNavigateToProfile={onNavigateToProfile} currentUser={currentUser} onAddComment={onAddComment} onDeleteComment={onDeleteComment} onToggleComments={() => {}} onDeleteVideo={onDeleteVideo} isFollowing={!!followingMap[selectedVideo.username]} onLikeComment={onLikeComment} isMuted={isMuted} setIsMuted={setIsMuted} isRepostedByMe={currentUser.repostedVideoIds.includes(selectedVideo.id)} allAccounts={allAccountsData.map(a => a.profile)} />
        </div>
      )}

      <UserListDrawer 
        isOpen={listDrawer.isOpen} 
        onClose={() => setListDrawer({ ...listDrawer, isOpen: false })} 
        title={listDrawer.type === 'followers' ? 'Seguidores' : 'Seguindo'} 
        users={listDrawer.type === 'followers' ? followersList : followingList} 
        onUserClick={onNavigateToProfile} 
      />
    </div>
  );
};

export default Profile;
