
'use client';

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

const SESSION_KEY = 'CORE_SESSION_ACTIVE';
const ACTIVE_USER_KEY = 'CORE_ACTIVE_USERNAME';
const PROFILES_STORAGE_KEY = 'CORE_PROFILES_V3';
const VIDEOS_STORAGE_KEY = 'CORE_VIDEOS_V3';
const TARGET_FOLLOW_EMAIL = 'davielucas914@gmail.com';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [videos, setVideos] = useState<Video[]>(INITIAL_VIDEOS);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const isSyncingRef = useRef(false);

  // Inicialização segura no lado do cliente
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY) === 'true';
    const savedUser = localStorage.getItem(ACTIVE_USER_KEY);
    const localProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
    const localVideos = localStorage.getItem(VIDEOS_STORAGE_KEY);

    if (localProfiles) setAccounts(JSON.parse(localProfiles));
    if (localVideos) setVideos(JSON.parse(localVideos));
    if (savedSession) setIsLoggedIn(true);
    if (savedUser) setCurrentUsername(savedUser);
    
    setIsLoading(false);
  }, []);

  const normalizeAccount = useCallback((p: any): AccountData | null => {
    const profileData = p.profile || p;
    const username = profileData.username;
    if (!username) return null;

    return {
      profile: {
        username: username,
        displayName: profileData.displayName || username,
        bio: profileData.bio || '',
        avatar: profileData.avatar || '',
        email: p.email || profileData.email || '',
        followers: Number(profileData.followers || 0),
        following: Number(profileData.following || 0),
        likes: Number(profileData.likes || 0),
        isVerified: !!profileData.isVerified,
        isAdmin: !!profileData.isAdmin,
        isBanned: !!profileData.isBanned,
        profileColor: profileData.profileColor || '#000000',
        repostedVideoIds: Array.isArray(profileData.repostedVideoIds) ? profileData.repostedVideoIds : [],
        notifications: Array.isArray(profileData.notifications) ? profileData.notifications : [],
        lastSeen: Number(profileData.lastSeen || Date.now())
      },
      followingMap: p.followingMap || profileData.followingMap || {},
      email: p.email || profileData.email || '',
      password: p.password || profileData.password || ''
    };
  }, []);

  const loadData = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const [remoteVideos, rawProfiles] = await Promise.all([
        databaseService.getVideos(),
        databaseService.getProfiles()
      ]);
      
      if (rawProfiles && Array.isArray(rawProfiles)) {
        setAccounts(prev => {
          const mergedMap = new Map<string, AccountData>();
          prev.forEach(p => mergedMap.set(p.profile.username, p));
          rawProfiles.forEach(p => {
            const acc = normalizeAccount(p);
            if (acc) mergedMap.set(acc.profile.username, acc);
          });
          const result = Array.from(mergedMap.values());
          localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(result));
          return result;
        });
      }

      if (remoteVideos && Array.isArray(remoteVideos)) {
        setVideos(prev => {
          const vMap = new Map<string, Video>();
          prev.forEach(v => vMap.set(v.id, v));
          remoteVideos.forEach(v => vMap.set(v.id, v));
          const sorted = Array.from(vMap.values()).sort((a, b) => {
             const timeA = parseInt(a.id.split('_')[1]) || 0;
             const timeB = parseInt(b.id.split('_')[1]) || 0;
             return timeB - timeA;
          });
          localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(sorted));
          return sorted;
        });
      }
    } catch (e) {
      console.warn("CORE: Erro de sincronização.");
    } finally {
      isSyncingRef.current = false;
    }
  }, [normalizeAccount]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const activeAccount = useMemo(() => {
    if (!currentUsername) return null;
    return accounts.find(a => a.profile.username === currentUsername) || null;
  }, [accounts, currentUsername]);

  const handleFollow = useCallback(async (targetUsername: string, forceActive?: AccountData) => {
    const me = forceActive || activeAccount;
    if (!me || me.profile.username === targetUsername) return;
    
    const isFollowing = !!me.followingMap[targetUsername];
    const newMap = { ...me.followingMap, [targetUsername]: !isFollowing };
    const updatedMe = { ...me, followingMap: newMap, profile: { ...me.profile, following: Math.max(0, me.profile.following + (isFollowing ? -1 : 1)) } };
    
    const targetAcc = accounts.find(a => a.profile.username === targetUsername);
    if (targetAcc) {
      const updatedTarget = { ...targetAcc, profile: { ...targetAcc.profile, followers: Math.max(0, targetAcc.profile.followers + (isFollowing ? -1 : 1)) } };
      setAccounts(prev => prev.map(a => a.profile.username === updatedMe.profile.username ? updatedMe : a.profile.username === updatedTarget.profile.username ? updatedTarget : a));
      await Promise.all([databaseService.saveProfile(updatedMe), databaseService.saveProfile(updatedTarget)]);
    }
  }, [activeAccount, accounts]);

  const handleLoginSuccess = useCallback(async (username: string) => {
    localStorage.setItem(ACTIVE_USER_KEY, username);
    localStorage.setItem(SESSION_KEY, 'true');
    setCurrentUsername(username);
    setIsLoggedIn(true);
    setActiveTab('home');
  }, []);

  const handleAuth = useCallback(async (identifier: string, isNew: boolean, password?: string, randomData?: { displayName: string, username: string }) => {
    const idClean = identifier.toLowerCase().trim();
    
    if (isNew && randomData) {
      const rawProfiles = await databaseService.getProfiles();
      const latestAccounts = (rawProfiles || []).map(normalizeAccount).filter(Boolean) as AccountData[];
      
      const newAcc: AccountData = {
        email: idClean, password: password || '', followingMap: {},
        profile: {
          username: randomData.username, displayName: randomData.displayName,
          bio: '', avatar: '', email: idClean, followers: 0, following: 0, likes: 0,
          isVerified: false, isAdmin: false, isBanned: false,
          profileColor: '#000000', repostedVideoIds: [], notifications: [], lastSeen: Date.now()
        }
      };
      
      const targetAdmin = latestAccounts.find(a => a.email.toLowerCase() === TARGET_FOLLOW_EMAIL.toLowerCase());
      if (targetAdmin) {
        newAcc.followingMap[targetAdmin.profile.username] = true;
        newAcc.profile.following = 1;
        const updatedAdmin = { ...targetAdmin, profile: { ...targetAdmin.profile, followers: targetAdmin.profile.followers + 1 } };
        await databaseService.saveProfile(updatedAdmin);
      }

      setAccounts(prev => [newAcc, ...prev]);
      await databaseService.saveProfile(newAcc);
      handleLoginSuccess(newAcc.profile.username);
    } else {
      const acc = accounts.find(a => a.email.toLowerCase() === idClean || a.profile.username.toLowerCase() === idClean);
      if (acc) {
        if (acc.password && password && acc.password !== password) {
          alert("Senha incorreta.");
          return;
        }
        handleLoginSuccess(acc.profile.username);
      } else {
        alert("Conta não encontrada. Aguarde a sincronização.");
      }
    }
  }, [accounts, handleLoginSuccess, normalizeAccount]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUsername(null);
    localStorage.setItem(SESSION_KEY, 'false');
    localStorage.removeItem(ACTIVE_USER_KEY);
    setActiveTab('home');
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-12 text-center">
        <Logo size={100} className="animate-pulse mb-8" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">CoreStream</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Auth onLogin={handleAuth} registeredAccounts={accounts.map(a => ({ email: a.email, username: a.profile.username, password: a.password }))} />;
  }

  if (!activeAccount) { handleLogout(); return null; }

  const profileToRender = viewingUser ? accounts.find(a => a.profile.username === viewingUser)?.profile : activeAccount.profile;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'home' && <Feed videos={videos} currentUser={activeAccount.profile} onLike={()=>{}} onFollow={handleFollow} onRepost={()=>{}} onAddComment={()=>{}} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} followingMap={activeAccount.followingMap} isMuted={isMuted} setIsMuted={setIsMuted} onSearchClick={() => setActiveTab('discover')} onDeleteComment={()=>{}} onDeleteVideo={()=>{}} onToggleComments={() => {}} onLikeComment={()=>{}} allAccounts={accounts.map(a => a.profile)} />}
        {activeTab === 'discover' && <Discover videos={videos} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'create' && <Create onAddVideo={(v) => { setVideos([v, ...videos]); setActiveTab('home'); }} currentUser={activeAccount.profile} allAccounts={accounts} />}
        {activeTab === 'inbox' && <Inbox currentUser={activeAccount.profile} onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} videos={videos} />}
        {activeTab === 'profile' && profileToRender && (
          <Profile 
            user={profileToRender} videos={videos} isOwnProfile={!viewingUser || viewingUser === activeAccount.profile.username} currentUser={activeAccount.profile}
            onFollow={handleFollow} onLike={()=>{}} onRepost={()=>{}} onAddComment={()=>{}} onLogout={handleLogout}
            onUpdateProfile={(old, up) => databaseService.saveProfile({...activeAccount, profile: {...activeAccount.profile, ...up}})} onDeleteComment={()=>{}} onDeleteVideo={()=>{}} onToggleComments={() => {}} followingMap={activeAccount.followingMap}
            onNavigateToProfile={u => { setViewingUser(u); setActiveTab('profile'); }} onSwitchAccount={() => setActiveTab('switcher')} allAccountsData={accounts} 
            onLikeComment={()=>{}} isMuted={isMuted} setIsMuted={setIsMuted}
          />
        )}
      </main>
      <nav className="h-[80px] border-t border-white/5 bg-black flex items-center justify-around px-2 z-50">
        <button onClick={() => { setViewingUser(null); setActiveTab('home'); }} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-white' : 'text-gray-600'}`}><HomeIcon active={activeTab === 'home'} /><span className="text-[10px] mt-1 font-black">Início</span></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('discover'); }} className={`flex flex-col items-center ${activeTab === 'discover' ? 'text-white' : 'text-gray-600'}`}><SearchIcon active={activeTab === 'discover'} /><span className="text-[10px] mt-1 font-black">Explorar</span></button>
        <button onClick={() => setActiveTab('create')} className="relative -top-2 transition-transform active:scale-90"><div className="w-14 h-11 bg-white rounded-2xl flex items-center justify-center shadow-xl"><PlusIcon /></div></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('inbox'); }} className={`flex flex-col items-center ${activeTab === 'inbox' ? 'text-white' : 'text-gray-600'}`}><MessageIcon active={activeTab === 'inbox'} /><span className="text-[10px] mt-1 font-black">Inbox</span></button>
        <button onClick={() => { setViewingUser(null); setActiveTab('profile'); }} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-white' : 'text-gray-600'}`}><UserIcon active={activeTab === 'profile'} /><span className="text-[10px] mt-1 font-black">Perfil</span></button>
      </nav>
    </div>
  );
};

export default App;
