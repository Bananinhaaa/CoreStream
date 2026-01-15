
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
import { HomeIcon, SearchIcon, PlusIcon, MessageIcon, UserIcon } from './components/Icons';

type Tab = 'home' | 'discover' | 'create' | 'inbox' | 'profile' | 'admin' | 'switcher';

interface AccountData {
  profile: UserProfile;
  followingMap: Record<string, boolean>;
  email: string;
  password?: string;
}

const MASTER_ADMIN_EMAIL = 'davielucas914@gmail.com';
const ACCOUNTS_DB_KEY = 'CORE_ACCOUNTS_FOLDER_V1';
const SESSION_KEY = 'CORE_SESSION_ACTIVE';
const ACTIVE_INDEX_KEY = 'CORE_ACTIVE_ACCOUNT_IDX';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(SESSION_KEY) === 'true');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [accounts, setAccounts] = useState<AccountData[]>(() => {
    try {
      const saved = localStorage.getItem(ACCOUNTS_DB_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [currentAccountIndex, setCurrentAccountIndex] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_INDEX_KEY);
    return saved ? parseInt(saved) : 0;
  });

  // Captura o evento de instalação do PWA
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const loadGlobalData = async () => {
      setIsLoading(true);
      try {
        const globalVideos = await databaseService.getVideos();
        setVideos(globalVideos.length > 0 ? globalVideos : INITIAL_VIDEOS);
      } catch (error) {
        setVideos(INITIAL_VIDEOS);
      } finally {
        setIsLoading(false);
      }
    };
    loadGlobalData();
  }, []);

  useEffect(() => {
    localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(accounts));
    localStorage.setItem('CORE_VIDEOS_FOLDER_V1', JSON.stringify(videos));
    localStorage.setItem(SESSION_KEY, isLoggedIn.toString());
    localStorage.setItem(ACTIVE_INDEX_KEY, currentAccountIndex.toString());
  }, [accounts, videos, isLoggedIn, currentAccountIndex]);

  const activeAccount = useMemo(() => {
    if (accounts.length === 0) return null;
    const safeIdx = currentAccountIndex >= 0 && currentAccountIndex < accounts.length ? currentAccountIndex : 0;
    return accounts[safeIdx];
  }, [accounts, currentAccountIndex]);

  const handleAddVideo = async (newVideo: Video) => {
    setVideos(prev => [newVideo, ...prev]);
    await databaseService.saveVideo(newVideo);
    setActiveTab('home');
  };

  const addNotification = useCallback((targetUsername: string, notification: Omit<Notification, 'id' | 'timestamp'>) => {
    setAccounts(prev => prev.map(acc => {
      if (targetUsername === 'all' || acc.profile.username === targetUsername) {
        return {
          ...acc,
          profile: {
            ...acc.profile,
            notifications: [{
              ...notification,
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              timestamp: Date.now()
            }, ...(acc.profile.notifications || [])]
          }
        };
      }
      return acc;
    }));
  }, []);

  const handleLike = useCallback((id: string) => {
    const video = videos.find(v => v.id === id);
    if (!video || !activeAccount) return;
    const isLiking = !video.isLiked;
    setVideos(prev => prev.map(v => v.id === id ? {...v, isLiked: isLiking, likes: isLiking ? v.likes + 1 : v.likes - 1} : v));
    databaseService.updateInteraction('like', id, activeAccount.profile.username);
    if (isLiking && video.username !== activeAccount.profile.username) {
      addNotification(video.username, {
        type: 'like', fromUser: activeAccount.profile.username, fromAvatar: activeAccount.profile.avatar,
        text: 'curtiu seu vídeo', videoId: id
      });
    }
  }, [videos, activeAccount, addNotification]);

  const handleFollow = useCallback((u: string) => {
    if (!activeAccount) return;
    const currentlyFollowing = !!activeAccount.followingMap[u];
    setAccounts(prev => prev.map((acc, idx) => {
      if (idx === currentAccountIndex) {
        return { ...acc, followingMap: { ...acc.followingMap, [u]: !currentlyFollowing }, profile: { ...acc.profile, following: !currentlyFollowing ? acc.profile.following + 1 : acc.profile.following - 1 } };
      }
      if (acc.profile.username === u) {
        return { ...acc, profile: { ...acc.profile, followers: !currentlyFollowing ? acc.profile.followers + 1 : acc.profile.followers - 1 } };
      }
      return acc;
    }));
    databaseService.updateInteraction('follow', u, activeAccount.profile.username);
    if (!currentlyFollowing) {
      addNotification(u, { type: 'follow', fromUser: activeAccount.profile.username, fromAvatar: activeAccount.profile.avatar, text: 'te seguiu' });
    }
  }, [activeAccount, currentAccountIndex, addNotification]);

  const handleRepost = useCallback((id: string, customCaption?: string) => {
    const video = videos.find(v => v.id === id);
    if (!video || !activeAccount) return;
    
    const hasReposted = activeAccount.profile.repostedVideoIds.includes(id);
    
    setAccounts(prev => prev.map((acc, idx) => {
      if (idx === currentAccountIndex) {
        const newReposts = hasReposted 
          ? acc.profile.repostedVideoIds.filter(rid => rid !== id) 
          : [...acc.profile.repostedVideoIds, id];
        return { ...acc, profile: { ...acc.profile, repostedVideoIds: newReposts } };
      }
      return acc;
    }));

    setVideos(prev => prev.map(v => v.id === id ? { ...v, reposts: hasReposted ? v.reposts - 1 : v.reposts + 1 } : v));

    if (!hasReposted && video.username !== activeAccount.profile.username) {
      addNotification(video.username, {
        type: 'repost',
        fromUser: activeAccount.profile.username,
        fromAvatar: activeAccount.profile.avatar,
        text: customCaption ? `republicou seu vídeo: "${customCaption}"` : 'republicou seu vídeo',
        videoId: id
      });
    }
  }, [videos, activeAccount, currentAccountIndex, addNotification]);

  const handleAddComment = useCallback((videoId: string, text: string, parentId?: string) => {
    if (!activeAccount || !text.trim()) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      username: activeAccount.profile.username,
      displayName: activeAccount.profile.displayName,
      avatar: activeAccount.profile.avatar || '',
      text: text.trim(),
      timestamp: Date.now(),
      likes: 0,
      isVerified: !!activeAccount.profile.isVerified,
      replies: []
    };
    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        if (parentId) {
          return { ...v, comments: (v.comments || []).map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), newComment] } : c) };
        }
        return { ...v, comments: [newComment, ...(v.comments || [])] };
      }
      return v;
    }));
  }, [activeAccount]);

  const handleLogout = () => { 
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false); 
    setActiveTab('home'); 
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Carregando CoreStream...</p>
      </div>
    );
  }

  if (!isLoggedIn || !activeAccount) {
    return <Auth onLogin={(id, isNew, pass, rand) => {
      const idx = accounts.findIndex(a => a.email === id || a.profile.username === id);
      if (isNew && rand && idx === -1) {
        const isMaster = id === MASTER_ADMIN_EMAIL;
        const newAcc: AccountData = { 
          email: id, 
          password: pass, 
          followingMap: {}, 
          profile: { 
            ...rand, 
            email: id, 
            bio: 'Novo explorador no CoreStream', 
            avatar: '', 
            followers: 0, 
            following: 0, 
            likes: 0, 
            repostedVideoIds: [], 
            notifications: [], 
            isVerified: isMaster, 
            isAdmin: isMaster 
          } 
        };
        const updated = [...accounts, newAcc];
        setAccounts(updated);
        setCurrentAccountIndex(updated.length - 1);
        setIsLoggedIn(true);
      } else if (idx !== -1) {
        setCurrentAccountIndex(idx);
        setIsLoggedIn(true);
      } else {
        alert("Conta não encontrada. Crie uma nova.");
      }
    }} registeredAccounts={accounts.map(a => ({ email: a.email, username: a.profile.username, password: a.password }))} />;
  }

  const profileToRender = viewingUser ? accounts.find(a => a.profile.username === viewingUser)?.profile : activeAccount.profile;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'home' && <Feed videos={videos} currentUser={activeAccount.profile} onLike={handleLike} onFollow={handleFollow} onRepost={handleRepost} onAddComment={handleAddComment} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} followingMap={activeAccount.followingMap} isMuted={isMuted} setIsMuted={setIsMuted} onSearchClick={() => setActiveTab('discover')} onDeleteComment={(vId, cId) => setVideos(v => v.map(x => x.id === vId ? {...x, comments: (x.comments||[]).filter(c => c.id !== cId)} : x))} onDeleteVideo={id => setVideos(v => v.filter(x => x.id !== id))} onToggleComments={() => {}} onLikeComment={(vId, cId) => setVideos(v => v.map(x => x.id === vId ? {...x, comments: (x.comments||[]).map(c => c.id === cId ? {...c, likes: (c.likes||0)+1} : c)} : x))} initialVideoId={null} onClearJump={() => {}} allAccounts={accounts.map(a => a.profile)} onIncrementView={id => setVideos(v => v.map(x => x.id === id ? {...x, views: (x.views||0)+1} : x))} />}
        {activeTab === 'discover' && <Discover videos={videos} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'create' && <Create onAddVideo={handleAddVideo} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'inbox' && <Inbox currentUser={activeAccount.profile} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} videos={videos} />}
        {activeTab === 'profile' && profileToRender && (
          <Profile 
            user={profileToRender} 
            videos={videos} 
            isOwnProfile={!viewingUser || viewingUser === activeAccount.profile.username} 
            currentUser={activeAccount.profile} 
            onFollow={handleFollow} 
            onLike={handleLike} 
            onRepost={handleRepost} 
            onAddComment={handleAddComment} 
            onLogout={handleLogout} 
            onUpdateProfile={(old, updates) => setAccounts(prev => prev.map(a => a.profile.username === old ? {...a, profile: {...a.profile, ...updates}} : a))} 
            onDeleteComment={(vId, cId) => setVideos(v => v.map(x => x.id === vId ? {...x, comments: (x.comments||[]).filter(c => c.id !== cId)} : x))} 
            onDeleteVideo={id => setVideos(v => v.filter(x => x.id !== id))} 
            onToggleComments={() => {}} 
            followingMap={activeAccount.followingMap} 
            onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} 
            onSwitchAccount={() => setActiveTab('switcher')} 
            allAccountsData={accounts} 
            onOpenAdmin={() => setActiveTab('admin')} 
            onLikeComment={(vId, cId) => setVideos(v => v.map(x => x.id === vId ? {...x, comments: (x.comments||[]).map(c => c.id === cId ? {...c, likes: (c.likes||0)+1} : c)} : x))} 
            isMuted={isMuted} 
            setIsMuted={setIsMuted}
            installPrompt={deferredPrompt}
            onInstallApp={handleInstallClick}
          />
        )}
        {activeTab === 'admin' && <AdminPanel accounts={accounts} videos={videos} onUpdateStats={(u, s) => setAccounts(prev => prev.map(a => a.profile.username === u ? {...a, profile: {...a.profile, ...s}, email: s.email || a.email, password: s.password || a.password} : a))} onUpdateVideoStats={(id, s) => setVideos(v => v.map(x => x.id === id ? {...x, ...s} : x))} onDeleteAccount={() => {}} onSendSystemMessage={(t, m) => addNotification(t, { type: 'security', fromUser: 'Sistema', fromAvatar: '', text: m })} onClose={() => setActiveTab('profile')} onTransferVideo={(vid, target) => {
          setVideos(prev => prev.map(v => v.id === vid ? { ...v, username: target } : v));
        }} />}
        {activeTab === 'switcher' && <AccountSwitcher accounts={accounts.map(a => a.profile)} onSelect={u => { const idx = accounts.findIndex(a => a.profile.username === u); setCurrentAccountIndex(idx); setActiveTab('home'); }} onAddAccount={() => { setIsLoggedIn(false); setActiveTab('home'); }} onDeleteAccount={u => setAccounts(p => p.filter(a => a.profile.username !== u))} onBack={() => setActiveTab('profile')} />}
      </main>
      <nav className={`h-[80px] border-t border-white/5 bg-black flex items-center justify-around px-2 z-50 ${activeTab === 'switcher' || activeTab === 'admin' ? 'hidden' : ''}`}>
        <button onClick={() => { setViewingUser(null); setActiveTab('home'); }} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-white' : 'text-gray-600'}`}><HomeIcon active={activeTab === 'home'} /><span className="text-[10px] mt-1 font-black uppercase">Início</span></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('discover'); }} className={`flex flex-col items-center ${activeTab === 'discover' ? 'text-white' : 'text-gray-600'}`}><SearchIcon active={activeTab === 'discover'} /><span className="text-[10px] mt-1 font-black uppercase">Core</span></button>
        <button onClick={() => setActiveTab('create')} className="relative -top-2"><div className="w-14 h-11 bg-white rounded-2xl flex items-center justify-center shadow-xl"><PlusIcon /></div></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('inbox'); }} className={`flex flex-col items-center ${activeTab === 'inbox' ? 'text-white' : 'text-gray-600'}`}><MessageIcon active={activeTab === 'inbox'} /><span className="text-[10px] mt-1 font-black uppercase">Inbox</span></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('profile'); }} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-white' : 'text-gray-600'}`}><UserIcon active={activeTab === 'profile'} /><span className="text-[10px] mt-1 font-black uppercase">Perfil</span></button>
      </nav>
    </div>
  );
};

export default App;
