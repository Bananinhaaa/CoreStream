
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
      <header className="p-8 pb-6 sticky top-0 bg-black/90 backdrop-blur-2xl z-50 border-b border-white/5">
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
                    <div className="mt-4 flex justify-end">
                       <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7-7 7" strokeWidth="2.5"/></svg>
                    </div>
                  </a>
                ))}
             </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-[10px] font-black uppercase text-white tracking-[0.4em]">Scripters Populares</h3>
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{filteredUsers.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-x-4 gap-y-8">
            {filteredUsers.map(acc => (
              <div 
                key={acc.profile.username} 
                onClick={() => onNavigateToProfile(acc.profile.username)} 
                className="flex flex-col items-center gap-2 cursor-pointer group animate-view"
              >
                <div className="relative w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden transition-transform group-active:scale-90 shadow-lg">
                  {acc.profile.avatar ? (
                    <img src={acc.profile.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-black text-2xl text-white opacity-40">{acc.profile.username.charAt(0).toUpperCase()}</span>
                  )}
                  {acc.profile.isAdmin && (
                    <div className="absolute top-0 right-0 p-1 bg-indigo-600 rounded-bl-lg">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center w-full px-1 overflow-hidden">
                  <span className="text-[8px] font-black text-white uppercase truncate w-full text-center flex items-center justify-center gap-0.5">
                    {acc.profile.displayName} {acc.profile.isVerified && <VerifiedBadge size="8" />}
                  </span>
                  <span className="text-[7px] font-bold text-gray-600 uppercase truncate w-full text-center">@{acc.profile.username}</span>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full py-10 text-center opacity-30 italic text-[10px] uppercase tracking-widest">
                Nenhum scripter encontrado.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-[10px] font-black uppercase text-white tracking-[0.4em]">Explorar Posts</h3>
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{filteredVideos.length}</span>
          </div>
          
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredVideos.map(video => (
                <div key={video.id} onClick={() => onNavigateToProfile(video.username)} className="aspect-[3/4] bg-white/5 rounded-3xl overflow-hidden relative group border border-white/5 cursor-pointer active:scale-95 transition-all shadow-xl">
                  <video src={video.url} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] font-black text-white truncate mb-1">@{video.username} {video.isVerified && <VerifiedBadge size="10" />}</p>
                    <p className="text-[8px] text-white/40 line-clamp-1">{video.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center">
               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="2"/></svg>
               </div>
               <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Nada postado ainda</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Discover;
