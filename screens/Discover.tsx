
import React, { useState, useMemo, useEffect } from 'react';
import { Video, UserProfile } from '../types';
import { getTrendingNews } from '../services/geminiService';

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

  const communityVideos = useMemo(() => {
    if (!searchTerm.trim()) return videos;
    return videos.filter(v => 
      v.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, videos]);

  return (
    <div className="h-full animate-view overflow-y-auto no-scrollbar pb-24 bg-black">
      <header className="p-8 pb-6 sticky top-0 bg-black/90 backdrop-blur-2xl z-50">
        <h2 className="text-3xl font-black mb-6 tracking-tighter italic uppercase">Explore</h2>
        <div className="relative">
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar scripters, tags..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-14 outline-none focus:border-white transition-all text-sm font-semibold"
          />
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </header>

      <div className="px-6 space-y-12 mt-4">
        {/* Trending Section powered by Google Search Grounding */}
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
            <h3 className="text-[10px] font-black uppercase text-white tracking-[0.4em]">Explorar Vídeos</h3>
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{communityVideos.length} Posts</span>
          </div>
          
          {communityVideos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {communityVideos.map(video => (
                <div key={video.id} onClick={() => onNavigateToProfile(video.username)} className="aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden relative group border border-white/5 cursor-pointer active:scale-95 transition-all">
                  <video src={video.url} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] font-black text-white truncate mb-1">@{video.username}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center bg-white/5 rounded-3xl border border-white/10">
               <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em]">Nenhum vídeo</p>
            </div>
          )}
        </section>

        <section className="pb-16 px-1">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.4em]">Scripters Populares</h3>
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{allAccounts.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-x-4 gap-y-8">
            {allAccounts.map(acc => (
              <div key={acc.profile.username} onClick={() => onNavigateToProfile(acc.profile.username)} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden transition-transform group-active:scale-90">
                  {acc.profile.avatar ? <img src={acc.profile.avatar} className="w-full h-full object-cover" /> : <span className="font-black text-xl text-white">{acc.profile.username.charAt(0).toUpperCase()}</span>}
                </div>
                <span className="text-[8px] font-black text-gray-500 uppercase truncate w-full text-center">@{acc.profile.username}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Discover;
