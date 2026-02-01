
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
  installPrompt?: any;
  onInstallApp?: () => void;
}

const USERNAME_COOLDOWN = 30 * 24 * 60 * 60 * 1000;
const DISPLAYNAME_COOLDOWN = 7 * 24 * 60 * 60 * 1000;

const Profile: React.FC<ProfileProps> = ({ 
  videos, user, onUpdateProfile, onLogout, isOwnProfile, currentUser, 
  onFollow, onLike, onRepost, onAddComment, 
  onDeleteComment, onDeleteVideo,
  followingMap, onNavigateToProfile, onSwitchAccount, onOpenAdmin, onOpenSupport,
  onLikeComment, isMuted, setIsMuted, allAccountsData,
  installPrompt, onInstallApp
}) => {
  if (!user) return null;

  useEffect(() => {
    if (user.isBanned && !isOwnProfile) {
      alert("Esta conta foi suspensa por violar as diretrizes do Core.");
    }
  }, [user, isOwnProfile]);

  const [activeTab, setActiveTab] = useState<'videos' | 'reposts'>('videos');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(() => ({...user}));
  const [error, setError] = useState('');
  const [listDrawer, setListDrawer] = useState<{ type: 'followers' | 'following' | null; isOpen: boolean }>({ type: null, isOpen: false });
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  const getDaysRemaining = (lastChange: number | undefined, cooldown: number) => {
    if (!lastChange) return 0;
    const remaining = cooldown - (Date.now() - lastChange);
    return Math.ceil(remaining / (24 * 60 * 60 * 1000));
  };

  const usernameDays = getDaysRemaining(user.lastUsernameChange, USERNAME_COOLDOWN);
  const displayDays = getDaysRemaining(user.lastDisplayNameChange, DISPLAYNAME_COOLDOWN);

  const canChangeUsername = user.isAdmin || usernameDays <= 0;
  const canChangeDisplayName = user.isAdmin || displayDays <= 0;

  const followersList = useMemo(() => {
    return allAccountsData
      .filter(acc => acc.followingMap && acc.followingMap[user.username])
      .map(acc => acc.profile);
  }, [allAccountsData, user.username]);

  const followingList = useMemo(() => {
    const targetAcc = allAccountsData.find(acc => acc.profile.username === user.username);
    const fMap = targetAcc?.followingMap || {};
    return allAccountsData
      .filter(acc => fMap[acc.profile.username])
      .map(acc => acc.profile);
  }, [allAccountsData, user.username]);

  const validate = (val: string) => /^[a-zA-Z0-9]{3,20}$/.test(val);

  // Função para comprimir e redimensionar imagem antes do upload
  const optimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSide = 400; // Tamanho ideal para avatar

          if (width > height) {
            if (width > maxSide) {
              height *= maxSide / width;
              width = maxSide;
            }
          } else {
            if (height > maxSide) {
              width *= maxSide / height;
              height = maxSide;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.8); // 80% de qualidade JPEG
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveProfile = async () => {
    if (isUploadingPhoto) return;
    
    setError('');
    setIsSaving(true);
    
    if (editForm.username !== user.username && !canChangeUsername) {
      setError(`Username bloqueado por mais ${usernameDays} dias.`);
      setIsSaving(false);
      return;
    }
    if (editForm.displayName !== user.displayName && !canChangeDisplayName) {
      setError(`Nome bloqueado por mais ${displayDays} dias.`);
      setIsSaving(false);
      return;
    }

    if (!validate(editForm.username)) {
      setError('Username: 3-20 letras ou números.');
      setIsSaving(false);
      return;
    }

    if (editForm.avatar?.startsWith('blob:')) {
      setError('Aguarde a otimização da foto terminar.');
      setIsSaving(false);
      return;
    }

    const finalUpdates: any = { ...editForm };
    if (editForm.username !== user.username) finalUpdates.lastUsernameChange = Date.now();
    if (editForm.displayName !== user.displayName) finalUpdates.lastDisplayNameChange = Date.now();

    onUpdateProfile(user.username, finalUpdates);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPhoto(true);
      setError('');
      
      // Preview imediato
      const tempUrl = URL.createObjectURL(file);
      setEditForm(prev => ({ ...prev, avatar: tempUrl }));
      
      // Otimização (instantâneo no client)
      const optimizedBlob = await optimizeImage(file);
      
      const fileName = `avatar_${user.username}_${Date.now()}.jpg`;
      const uploadedUrl = await databaseService.uploadFile('avatars', optimizedBlob, fileName);
      
      if (uploadedUrl) {
        setEditForm(prev => ({ ...prev, avatar: uploadedUrl }));
      } else {
        setError('Erro ao enviar foto otimizada.');
      }
      setIsUploadingPhoto(false);
    }
  };

  const myVideos = useMemo(() => videos.filter(v => v.username === user.username), [videos, user.username]);
  const repostedVideos = useMemo(() => videos.filter(v => user.repostedVideoIds?.includes(v.id)), [videos, user.repostedVideoIds]);

  const backgroundStyle = {
    background: user.profileColor && user.profileColor !== '#000000' 
      ? `linear-gradient(to bottom, ${user.profileColor} 0%, #000 500px)` 
      : '#000'
  };

  return (
    <div className={`h-full overflow-y-auto no-scrollbar pb-24 text-white ${user.isBanned && !isOwnProfile ? 'opacity-30 pointer-events-none' : ''}`} style={backgroundStyle}>
      <div className="h-32 bg-gradient-to-b from-black/40 to-transparent w-full" />
      <div className="px-6 flex flex-col items-center">
        <div className="absolute top-10 right-6 flex gap-2">
          {isOwnProfile && currentUser.isAdmin && (
            <>
              <button onClick={onOpenAdmin} className="p-3 bg-white text-black rounded-2xl font-black text-[9px] uppercase tracking-widest">ADMIN</button>
              <button onClick={onOpenSupport} className="p-3 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest">SUPORTE</button>
            </>
          )}
          {isOwnProfile && <button onClick={onSwitchAccount} className="p-3 bg-white/10 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-white/10">Contas</button>}
        </div>

        <div className="w-28 h-28 rounded-[2rem] bg-black p-1 border border-white/10 mb-6 overflow-hidden shadow-2xl">
           {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-[1.8rem]" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black italic bg-zinc-900">{user.displayName.charAt(0)}</div>}
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-black italic flex items-center gap-2 justify-center">{user.displayName} {user.isVerified && <VerifiedBadge size="18" />}</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">@{user.username}</p>
        </div>

        <div className="flex gap-10 mb-8">
           <div className="text-center cursor-pointer" onClick={() => setListDrawer({ type: 'followers', isOpen: true })}>
             <p className="font-black text-lg italic">{formatNumber(user.followers || 0)}</p>
             <p className="text-[7px] text-gray-500 uppercase font-black">Seguidores</p>
           </div>
           <div className="text-center cursor-pointer" onClick={() => setListDrawer({ type: 'following', isOpen: true })}>
             <p className="font-black text-lg italic">{formatNumber(user.following || 0)}</p>
             <p className="text-[7px] text-gray-500 uppercase font-black">Seguindo</p>
           </div>
           <div className="text-center">
             <p className="font-black text-lg italic">{formatNumber(user.likes || 0)}</p>
             <p className="text-[7px] text-gray-500 uppercase font-black">Likes</p>
           </div>
        </div>

        <div className="text-xs text-gray-400 text-center mb-8 max-w-xs whitespace-pre-wrap leading-relaxed italic">
          {user.bio || "Explorando o CoreStream..."}
        </div>

        <div className="w-full max-w-[240px] space-y-3">
          {isOwnProfile ? (
            <button onClick={() => { setIsEditing(true); setEditForm({...user}); }} className="w-full bg-white text-black py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95">Editar Perfil</button>
          ) : (
            <button onClick={() => onFollow(user.username)} className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest ${followingMap[user.username] ? 'bg-white/10 text-white' : 'bg-white text-black'}`}>{followingMap[user.username] ? 'Seguindo' : 'Seguir'}</button>
          )}
        </div>

        <div className="w-full flex border-b border-white/10 mt-10">
          <button onClick={() => setActiveTab('videos')} className={`flex-1 py-4 text-[9px] font-black uppercase ${activeTab === 'videos' ? 'border-b-2 border-white text-white' : 'text-gray-500'}`}>PULSOS</button>
          <button onClick={() => setActiveTab('reposts')} className={`flex-1 py-4 text-[9px] font-black uppercase ${activeTab === 'reposts' ? 'border-b-2 border-white text-white' : 'text-gray-500'}`}>REPOSTS</button>
        </div>

        <div className="grid grid-cols-3 gap-1 w-full mt-4">
          {(activeTab === 'videos' ? myVideos : repostedVideos).map(v => (
            <div key={v.id} onClick={() => setSelectedVideo(v)} className="aspect-[3/4] bg-zinc-900 overflow-hidden relative group">
              <video src={v.url} className="w-full h-full object-cover" />
              {(isOwnProfile || currentUser.isAdmin) && <button onClick={(e) => { e.stopPropagation(); onDeleteVideo(v.id); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100"><TrashIcon size="12" /></button>}
            </div>
          ))}
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsEditing(false)} />
          <div className="relative w-full max-w-lg bg-[#0d0d0d] rounded-[2.5rem] p-8 border border-white/10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <h3 className="text-xl font-black italic uppercase mb-8">Editar Identidade</h3>
            
            {error && <p className="bg-rose-500/10 text-rose-500 p-3 rounded-xl text-[10px] font-bold uppercase mb-4 text-center border border-rose-500/20">{error}</p>}

            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 mb-4">
                 <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden relative group cursor-pointer" onClick={() => !isUploadingPhoto && photoInputRef.current?.click()}>
                    {editForm.avatar ? <img src={editForm.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-40">FOTO</div>}
                    
                    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity text-[8px] font-black ${isUploadingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {isUploadingPhoto ? 'OTIMIZANDO...' : 'TROCAR'}
                    </div>
                    
                    {isUploadingPhoto && (
                      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 animate-pulse w-full"></div>
                    )}
                 </div>
                 <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-gray-500 uppercase ml-1">Username</label>
                <input maxLength={20} type="text" disabled={!canChangeUsername} value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value.toLowerCase()})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none disabled:opacity-30" />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-gray-600 uppercase ml-1">Nome de Exibição</label>
                <input maxLength={20} type="text" disabled={!canChangeDisplayName} value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none disabled:opacity-30" />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-gray-600 uppercase ml-1">Bio</label>
                <textarea maxLength={200} value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none h-32 resize-none" />
              </div>
            </div>
            <div className="mt-10 space-y-3">
              <button 
                onClick={handleSaveProfile} 
                disabled={isSaving || isUploadingPhoto} 
                className="w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase disabled:opacity-30"
              >
                {isSaving ? 'SALVANDO...' : 'SALVAR'}
              </button>
              <button onClick={onLogout} className="w-full border border-rose-500/20 text-rose-500 py-4 rounded-2xl font-black text-[10px] uppercase">SAIR DA CONTA</button>
            </div>
          </div>
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 z-[600] bg-black">
          <button onClick={() => setSelectedVideo(null)} className="absolute top-10 left-6 z-[610] bg-white text-black px-5 py-2 rounded-full text-[10px] font-black uppercase">Fechar</button>
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
