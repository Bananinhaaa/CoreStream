
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
const SESSION_KEY = 'CORE_SESSION_ACTIVE';
const ACTIVE_USER_KEY = 'CORE_ACTIVE_USERNAME';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [currentUsername, setCurrentUsername] = useState<string | null>(localStorage.getItem(ACTIVE_USER_KEY));

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        const [globalVideos, globalProfiles] = await Promise.all([
          databaseService.getVideos(),
          databaseService.getProfiles()
        ]);
        
        setVideos(globalVideos);
        setAccounts(globalProfiles);

        const wasLoggedIn = localStorage.getItem(SESSION_KEY) === 'true';
        const savedUsername = localStorage.getItem(ACTIVE_USER_KEY);

        if (wasLoggedIn && savedUsername) {
          const userExists = globalProfiles.find(a => a.profile.username === savedUsername);
          if (userExists) {
            setCurrentUsername(savedUsername);
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();

    // Sincronização periódica de dados (Polloing leve para status online)
    const interval = setInterval(async () => {
      const profiles = await databaseService.getProfiles();
      if (profiles.length > 0) setAccounts(profiles);
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, []);

  // HEARTBEAT: Avisa que o usuário está online
  useEffect(() => {
    if (isLoggedIn && currentUsername) {
      databaseService.updatePresence(currentUsername);
      const heartbeat = setInterval(() => {
        databaseService.updatePresence(currentUsername);
      }, 30000); // 30 segundos
      return () => clearInterval(heartbeat);
    }
  }, [isLoggedIn, currentUsername]);

  const activeAccount = useMemo(() => {
    if (!currentUsername || accounts.length === 0) return null;
    return accounts.find(a => a.profile.username === currentUsername) || null;
  }, [accounts, currentUsername]);

  const handleUpdateAccountStats = useCallback((username: string, stats: any) => {
    setAccounts(prev => {
      return prev.map(a => {
        if (a.profile.username === username) {
          const updated = { 
            ...a, 
            profile: { ...a.profile, ...stats },
            email: stats.email || a.email,
            password: stats.password || a.password
          };
          databaseService.saveProfile(updated);
          return updated;
        }
        return a;
      });
    });
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUsername(null);
    localStorage.setItem(SESSION_KEY, 'false');
    localStorage.removeItem(ACTIVE_USER_KEY);
    setActiveTab('home');
  };

  const handleLoginSuccess = (username: string) => {
    setCurrentUsername(username);
    setIsLoggedIn(true);
    localStorage.setItem(SESSION_KEY, 'true');
    localStorage.setItem(ACTIVE_USER_KEY, username);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-6"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse text-white/40">Conectando ao Core...</p>
      </div>
    );
  }

  if (!isLoggedIn || !activeAccount) {
    return (
      <Auth 
        onLogin={async (id, isNew, pass, rand) => {
          const existingIdx = accounts.findIndex(a => a.email.toLowerCase() === id.toLowerCase() || a.profile.username.toLowerCase() === id.toLowerCase());
          
          if (isNew && rand && existingIdx === -1) {
            const isMaster = id.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
            const newAcc: AccountData = { 
              email: id, 
              password: pass, 
              followingMap: {}, 
              profile: { 
                ...rand, email: id, bio: 'Novo explorador no CoreStream', avatar: '', 
                followers: 0, following: 0, likes: 0, repostedVideoIds: [], 
                notifications: [], isVerified: isMaster, isAdmin: isMaster, isBanned: false,
                profileColor: '#000000', lastSeen: Date.now()
              } 
            };
            await databaseService.saveProfile(newAcc);
            setAccounts(prev => [...prev, newAcc]);
            handleLoginSuccess(newAcc.profile.username);
          } else if (existingIdx !== -1) {
            const acc = accounts[existingIdx];
            if (!pass || acc.password === pass) {
              handleLoginSuccess(acc.profile.username);
            }
          }
        }} 
        registeredAccounts={accounts.map(a => ({ email: a.email, username: a.profile.username, password: a.password }))} 
      />
    );
  }

  const profileToRender = viewingUser ? accounts.find(a => a.profile.username === viewingUser)?.profile : activeAccount.profile;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'home' && <Feed videos={videos} currentUser={activeAccount.profile} onLike={() => {}} onFollow={() => {}} onRepost={() => {}} onAddComment={() => {}} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} followingMap={activeAccount.followingMap} isMuted={isMuted} setIsMuted={setIsMuted} onSearchClick={() => setActiveTab('discover')} onDeleteComment={() => {}} onDeleteVideo={() => {}} onToggleComments={() => {}} onLikeComment={() => {}} initialVideoId={null} onClearJump={() => {}} allAccounts={accounts.map(a => a.profile)} onIncrementView={() => {}} />}
        {activeTab === 'discover' && <Discover videos={videos} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'create' && <Create onAddVideo={(v) => { setVideos([v, ...videos]); databaseService.saveVideo(v); setActiveTab('home'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'inbox' && <Inbox currentUser={activeAccount.profile} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} videos={videos} />}
        {activeTab === 'profile' && profileToRender && (
          <Profile 
            user={profileToRender} videos={videos} isOwnProfile={!viewingUser || viewingUser === activeAccount.profile.username} currentUser={activeAccount.profile}
            onFollow={() => {}} onLike={() => {}} onRepost={() => {}} onAddComment={() => {}} onLogout={handleLogout}
            onUpdateProfile={handleUpdateAccountStats} onDeleteComment={() => {}} onDeleteVideo={() => {}} onToggleComments={() => {}} followingMap={activeAccount.followingMap}
            onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} onSwitchAccount={() => setActiveTab('switcher')} allAccountsData={accounts} onOpenAdmin={() => setActiveTab('admin')} onLikeComment={() => {}} isMuted={isMuted} setIsMuted={setIsMuted}
          />
        )}
        {activeTab === 'admin' && (
          <AdminPanel 
            accounts={accounts} videos={videos} 
            onUpdateStats={handleUpdateAccountStats} 
            onUpdateVideoStats={() => {}} 
            onDeleteAccount={() => {}}
            onDeleteVideo={() => {}}
            onSendSystemMessage={() => {}} 
            onClose={() => setActiveTab('profile')} 
          />
        )}
        {activeTab === 'switcher' && (
          <AccountSwitcher 
            accounts={accounts.map(a => a.profile)} 
            onSelect={u => { 
              handleLoginSuccess(u);
              setActiveTab('home'); 
            }} 
            onAddAccount={() => { 
              setIsLoggedIn(false); 
              localStorage.setItem(SESSION_KEY, 'false');
              setActiveTab('home'); 
            }} 
            onDeleteAccount={() => {}} 
            onBack={() => setActiveTab('profile')} 
          />
        )}
      </main>
      <nav className={`h-[80px] border-t border-white/5 bg-black flex items-center justify-around px-2 z-50 ${activeTab === 'switcher' || activeTab === 'admin' ? 'hidden' : ''}`}>
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
