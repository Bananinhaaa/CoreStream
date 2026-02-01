
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  
  // Inicializa contas do localStorage para evitar que activeAccount seja null no primeiro render
  const [accounts, setAccounts] = useState<AccountData[]>(() => {
    const local = localStorage.getItem('CORE_PROFILES');
    return local ? JSON.parse(local) : [];
  });
  
  const [videos, setVideos] = useState<Video[]>(() => {
    const local = localStorage.getItem('CORE_VIDEOS');
    return local ? JSON.parse(local) : INITIAL_VIDEOS;
  });

  const [currentUsername, setCurrentUsername] = useState<string | null>(() => localStorage.getItem(ACTIVE_USER_KEY));

  const loadData = useCallback(async () => {
    try {
      const [globalVideos, globalProfiles] = await Promise.all([
        databaseService.getVideos(),
        databaseService.getProfiles()
      ]);
      
      if (globalProfiles && globalProfiles.length > 0) {
        setAccounts(globalProfiles);
        localStorage.setItem('CORE_PROFILES', JSON.stringify(globalProfiles));
      }
      if (globalVideos) {
        setVideos(globalVideos);
        localStorage.setItem('CORE_VIDEOS', JSON.stringify(globalVideos));
      }
      setIsDataReady(true);
    } catch (e) {
      console.error("Erro na sincronização CORE:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (isLoggedIn && currentUsername) {
      databaseService.updatePresence(currentUsername);
    }
  }, [isLoggedIn, currentUsername]);

  const activeAccount = useMemo(() => {
    if (!currentUsername || accounts.length === 0) return null;
    const acc = accounts.find(a => a.profile.username === currentUsername);
    if (!acc) return null;
    if (acc.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      acc.profile.isAdmin = true;
      acc.profile.isVerified = true;
    }
    return acc;
  }, [accounts, currentUsername]);

  const handleUpdateAccountStats = useCallback((username: string, stats: any) => {
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
      localStorage.setItem('CORE_PROFILES', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleUpdateVideoStats = useCallback((videoId: string, stats: any) => {
    setVideos(prev => {
      const updated = prev.map(v => {
        if (v.id === videoId) {
          const newVideo = { ...v, ...stats };
          databaseService.saveVideo(newVideo);
          return newVideo;
        }
        return v;
      });
      localStorage.setItem('CORE_VIDEOS', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Correcting syntax error: replaced </const> with proper closing of useCallback and comma
  const handleLikeVideo = useCallback((videoId: string) => {
    const targetVideo = videos.find(v => v.id === videoId);
    if (!targetVideo) return;
    const isLikedNow = !targetVideo.isLiked;
    handleUpdateVideoStats(videoId, { 
      isLiked: isLikedNow, 
      likes: Math.max(0, (targetVideo.likes || 0) + (isLikedNow ? 1 : -1)) 
    });
  }, [videos, handleUpdateVideoStats]);

  const handleLoginSuccess = (username: string) => {
    setCurrentUsername(username);
    setIsLoggedIn(true);
    localStorage.setItem(SESSION_KEY, 'true');
    localStorage.setItem(ACTIVE_USER_KEY, username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUsername(null);
    localStorage.setItem(SESSION_KEY, 'false');
    localStorage.removeItem(ACTIVE_USER_KEY);
    setActiveTab('home');
  };

  if (isLoading && !isDataReady && accounts.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-12 text-center">
        <Logo size={100} className="mb-12 animate-pulse" />
        <h2 className="text-xl font-black italic uppercase tracking-tighter mb-2">CORE CLOUD</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Sincronizando Identidade...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Auth 
        onLogin={async (id, isNew, pass, rand) => {
          const existingIdx = accounts.findIndex(a => 
            a.email.toLowerCase() === id.toLowerCase() || 
            a.profile.username.toLowerCase() === id.toLowerCase()
          );
          if (isNew && rand && existingIdx === -1) {
            const isMaster = id.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
            const newAcc: AccountData = { 
              email: id, password: pass, followingMap: {}, 
              profile: { 
                ...rand, email: id, bio: '', avatar: '', followers: 0, following: 0, likes: 0, 
                repostedVideoIds: [], notifications: [], isVerified: isMaster, isAdmin: isMaster, 
                isBanned: false, profileColor: '#000000', lastSeen: Date.now()
              } 
            };
            await databaseService.saveProfile(newAcc);
            setAccounts(prev => [...prev, newAcc]);
            handleLoginSuccess(newAcc.profile.username);
          } else if (existingIdx !== -1) {
            const acc = accounts[existingIdx];
            if (!pass || acc.password === pass) handleLoginSuccess(acc.profile.username);
          }
        }} 
        registeredAccounts={accounts.map(a => ({ email: a.email, username: a.profile.username, password: a.password }))} 
      />
    );
  }

  if (!activeAccount) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-12 text-center">
        <Logo size={60} className="mb-8 opacity-20" />
        <h2 className="text-sm font-black italic uppercase tracking-widest mb-2">Conectando...</h2>
        <p className="text-[9px] font-bold uppercase text-gray-500">Aguardando Sincronização de Perfil</p>
        <button onClick={handleLogout} className="mt-20 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white">Reiniciar Sessão</button>
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
