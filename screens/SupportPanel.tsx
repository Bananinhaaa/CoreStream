
import React, { useState, useMemo } from 'react';
import { Video } from '../types';
import { TrashIcon, SearchIcon } from '../components/Icons';

interface SupportPanelProps {
  accounts: any[];
  videos: Video[];
  onUpdateStats: (username: string, stats: any) => void;
  onDeleteVideo: (videoId: string) => void;
  onClose: () => void;
}

const SupportPanel: React.FC<SupportPanelProps> = ({ accounts, videos, onUpdateStats, onDeleteVideo, onClose }) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'videos'>('accounts');
  const [search, setSearch] = useState('');

  const filteredAccounts = useMemo(() => 
    accounts.filter(a => a.profile.username.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())),
    [accounts, search]
  );

  const filteredVideos = useMemo(() => 
    videos.filter(v => v.username.toLowerCase().includes(search.toLowerCase()) || v.description.toLowerCase().includes(search.toLowerCase())),
    [videos, search]
  );

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden animate-view text-white">
      <header className="p-8 pb-4 flex justify-between items-center bg-zinc-950 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Painel Suporte</h2>
          <p className="text-[8px] font-black text-rose-400 uppercase tracking-[0.4em]">Core Moderation & Helpdesk</p>
        </div>
        <button onClick={onClose} className="bg-white/10 p-3 rounded-xl border border-white/10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" strokeLinecap="round"/></svg></button>
      </header>

      <nav className="p-6 flex gap-2 bg-zinc-950/30">
        <button onClick={() => setActiveTab('accounts')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'accounts' ? 'bg-white text-black' : 'bg-white/5 text-gray-500'}`}>Contas</button>
        <button onClick={() => setActiveTab('videos')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'videos' ? 'bg-white text-black' : 'bg-white/5 text-gray-500'}`}>Vídeos</button>
      </nav>

      <div className="px-6 mt-4">
        <div className="relative">
          <input type="text" placeholder="Localizar scripter..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 text-xs outline-none focus:border-white transition-all font-bold" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30"><SearchIcon active /></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4 no-scrollbar mt-4">
        {activeTab === 'accounts' ? (
          filteredAccounts.map(acc => (
            <div key={acc.profile.username} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-5 animate-view">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black">{acc.profile.username.charAt(0).toUpperCase()}</div>
                  <p className="text-xs font-black">@{acc.profile.username}</p>
                </div>
                <button 
                  onClick={() => onUpdateStats(acc.profile.username, { isBanned: !acc.profile.isBanned })} 
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${acc.profile.isBanned ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-rose-600 text-white border-rose-500'}`}
                >
                  {acc.profile.isBanned ? 'Desbanir' : 'Banir'}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-gray-600 ml-1">Troca de Identificação (E-mail)</label>
                  <input type="text" defaultValue={acc.email} onBlur={e => onUpdateStats(acc.profile.username, { email: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] outline-none focus:border-white transition-all" placeholder="Novo Email" />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-gray-600 ml-1">Redefinir Senha</label>
                  <input type="text" defaultValue={acc.password} onBlur={e => onUpdateStats(acc.profile.username, { password: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] outline-none focus:border-white transition-all" placeholder="Nova Senha" />
                </div>
              </div>
              <p className="text-[7px] text-center text-gray-700 font-black uppercase tracking-widest italic">Ações de Suporte são registradas no Log do Sistema</p>
            </div>
          ))
        ) : (
          filteredVideos.map(v => (
            <div key={v.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 flex gap-4 items-center animate-view">
              <video src={v.url} className="w-16 h-16 rounded-2xl object-cover bg-zinc-900 shadow-lg" />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">@{v.username}</p>
                <p className="text-[8px] text-gray-600 font-bold truncate mt-0.5">{v.description || 'Sem descrição'}</p>
                <button onClick={() => {if(confirm('Remover este vídeo permanentemente?')) onDeleteVideo(v.id)}} className="mt-3 text-rose-500 text-[8px] font-black uppercase flex items-center gap-1.5 hover:underline"><TrashIcon size="10" /> Deletar Pulso</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupportPanel;
