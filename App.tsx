
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
const PROFILES_STORAGE_KEY = 'CORE_PROFILES_V3';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(SESSION_KEY) === 'true');
  
  const [accounts, setAccounts] = useState<AccountData[]>(() => {
    try {
      const local = localStorage.getItem(PROFILES_STORAGE_KEY);
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

  // Normalização de dados para garantir que perfis da nuvem apareçam corretamente
  const normalizeAccount = useCallback((p: any): AccountData | null => {
    const username = p.username || (p.profile && p.profile.username);
    if (!username) return null;

    const profile: UserProfile = {
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
      repostedVideoIds: Array.isArray(p.repostedVideoIds) ? p.repostedVideoIds : (p.profile?.repostedVideoIds || []),
      notifications: Array.isArray(p.notifications) ? p.notifications : (p.profile?.notifications || []),
      lastSeen: p.lastSeen || (p.profile && p.profile.lastSeen) || Date.now()
    };

    return {
      profile,
      followingMap: p.followingMap || {},
      email: p.email || profile.email,
      password: p.password || ''
    };
  }, []);

  const loadData = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const [globalVideos, rawProfiles] = await Promise.all([
        databaseService.getVideos(),
        databaseService.getProfiles()
      ]);
      
      if (rawProfiles && Array.isArray(rawProfiles)) {
        setAccounts(prev => {
          const remoteMap = new Map<string, AccountData>();
          rawProfiles.forEach(p => {
            const acc = normalizeAccount(p);
            if (acc) remoteMap.set(acc.profile.username, acc);
          });

          // Unir dados remotos com locais (para não perder o login ativo se o cloud falhar)
          const merged = Array.from(remoteMap.values());
          prev.forEach(localAcc => {
            if (!remoteMap.has(localAcc.profile.username) && localAcc.profile.username === currentUsername) {
              merged.push(localAcc);
            }
          });

          if (merged.length > 0) {
            localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(merged));
          }
          return merged;
        });
      }

      if (globalVideos && Array.isArray(globalVideos)) {
        setVideos(globalVideos);
        localStorage.setItem('CORE_VIDEOS', JSON.stringify(globalVideos));
      }
    } catch (e) {
      console.warn("CORE: Sincronização falhou, usando dados locais.");
    } finally {
      setIsDataReady(true);
      setIsLoading(false);
      isSyncingRef.current = false;
    }
  }, [currentUsername, normalizeAccount]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const activeAccount = useMemo(() => {
    if (!currentUsername) return null;
    return accounts.find(a => a.profile.username === currentUsername) || null;
  }, [accounts, currentUsername]);

  const handleLoginSuccess = useCallback((username: string) => {
    localStorage.setItem(ACTIVE_USER_KEY, username);
    localStorage.setItem(SESSION_KEY, 'true');
    setCurrentUsername(username);
    setIsLoggedIn(true);
    setActiveTab('home');
  }, []);

  const handleAuth = useCallback(async (identifier: string, isNew: boolean, password?: string, randomData?: { displayName: string, username: string }) => {
    const idClean = identifier.toLowerCase().trim();
    
    if (isNew && randomData) {
      // PROCESSO DE CADASTRO
      const isMaster = idClean === MASTER_ADMIN_EMAIL.toLowerCase();
      const newAcc: AccountData = {
        email: idClean,
        password: password || '',
        followingMap: {},
        profile: {
          username: randomData.username,
          displayName: randomData.displayName,
          bio: '',
          avatar: '',
          email: idClean,
          followers: 0,
          following: 0,
          likes: 0,
          isVerified: isMaster,
          isAdmin: isMaster,
          isBanned: false,
          profileColor: '#000000',
          repostedVideoIds: [],
          notifications: [],
          lastSeen: Date.now()
        }
      };

      // Adiciona ao estado e salva
      setAccounts(prev => {
        const updated = [newAcc, ...prev];
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      
      await databaseService.saveProfile(newAcc);
      handleLoginSuccess(newAcc.profile.username);
    } else {
      // PROCESSO DE LOGIN (A validação real já acontece no componente Auth, aqui apenas confirmamos a sessão)
      const acc = accounts.find(a => 
        a.email.toLowerCase() === idClean || 
        a.profile.username.toLowerCase() === idClean
      );
      if (acc) {
        handleLoginSuccess(acc.profile.username);
      }
    }
  }, [accounts, handleLoginSuccess]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUsername(null);
    localStorage.setItem(SESSION_KEY, 'false');
    localStorage.removeItem(ACTIVE_USER_KEY);
    setActiveTab('home');
  }, []);

  // Interações Online
  const handleFollow = useCallback(async (targetUsername: string) => {
    if (!activeAccount || activeAccount.profile.username === targetUsername) return;
    const isFollowing = !!activeAccount.followingMap[targetUsername];
    const newFollowingMap = { ...activeAccount.followingMap, [targetUsername]: !isFollowing };
    
    const myUpdates = { 
      following: Math.max(0, activeAccount.profile.following + (isFollowing ? -1 : 1)),
      followingMap: newFollowingMap 
    };

    const targetAcc = accounts.find(a => a.profile.username === targetUsername);
    if (targetAcc) {
      const targetUpdates = {
        followers: Math.max(0, targetAcc.profile.followers + (isFollowing ? -1 : 1)),
      };
      
      const updatedMe = { ...activeAccount, followingMap: newFollowingMap, profile: { ...activeAccount.profile, following: myUpdates.following } };
      const updatedTarget = { ...targetAcc, profile: { ...targetAcc.profile, followers: targetUpdates.followers } };

      setAccounts(prev => prev.map(a => {
        if (a.profile.username === activeAccount.profile.username) return updatedMe;
        if (a.profile.username === targetUsername) return updatedTarget;
        return a;
      }));

      await Promise.all([
        databaseService.saveProfile(updatedMe),
        databaseService.saveProfile(updatedTarget)
      ]);
    }
  }, [activeAccount, accounts]);

  const handleLikeVideo = useCallback(async (videoId: string) => {
    if (!activeAccount) return;
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const isLiked = !video.isLiked;
    const newLikes = Math.max(0, (video.likes || 0) + (isLiked ? 1 : -1));
    const updatedVideo = { ...video, isLiked, likes: newLikes };

    setVideos(prev => prev.map(v => v.id === videoId ? updatedVideo : v));
    await databaseService.saveVideo(updatedVideo);
  }, [activeAccount, videos]);

  if (isLoading && accounts.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-12 text-center">
        <Logo size={100} className="mb-12 animate-pulse" />
        <h2 className="text-xl font-black italic uppercase tracking-tighter">CORE STREAM</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Iniciando Sistema...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Auth 
        onLogin={handleAuth} 
        registeredAccounts={accounts.map(a => ({ 
          email: a.email, 
          username: a.profile.username, 
          password: a.password 
        }))} 
      />
    );
  }

  if (!activeAccount) {
    if (isDataReady) handleLogout();
    return null;
  }

  const profileToRender = viewingUser ? accounts.find(a => a.profile.username === viewingUser)?.profile : activeAccount.profile;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'home' && (
          <Feed 
            videos={videos} currentUser={activeAccount.profile} onLike={handleLikeVideo} onFollow={handleFollow} 
            onRepost={()=>{}} onAddComment={()=>{}} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} 
            followingMap={activeAccount.followingMap} isMuted={isMuted} setIsMuted={setIsMuted} 
            onSearchClick={() => setActiveTab('discover')} onDeleteComment={()=>{}} onDeleteVideo={()=>{}} 
            onToggleComments={() => {}} onLikeComment={()=>{}} allAccounts={accounts.map(a => a.profile)} 
          />
        )}
        {activeTab === 'discover' && <Discover videos={videos} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'create' && <Create onAddVideo={(v) => { setVideos([v, ...videos]); databaseService.saveVideo(v); setActiveTab('home'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'inbox' && <Inbox currentUser={activeAccount.profile} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} videos={videos} />}
        {activeTab === 'profile' && profileToRender && (
          <Profile 
            user={profileToRender} videos={videos} isOwnProfile={!viewingUser || viewingUser === activeAccount.profile.username} currentUser={activeAccount.profile}
            onFollow={handleFollow} onLike={handleLikeVideo} onRepost={()=>{}} onAddComment={()=>{}} onLogout={handleLogout}
            onUpdateProfile={(old, up) => databaseService.saveProfile({...activeAccount, profile: {...activeAccount.profile, ...up}})} onDeleteComment={()=>{}} onDeleteVideo={()=>{}} onToggleComments={() => {}} followingMap={activeAccount.followingMap}
            onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} onSwitchAccount={() => setActiveTab('switcher')} allAccountsData={accounts} 
            onOpenAdmin={() => setActiveTab('admin')} onOpenSupport={() => setActiveTab('support')}
            onLikeComment={()=>{}} isMuted={isMuted} setIsMuted={setIsMuted}
          />
        )}
      </main>
      <nav className={`h-[80px] border-t border-white/5 bg-black flex items-center justify-around px-2 z-50 ${['switcher', 'admin', 'support'].includes(activeTab) ? 'hidden' : ''}`}>
        <button onClick={() => { setViewingUser(null); setActiveTab('home'); }} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-white' : 'text-gray-600'}`}><HomeIcon active={activeTab === 'home'} /><span className="text-[10px] mt-1 font-black uppercase">Início</span></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('discover'); }} className={`flex flex-col items-center ${activeTab === 'discover' ? 'text-white' : 'text-gray-600'}`}><SearchIcon active={activeTab === 'discover'} /><span className="text-[10px] mt-1 font-black uppercase">Explorar</span></button>
        <button onClick={() => setActiveTab('create')} className="relative -top-2"><div className="w-14 h-11 bg-white rounded-2xl flex items-center justify-center shadow-xl"><PlusIcon /></div></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('inbox'); }} className={`flex flex-col items-center ${activeTab === 'inbox' ? 'text-white' : 'text-gray-600'}`}><MessageIcon active={activeTab === 'inbox'} /><span className="text-[10px] mt-1 font-black uppercase">Inbox</span></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('profile'); }} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-white' : 'text-gray-600'}`}><UserIcon active={activeTab === 'profile'} /><span className="text-[10px] mt-1 font-black uppercase">Perfil</span></button>
      </nav>
    </div>
  );
};

export default App;
