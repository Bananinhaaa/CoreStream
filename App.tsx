
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
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem(SESSION_KEY) === 'true');
  const [videos, setVideos] = useState<Video[]>([]);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [currentUsername, setCurrentUsername] = useState<string | null>(localStorage.getItem(ACTIVE_USER_KEY));

  const loadData = useCallback(async () => {
    try {
      const [globalVideos, globalProfiles] = await Promise.all([
        databaseService.getVideos(),
        databaseService.getProfiles()
      ]);
      
      if (globalProfiles && globalProfiles.length > 0) {
        setAccounts(globalProfiles);
      }
      if (globalVideos) {
        setVideos(globalVideos);
      }
      setIsDataReady(true);
    } catch (e) {
      console.error("Erro na sincronização CORE:", e);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    initializeApp();
    
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (isLoggedIn && currentUsername) {
      databaseService.updatePresence(currentUsername);
      const heartbeat = setInterval(() => {
        databaseService.updatePresence(currentUsername);
      }, 30000);
      return () => clearInterval(heartbeat);
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
      return prev.map(a => {
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
    });
  }, []);

  const handleUpdateVideoStats = useCallback((videoId: string, stats: any) => {
    setVideos(prev => {
      return prev.map(v => {
        if (v.id === videoId) {
          const newVideo = { ...v, ...stats };
          databaseService.saveVideo(newVideo);
          return newVideo;
        }
        return v;
      });
    });
  }, []);

  const handleLikeVideo = useCallback((videoId: string) => {
    const targetVideo = videos.find(v => v.id === videoId);
    if (!targetVideo) return;

    const isLikedNow = !targetVideo.isLiked;
    const likesDiff = isLikedNow ? 1 : -1;

    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        const newV = { ...v, isLiked: isLikedNow, likes: Math.max(0, (v.likes || 0) + likesDiff) };
        databaseService.saveVideo(newV);
        return newV;
      }
      return v;
    }));

    handleUpdateAccountStats(targetVideo.username, {
      likes: Math.max(0, (accounts.find(a => a.profile.username === targetVideo.username)?.profile.likes || 0) + likesDiff)
    });
  }, [videos, accounts, handleUpdateAccountStats]);

  const handleFollowUser = useCallback((targetUsername: string) => {
    if (!currentUsername) return;
    
    setAccounts(prev => prev.map(acc => {
      if (acc.profile.username === currentUsername) {
        const isFollowing = !!acc.followingMap[targetUsername];
        const newMap = { ...acc.followingMap, [targetUsername]: !isFollowing };
        const updatedAcc = {
          ...acc,
          followingMap: newMap,
          profile: {
            ...acc.profile,
            following: Math.max(0, acc.profile.following + (isFollowing ? -1 : 1))
          }
        };
        databaseService.saveProfile(updatedAcc);
        return updatedAcc;
      }
      if (acc.profile.username === targetUsername) {
        const isAlreadyFollowed = !!accounts.find(a => a.profile.username === currentUsername)?.followingMap[targetUsername];
        const updatedAcc = {
          ...acc,
          profile: {
            ...acc.profile,
            followers: Math.max(0, acc.profile.followers + (isAlreadyFollowed ? -1 : 1))
          }
        };
        databaseService.saveProfile(updatedAcc);
        return updatedAcc;
      }
      return acc;
    }));
  }, [currentUsername, accounts]);

  const handleRepostVideo = useCallback((videoId: string, caption?: string) => {
    if (!currentUsername) return;
    const videoToRepost = videos.find(v => v.id === videoId);
    if (!videoToRepost) return;

    handleUpdateVideoStats(videoId, { reposts: (videoToRepost.reposts || 0) + 1 });

    setAccounts(prev => prev.map(acc => {
      if (acc.profile.username === currentUsername) {
        const updated = {
          ...acc,
          profile: {
            ...acc.profile,
            repostedVideoIds: [videoId, ...(acc.profile.repostedVideoIds || [])]
          }
        };
        databaseService.saveProfile(updated);
        return updated;
      }
      return acc;
    }));
  }, [currentUsername, videos, handleUpdateVideoStats]);

  const handleAddComment = useCallback((vId: string, text: string, parentId?: string) => {
    if (!activeAccount) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      username: activeAccount.profile.username,
      displayName: activeAccount.profile.displayName,
      avatar: activeAccount.profile.avatar,
      text,
      timestamp: Date.now(),
      likes: 0,
      replies: []
    };

    setVideos(prev => prev.map(v => {
      if (v.id === vId) {
        let updatedComments = [...(v.comments || [])];
        if (parentId) {
          updatedComments = updatedComments.map(c => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            return c;
          });
        } else {
          updatedComments = [newComment, ...updatedComments];
        }
        const updatedVideo = { ...v, comments: updatedComments };
        databaseService.saveVideo(updatedVideo);
        return updatedVideo;
      }
      return v;
    }));
  }, [activeAccount]);

  const handleLikeComment = useCallback((vId: string, cId: string) => {
    setVideos(prev => prev.map(v => {
      if (v.id === vId) {
        const updatedComments = (v.comments || []).map(c => {
          if (c.id === cId) {
            const isLiked = !c.isLikedByMe;
            return { 
              ...c, 
              isLikedByMe: isLiked, 
              likes: isLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1) 
            };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => {
                if (r.id === cId) {
                  const isLiked = !r.isLikedByMe;
                  return {
                    ...r,
                    isLikedByMe: isLiked,
                    likes: isLiked ? (r.likes || 0) + 1 : Math.max(0, (r.likes || 0) - 1)
                  };
                }
                return r;
              })
            };
          }
          return c;
        });
        const updatedVideo = { ...v, comments: updatedComments };
        databaseService.saveVideo(updatedVideo);
        return updatedVideo;
      }
      return v;
    }));
  }, []);

  const handleDeleteComment = useCallback((vId: string, cId: string) => {
    setVideos(prev => prev.map(v => {
      if (v.id === vId) {
        const updatedComments = (v.comments || []).filter(c => c.id !== cId).map(c => ({
          ...c,
          replies: (c.replies || []).filter(r => r.id !== cId)
        }));
        const updatedVideo = { ...v, comments: updatedComments };
        databaseService.saveVideo(updatedVideo);
        return updatedVideo;
      }
      return v;
    }));
  }, []);

  const handleSendSystemMessage = useCallback((target: string | 'all', text: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      type: 'security',
      fromUser: 'CORE SYSTEM',
      fromAvatar: '',
      timestamp: Date.now(),
      text: text
    };

    setAccounts(prev => prev.map(a => {
      if (target === 'all' || a.profile.username === target) {
        const updated = {
          ...a,
          profile: {
            ...a.profile,
            notifications: [newNotif, ...(a.profile.notifications || [])]
          }
        };
        databaseService.saveProfile(updated);
        return updated;
      }
      return a;
    }));
  }, []);

  const handleDeleteVideo = (vId: string) => {
    setVideos(prev => prev.filter(v => v.id !== vId));
  };

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

  if (isLoading && !isDataReady) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-12 text-center">
        <Logo size={120} className="mb-12 animate-pulse" />
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
        <p className="text-[9px] font-bold uppercase text-gray-500">Sincronizando Sessão</p>
        <button onClick={handleLogout} className="mt-20 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white">Sair</button>
      </div>
    );
  }

  const profileToRender = viewingUser ? accounts.find(a => a.profile.username === viewingUser)?.profile : activeAccount.profile;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'home' && <Feed videos={videos} currentUser={activeAccount.profile} onLike={handleLikeVideo} onFollow={handleFollowUser} onRepost={handleRepostVideo} onAddComment={handleAddComment} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} followingMap={activeAccount.followingMap} isMuted={isMuted} setIsMuted={setIsMuted} onSearchClick={() => setActiveTab('discover')} onDeleteComment={handleDeleteComment} onDeleteVideo={handleDeleteVideo} onToggleComments={() => {}} onLikeComment={handleLikeComment} initialVideoId={null} onClearJump={() => {}} allAccounts={accounts.map(a => a.profile)} onIncrementView={vId => handleUpdateVideoStats(vId, { views: (videos.find(v => v.id === vId)?.views || 0) + 1 })} />}
        {activeTab === 'discover' && <Discover videos={videos} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'create' && <Create onAddVideo={(v) => { setVideos([v, ...videos]); databaseService.saveVideo(v); setActiveTab('home'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'inbox' && <Inbox currentUser={activeAccount.profile} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} videos={videos} />}
        {activeTab === 'profile' && profileToRender && (
          <Profile 
            user={profileToRender} videos={videos} isOwnProfile={!viewingUser || viewingUser === activeAccount.profile.username} currentUser={activeAccount.profile}
            onFollow={handleFollowUser} onLike={handleLikeVideo} onRepost={handleRepostVideo} onAddComment={handleAddComment} onLogout={handleLogout}
            onUpdateProfile={handleUpdateAccountStats} onDeleteComment={handleDeleteComment} onDeleteVideo={handleDeleteVideo} onToggleComments={() => {}} followingMap={activeAccount.followingMap}
            onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} onSwitchAccount={() => setActiveTab('switcher')} allAccountsData={accounts} 
            onOpenAdmin={() => setActiveTab('admin')} onOpenSupport={() => setActiveTab('support')}
            onLikeComment={handleLikeComment} isMuted={isMuted} setIsMuted={setIsMuted}
          />
        )}
        {activeTab === 'admin' && (
          <AdminPanel 
            accounts={accounts} videos={videos} 
            onUpdateStats={handleUpdateAccountStats} 
            onUpdateVideoStats={handleUpdateVideoStats} 
            onDeleteVideo={handleDeleteVideo}
            onSendSystemMessage={handleSendSystemMessage} 
            onOpenSupport={() => setActiveTab('support')}
            onClose={() => setActiveTab('profile')} 
          />
        )}
        {activeTab === 'support' && (
          <SupportPanel 
            accounts={accounts} videos={videos} 
            onUpdateStats={handleUpdateAccountStats} 
            onDeleteVideo={handleDeleteVideo}
            onClose={() => setActiveTab('profile')} 
          />
        )}
        {activeTab === 'switcher' && (
          <AccountSwitcher 
            accounts={accounts.map(a => a.profile)} 
            onSelect={u => { handleLoginSuccess(u); setActiveTab('home'); }} 
            onAddAccount={handleLogout} 
            onDeleteAccount={() => {}} 
            onBack={() => setActiveTab('profile')} 
          />
        )}
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
