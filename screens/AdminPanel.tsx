
import React, { useState, useMemo } from 'react';
import { Video, UserProfile } from '../types';
import { TrashIcon, SearchIcon, MessageIcon, VerifiedBadge } from '../components/Icons';
import { databaseService } from '../services/databaseService';

interface AdminPanelProps {
  accounts: any[];
  videos: Video[];
  onUpdateStats: (username: string, stats: any) => void;
  onUpdateVideoStats: (videoId: string, stats: any) => void;
  onDeleteVideo: (videoId: string) => void;
  onSendSystemMessage: (target: string | 'all', text: string) => void;
  onOpenSupport: () => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  accounts, videos, onUpdateStats, onUpdateVideoStats, onDeleteVideo, onSendSystemMessage, onOpenSupport, onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'staff' | 'videos' | 'system' | 'status'>('accounts');
  const [search, setSearch] = useState('');

  const isCloud = databaseService.isConnected();

  const filteredAccounts = useMemo(() => 
    accounts.filter(a => a.profile.username.toLowerCase().includes(search.toLowerCase()) || a.profile.displayName.toLowerCase().includes(search.toLowerCase())),
    [accounts, search]
  );

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden animate-view text-white">
      <header className="p-8 pb-4 flex justify-between items-center bg-zinc-950 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Painel Master</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isCloud ? 'bg-indigo-500 animate-pulse' : 'bg-amber-500'}`}></div>
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">
              {isCloud ? 'Convex Engine Ativo' : 'Modo Local (Aguardando Convex)'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-xl text-[9px] font-black uppercase">Sair</button>
      </header>

      <nav className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5 bg-zinc-950/50">
        {['accounts', 'videos', 'status'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === t ? 'bg-white text-black' : 'bg-white/5 text-gray-500'}`}>
            {t === 'accounts' ? 'Contas' : t === 'videos' ? 'Vídeos' : 'Status Rede'}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24 space-y-4 no-scrollbar">
        {activeTab === 'status' && (
          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 space-y-6">
            <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em]">Sincronização Reativa</h3>
            <div className="p-6 bg-black rounded-3xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-500">Engine</span>
                <span className="text-xs font-black">Convex.dev</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-500">Status</span>
                <span className={`text-xs font-black ${isCloud ? 'text-indigo-400' : 'text-amber-500'}`}>
                  {isCloud ? 'OPERACIONAL' : 'OFFLINE'}
                </span>
              </div>
              {!isCloud && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <p className="text-[9px] text-amber-200 italic leading-relaxed">
                    Para conectar ao Convex, adicione a variável <b>VITE_CONVEX_URL</b> no seu projeto Vercel. 
                    O Convex substituirá o Supabase com atualizações em tempo real instantâneas.
                  </p>
                </div>
              )}
            </div>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="w-full py-4 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase rounded-2xl"
            >
              Resetar Banco Local
            </button>
          </div>
        )}

        {activeTab === 'accounts' && filteredAccounts.map(acc => (
          <div key={acc.profile.username} className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center justify-between animate-view">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black uppercase">
                {acc.profile.username.charAt(0)}
              </div>
              <p className="text-xs font-black uppercase">@{acc.profile.username}</p>
            </div>
            <button onClick={() => onUpdateStats(acc.profile.username, { isVerified: !acc.profile.isVerified })} className="text-[8px] font-black uppercase text-indigo-400">Verificar</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
