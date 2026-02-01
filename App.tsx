
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Video, UserProfile, Notification, Comment } from './types';
import { INITIAL_VIDEOS } from './constants';
import { databaseService } from './services/databaseService';
import Feed from './screens/Feed';
import Discover from './screens/Discover';
import Create from './screens/Create';
import Inbox from './screens/Inbox';
import Profile from './screens/Profile';
import Auth from './screens/Auth';
import AccountSwitcher from './screens/AccountSwitcher';
import AdminPanel from './screens/AdminPanel';
import SupportPanel from './screens/SupportPanel';
import Logo from './components/Logo';
import { HomeIcon, SearchIcon, PlusIcon, MessageIcon, UserIcon } from './components/Icons';

type Tab = 'home' | 'discover' | 'create' | 'inbox' | 'profile' | 'admin' | 'support' | 'switcher';

interface AccountData {
  profile: UserProfile;
  followingMap: Record<string, boolean>;
  email: string;
  password?: string;
}

const MASTER_ADMIN_EMAIL = 'davielucas914@gmail.com';
const SESSION_KEY = 'CORE_SESSION_ACTIVE';
const ACTIVE_USER_KEY = 'CORE_ACTIVE_USERNAME';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(SESSION_KEY) === 'true');
  
  // Estado de contas robusto com persistência imediata
  const [accounts, setAccounts] = useState<AccountData[]>(() => {
    try {
      const local = localStorage.getItem('CORE_PROFILES');
      return local ? JSON.parse(local) : [];
    } catch (e) { return []; }
  });
  
  const [videos, setVideos] = useState<Video[]>(() => {
    try {
      const local = localStorage.getItem('CORE_VIDEOS');
      return local ? JSON.parse(local) : INITIAL_VIDEOS;
    } catch (e) { return INITIAL_VIDEOS; }
  });

  const [currentUsername, setCurrentUsername] = useState<string | null>(() => localStorage.getItem(ACTIVE_USER_KEY));
  const isSyncingRef = useRef(false);

  // Função mestre de sincronização
  const loadData = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      console.log("CORE: Sincronizando com a nuvem...");
      const [globalVideos, rawProfiles] = await Promise.all([
        databaseService.getVideos(),
        databaseService.getProfiles()
      ]);
      
      if (rawProfiles && Array.isArray(rawProfiles)) {
        setAccounts(prev => {
          const remoteMap = new Map<string, AccountData>();
          
          rawProfiles.forEach((p: any) => {
            // Se vier do banco (Convex), os dados vêm "achatados"
            // Se vier do localStorage, pode vir aninhado. Tratamos ambos:
            const username = p.username || (p.profile && p.profile.username);
            if (!username) return;

            const profileData: UserProfile = {
              username: username,
              displayName: p.displayName || (p.profile && p.profile.displayName) || username,
              bio: p.bio || (p.profile && p.profile.bio) || '',
              avatar: p.avatar || (p.profile && p.profile.avatar) || '',
              email: p.email || (p.profile && p.profile.email) || '',
              followers: Number(p.followers ?? (p.profile && p.profile.followers) ?? 0),
              following: Number(p.following ?? (p.profile && p.profile.following) ?? 0),
              likes: Number(p.likes ?? (p.profile && p.profile.likes) ?? 0),
              isVerified: !!(p.isVerified ?? (p.profile && p.profile.isVerified)),
              isAdmin: !!(p.isAdmin ?? (p.profile && p.profile.isAdmin)),
              isBanned: !!(p.isBanned ?? (p.profile && p.profile.isBanned)),
              profileColor: p.profileColor || (p.profile && p.profile.profileColor) || '#000000',
              repostedVideoIds: p.repostedVideoIds || (p.profile && p.profile.repostedVideoIds) || [],
              notifications: p.notifications || (p.profile && p.profile.notifications) || [],
              lastSeen: p.lastSeen || (p.profile && p.profile.lastSeen) || Date.now()
            };
            
            remoteMap.set(username, {
              profile: profileData,
              followingMap: p.followingMap || {},
              email: p.email || profileData.email,
              password: p.password || ''
            });
          });

          // Unificamos: Cloud vence o Local, mas Local preserva o que ainda não subiu
          const merged = Array.from(remoteMap.values());
          prev.forEach(localAcc => {
            if (!remoteMap.has(localAcc.profile.username)) {
              merged.push(localAcc);
            }
          });
          
          if (merged.length > 0) {
            localStorage.setItem('CORE_PROFILES', JSON.stringify(merged));
          }
          return merged;
        });
      }

      if (globalVideos && Array.isArray(globalVideos)) {
        setVideos(prev => {
          const remoteIds = new Set(globalVideos.map(v => v.id));
          const localOnly = prev.filter(v => !remoteIds.has(v.id));
          const merged = [...globalVideos, ...localOnly];
          localStorage.setItem('CORE_VIDEOS', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {
      console.error("CORE: Erro de sincronização:", e);
    } finally {
      setIsDataReady(true);
      setIsLoading(false);
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadData();
    const syncInterval = setInterval(loadData, 15000); 
    return () => clearInterval(syncInterval);
  }, [loadData]);

  const activeAccount = useMemo(() => {
    if (!currentUsername || accounts.length === 0) return null;
    const acc = accounts.find(a => a.profile.username === currentUsername);
    if (acc) {
      const isMaster = acc.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
      if (isMaster) {
        acc.profile.isAdmin = true;
        acc.profile.isVerified = true;
      }
    }
    return acc || null;
  }, [accounts, currentUsername]);

  const handleLoginSuccess = useCallback((username: string) => {
    localStorage.setItem(ACTIVE_USER_KEY, username);
    localStorage.setItem(SESSION_KEY, 'true');
    setCurrentUsername(username);
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUsername(null);
    localStorage.setItem(SESSION_KEY, 'false');
    localStorage.removeItem(ACTIVE_USER_KEY);
    setActiveTab('home');
  }, []);

  const handleUpdateAccountStats = useCallback(async (username: string, stats: any) => {
    setAccounts(prev => {
      const updated = prev.map(a => {
        if (a.profile.username === username) {
          const newAcc = { 
            ...a, 
            profile: { ...a.profile, ...stats },
            email: stats.email || a.email,
            password: stats.password || a.password
          };
          databaseService.saveProfile(newAcc);
          return newAcc;
        }
        return a;
      });
      return updated;
    });
  }, []);

  const handleUpdateVideoStats = useCallback(async (videoId: string, stats: any) => {
    setVideos(prev => {
      const updated = prev.map(v => {
        if (v.id === videoId) {
          const newVideo = { ...v, ...stats };
          databaseService.saveVideo(newVideo);
          return newVideo;
        }
        return v;
      });
      return updated;
    });
  }, []);

  const handleLikeVideo = useCallback((videoId: string) => {
    const targetVideo = videos.find(v => v.id === videoId);
    if (!targetVideo) return;
    const isLikedNow = !targetVideo.isLiked;
    handleUpdateVideoStats(videoId, { 
      isLiked: isLikedNow, 
      likes: Math.max(0, (targetVideo.likes || 0) + (isLikedNow ? 1 : -1)) 
    });
  }, [videos, handleUpdateVideoStats]);

  // UI DE CARREGAMENTO INICIAL
  if (isLoading && accounts.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-12 text-center">
        <Logo size={100} className="mb-12 animate-pulse" />
        <h2 className="text-xl font-black italic uppercase tracking-tighter mb-2">CORE CLOUD</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Conectando ao Fluxo...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Auth 
        onLogin={async (id, isNew, pass, rand) => {
          const idClean = id.toLowerCase().trim();
          const existingIdx = accounts.findIndex(a => 
            a.email.toLowerCase() === idClean || 
            a.profile.username.toLowerCase() === idClean
          );
          
          if (isNew && rand && existingIdx === -1) {
            const isMaster = idClean === MASTER_ADMIN_EMAIL.toLowerCase();
            const newAcc: AccountData = { 
              email: idClean, password: pass, followingMap: {}, 
              profile: { 
                ...rand, email: idClean, bio: '', avatar: '', followers: 0, following: 0, likes: 0, 
                repostedVideoIds: [], notifications: [], isVerified: isMaster, isAdmin: isMaster, 
                isBanned: false, profileColor: '#000000', lastSeen: Date.now()
              } 
            };
            setAccounts(prev => [...prev, newAcc]);
            handleLoginSuccess(newAcc.profile.username);
            await databaseService.saveProfile(newAcc);
          } else if (existingIdx !== -1) {
            const acc = accounts[existingIdx];
            if (!pass || acc.password === pass) handleLoginSuccess(acc.profile.username);
          }
        }} 
        registeredAccounts={accounts.map(a => ({ email: a.email, username: a.profile.username, password: a.password }))} 
      />
    );
  }

  // Se logado mas sem conta ativa após sincronia completa
  if (!activeAccount && isDataReady) {
    console.error("CORE: Sessão corrompida. Deslogando...");
    handleLogout();
    return null;
  }

  // Caso esteja em transição de sessão
  if (!activeAccount) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-12 text-center">
        <Logo size={80} className="mb-8 animate-pulse opacity-40" />
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Validando Identidade...</p>
      </div>
    );
  }

  const profileToRender = viewingUser ? accounts.find(a => a.profile.username === viewingUser)?.profile : activeAccount.profile;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'home' && <Feed videos={videos} currentUser={activeAccount.profile} onLike={handleLikeVideo} onFollow={()=>{}} onRepost={()=>{}} onAddComment={()=>{}} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} followingMap={activeAccount.followingMap} isMuted={isMuted} setIsMuted={setIsMuted} onSearchClick={() => setActiveTab('discover')} onDeleteComment={()=>{}} onDeleteVideo={()=>{}} onToggleComments={() => {}} onLikeComment={()=>{}} allAccounts={accounts.map(a => a.profile)} />}
        {activeTab === 'discover' && <Discover videos={videos} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'create' && <Create onAddVideo={(v) => { setVideos([v, ...videos]); databaseService.saveVideo(v); setActiveTab('home'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'inbox' && <Inbox currentUser={activeAccount.profile} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} videos={videos} />}
        {activeTab === 'profile' && profileToRender && (
          <Profile 
            user={profileToRender} videos={videos} isOwnProfile={!viewingUser || viewingUser === activeAccount.profile.username} currentUser={activeAccount.profile}
            onFollow={()=>{}} onLike={handleLikeVideo} onRepost={()=>{}} onAddComment={()=>{}} onLogout={handleLogout}
            onUpdateProfile={handleUpdateAccountStats} onDeleteComment={()=>{}} onDeleteVideo={()=>{}} onToggleComments={() => {}} followingMap={activeAccount.followingMap}
            onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} onSwitchAccount={() => setActiveTab('switcher')} allAccountsData={accounts} 
            onOpenAdmin={() => setActiveTab('admin')} onOpenSupport={() => setActiveTab('support')}
            onLikeComment={()=>{}} isMuted={isMuted} setIsMuted={setIsMuted}
          />
        )}
        {activeTab === 'admin' && <AdminPanel accounts={accounts} videos={videos} onUpdateStats={handleUpdateAccountStats} onUpdateVideoStats={handleUpdateVideoStats} onDeleteVideo={()=>{}} onSendSystemMessage={()=>{}} onOpenSupport={()=>{}} onClose={() => setActiveTab('profile')} />}
        {activeTab === 'support' && <SupportPanel accounts={accounts} videos={videos} onUpdateStats={handleUpdateAccountStats} onDeleteVideo={()=>{}} onClose={() => setActiveTab('profile')} />}
        {activeTab === 'switcher' && <AccountSwitcher accounts={accounts.map(a => a.profile)} onSelect={handleLoginSuccess} onAddAccount={handleLogout} onDeleteAccount={() => {}} onBack={() => setActiveTab('profile')} />}
      </main>
      <nav className={`h-[80px] border-t border-white/5 bg-black flex items-center justify-around px-2 z-50 ${['switcher', 'admin', 'support'].includes(activeTab) ? 'hidden' : ''}`}>
        <button onClick={() => { setViewingUser(null); setActiveTab('home'); }} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-white' : 'text-gray-600'}`}><HomeIcon active={activeTab === 'home'} /><span className="text-[10px] mt-1 font-black uppercase tracking-tighter">Início</span></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('discover'); }} className={`flex flex-col items-center ${activeTab === 'discover' ? 'text-white' : 'text-gray-600'}`}><SearchIcon active={activeTab === 'discover'} /><span className="text-[10px] mt-1 font-black uppercase tracking-tighter">Explorar</span></button>
        <button onClick={() => setActiveTab('create')} className="relative -top-2"><div className="w-14 h-11 bg-white rounded-2xl flex items-center justify-center shadow-xl"><PlusIcon /></div></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('inbox'); }} className={`flex flex-col items-center ${activeTab === 'inbox' ? 'text-white' : 'text-gray-600'}`}><MessageIcon active={activeTab === 'inbox'} /><span className="text-[10px] mt-1 font-black uppercase tracking-tighter">Inbox</span></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('profile'); }} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-white' : 'text-gray-600'}`}><UserIcon active={activeTab === 'profile'} /><span className="text-[10px] mt-1 font-black uppercase tracking-tighter">Perfil</span></button>
      </nav>
    </div>
  );
};

export default App;
