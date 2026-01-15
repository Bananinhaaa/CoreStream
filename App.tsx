
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
const ACTIVE_INDEX_KEY = 'CORE_ACTIVE_ACCOUNT_IDX';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(SESSION_KEY) === 'true');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [currentAccountIndex, setCurrentAccountIndex] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_INDEX_KEY);
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    const loadGlobalData = async () => {
      setIsLoading(true);
      try {
        const [globalVideos, globalProfiles] = await Promise.all([
          databaseService.getVideos(),
          databaseService.getProfiles()
        ]);
        setVideos(globalVideos);
        setAccounts(globalProfiles);
      } catch (error) {
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadGlobalData();
  }, []);

  const activeAccount = useMemo(() => {
    if (accounts.length === 0) return null;
    const safeIdx = currentAccountIndex >= 0 && currentAccountIndex < accounts.length ? currentAccountIndex : 0;
    return accounts[safeIdx];
  }, [accounts, currentAccountIndex]);

  const addNotification = useCallback((targetUsername: string, notification: Omit<Notification, 'id' | 'timestamp'>) => {
    setAccounts(prev => prev.map(acc => {
      if (targetUsername === 'all' || acc.profile.username === targetUsername) {
        const updatedAcc = {
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
        databaseService.saveProfile(updatedAcc);
        return updatedAcc;
      }
      return acc;
    }));
  }, []);

  const handleUpdateAccountStats = (username: string, stats: Partial<UserProfile> & { password?: string, email?: string }) => {
    setAccounts(prev => prev.map(a => {
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
    }));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem(SESSION_KEY);
    setActiveTab('home');
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Limpando o CORE...</p>
      </div>
    );
  }

  if (!isLoggedIn || !activeAccount) {
    return (
      <Auth 
        onLogin={async (id, isNew, pass, rand) => {
          const idx = accounts.findIndex(a => a.email.toLowerCase() === id.toLowerCase() || a.profile.username.toLowerCase() === id.toLowerCase());
          if (isNew && rand && idx === -1) {
            const isMaster = id.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
            const newAcc: AccountData = { 
              email: id, 
              password: pass, 
              followingMap: {}, 
              profile: { 
                ...rand, email: id, bio: 'Novo explorador no CoreStream', avatar: '', 
                followers: 0, following: 0, likes: 0, repostedVideoIds: [], 
                notifications: [], isVerified: isMaster, isAdmin: isMaster, isBanned: false
              } 
            };
            await databaseService.saveProfile(newAcc);
            setAccounts(prev => [...prev, newAcc]);
            setCurrentAccountIndex(accounts.length);
            setIsLoggedIn(true);
            localStorage.setItem(SESSION_KEY, 'true');
          } else if (idx !== -1) {
            setCurrentAccountIndex(idx);
            setIsLoggedIn(true);
            localStorage.setItem(SESSION_KEY, 'true');
          }
        }} 
        registeredAccounts={accounts.map(a => ({ email: a.email, username: a.profile.username, password: a.password }))} 
      />
    );
  }

  // TELA DE BANIMENTO PARA O USUÁRIO LOGADO
  if (activeAccount.profile.isBanned) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-10 text-center animate-view">
         <div className="w-24 h-24 bg-rose-600 rounded-[2.5rem] mb-8 flex items-center justify-center shadow-2xl shadow-rose-600/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2.5"/></svg>
         </div>
         <h1 className="text-4xl font-black italic uppercase tracking-tighter text-rose-500 mb-4">Acesso Negado</h1>
         <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-12">Esta conta foi suspensa permanentemente por violar as diretrizes do CoreStream.</p>
         <button onClick={handleLogout} className="bg-white text-black px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">Sair da Conta</button>
      </div>
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
            onSendSystemMessage={(t, m) => addNotification(t, { type: 'security', fromUser: 'Sistema', fromAvatar: '', text: m })} 
            onClose={() => setActiveTab('profile')} 
          />
        )}
        {activeTab === 'switcher' && (
          <AccountSwitcher 
            accounts={accounts.map(a => a.profile)} 
            onSelect={u => { const idx = accounts.findIndex(a => a.profile.username === u); setCurrentAccountIndex(idx); setActiveTab('home'); }} 
            onAddAccount={() => { setIsLoggedIn(false); setActiveTab('home'); }} 
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
