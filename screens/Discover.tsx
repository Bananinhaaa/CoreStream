
import React, { useState, useMemo, useEffect } from 'react';
import { Video, UserProfile } from '../types';
import { getTrendingNews } from '../services/geminiService';
import { VerifiedBadge } from '../components/Icons';

interface DiscoverProps {
  videos: Video[];
  onNavigateToProfile: (username: string) => void;
  currentUser: UserProfile;
  allAccounts: any[];
}

const Discover: React.FC<DiscoverProps> = ({ videos, onNavigateToProfile, currentUser, allAccounts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    getTrendingNews().then(setTrends);
  }, []);

  const onlineUsers = useMemo(() => {
    const FIVE_MINUTES = 5 * 60 * 1000;
    const now = Date.now();
    return allAccounts
      .filter(acc => acc.profile.username !== currentUser.username) // Não mostrar a si mesmo
      .filter(acc => acc.profile.lastSeen && (now - acc.profile.lastSeen) < FIVE_MINUTES)
      .map(acc => acc.profile);
  }, [allAccounts, currentUser.username]);

  const filteredVideos = useMemo(() => {
    if (!searchTerm.trim()) return videos;
    const term = searchTerm.toLowerCase();
    return videos.filter(v => 
      v.description.toLowerCase().includes(term) || 
      v.username.toLowerCase().includes(term)
    );
  }, [searchTerm, videos]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allAccounts;
    const term = searchTerm.toLowerCase();
    return allAccounts.filter(acc => 
      acc.profile.username.toLowerCase().includes(term) || 
      acc.profile.displayName.toLowerCase().includes(term)
    );
  }, [searchTerm, allAccounts]);

  return (
    <div className="h-full animate-view overflow-y-auto no-scrollbar pb-24 bg-black">
      <header className="p-8 pb-6 sticky top-0 bg-black/95 backdrop-blur-2xl z-50 border-b border-white/5">
        <h2 className="text-3xl font-black mb-6 tracking-tighter italic uppercase">Explore</h2>
        <div className="relative">
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar scripters, tags..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-14 outline-none focus:border-white transition-all text-sm font-semibold text-white placeholder:text-gray-700"
          />
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </header>

      <div className="px-6 space-y-12 mt-8">
        {/* ONLINE USERS SECTION */}
        {onlineUsers.length > 0 && (
          <section className="animate-view">
             <div className="flex items-center justify-between mb-6 px-1">
               <h3 className="text-[10px] font-black uppercase text-green-400 tracking-[0.4em] flex items-center gap-2">
                 Online Agora 
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
               </h3>
               <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{onlineUsers.length}</span>
             </div>
             <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
                {onlineUsers.map((user) => (
                  <div 
                    key={user.username}
                    onClick={() => onNavigateToProfile(user.username)}
                    className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 p-0.5 group-active:scale-90 transition-transform">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover rounded-[0.8rem]" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-lg bg-zinc-800 rounded-[0.8rem]">{user.username.charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-[3px] border-black rounded-full shadow-lg"></div>
                    </div>
                    <p className="text-[8px] font-black text-white uppercase truncate w-14 text-center">{user.displayName.split(' ')[0]}</p>
                  </div>
                ))}
             </div>
          </section>
        )}

        {trends.length > 0 && (
          <section className="animate-view">
             <div className="flex items-center justify-between mb-6 px-1">
               <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em]">Real-time Trends ⚡</h3>
             </div>
             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {trends.map((chunk, idx) => (
                  <a 
                    key={idx}
                    href={chunk.web?.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[240px] bg-white/5 border border-white/5 p-5 rounded-[2rem] hover:bg-indigo-600/10 transition-all group"
                  >
                    <p className="text-[9px] font-black text-gray-500 uppercase mb-2 group-hover:text-indigo-400 transition-colors">{chunk.web?.title || 'Notícia Tech'}</p>
                    <p className="text-xs font-medium text-white line-clamp-2 italic">Acompanhe as últimas novidades no CoreStream</p>
                  </a>
                ))}
             </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-[10px] font-black uppercase text-white tracking-[0.4em]">Todos os Scripters</h3>
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{filteredUsers.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-x-4 gap-y-8">
            {filteredUsers.map(acc => (
              <div 
                key={acc.profile.username} 
                onClick={() => onNavigateToProfile(acc.profile.username)} 
                className="flex flex-col items-center gap-2 cursor-pointer group animate-view"
              >
                <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden transition-transform group-active:scale-90 shadow-lg">
                  {acc.profile.avatar ? (
                    <img src={acc.profile.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-black text-xl text-white/20">{acc.profile.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-col items-center w-full px-1 overflow-hidden text-center">
                  <span className="text-[8px] font-black text-white uppercase truncate w-full flex items-center justify-center gap-0.5">
                    {acc.profile.displayName} {acc.profile.isVerified && <VerifiedBadge size="8" />}
                  </span>
                  <span className="text-[7px] font-bold text-gray-600 uppercase truncate w-full">@{acc.profile.username}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Discover;
