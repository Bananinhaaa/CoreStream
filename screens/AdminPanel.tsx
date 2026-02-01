
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
  const [activeTab, setActiveTab] = useState<'accounts' | 'videos' | 'status'>('status');
  const [search, setSearch] = useState('');

  const isConnected = databaseService.isConnected();
  const currentUrl = databaseService.getConvexUrl();

  const filteredAccounts = useMemo(() => 
    accounts.filter(a => a.profile.username.toLowerCase().includes(search.toLowerCase()) || a.profile.displayName.toLowerCase().includes(search.toLowerCase())),
    [accounts, search]
  );

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden animate-view text-white">
      <header className="p-8 pb-4 flex justify-between items-center bg-zinc-950 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">COMANDO CENTRAL</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-amber-500 animate-pulse'}`}></div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">
              {isConnected ? 'SISTEMA ONLINE' : 'MODO LOCAL (OFFLINE)'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all">Voltar</button>
      </header>

      <nav className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5 bg-zinc-950/50">
        {['status', 'accounts', 'videos'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === t ? 'bg-white text-black shadow-md' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
            {t === 'status' ? 'Configuração' : t === 'accounts' ? 'Membros' : 'Conteúdo'}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24 space-y-4 no-scrollbar">
        {activeTab === 'status' && (
          <div className="animate-view space-y-6">
            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 space-y-6">
              <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em]">Status da Infraestrutura</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase text-gray-500">URL Detectada</span>
                  <span className="text-[10px] font-mono text-indigo-300 truncate max-w-[180px]">{currentUrl || 'NENHUMA'}</span>
                </div>
                
                <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase text-gray-500">Persistência</span>
                  <span className={`text-[10px] font-black ${isConnected ? 'text-green-400' : 'text-amber-500'}`}>
                    {isConnected ? 'CLOUD (CONVEX)' : 'LOCAL STORAGE'}
                  </span>
                </div>
              </div>

              {!isConnected && (
                <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-3xl space-y-4">
                  <p className="text-[10px] font-black uppercase text-indigo-300">Como conectar o Backend:</p>
                  <ol className="text-[11px] space-y-3 text-gray-300">
                    <li className="flex gap-2"><span className="text-white font-black">1.</span> Vá em <a href="https://convex.dev" className="text-white underline">convex.dev</a> e crie um projeto.</li>
                    <li className="flex gap-2"><span className="text-white font-black">2.</span> Copie a <b>Deployment URL</b>.</li>
                    <li className="flex gap-2"><span className="text-white font-black">3.</span> Na Vercel, adicione a variável: <br/> <code className="bg-black/50 px-2 py-1 rounded text-indigo-400">VITE_CONVEX_URL</code></li>
                    <li className="flex gap-2"><span className="text-white font-black">4.</span> Re-implante (Redeploy) na Vercel.</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="bg-rose-500/5 border border-rose-500/10 p-8 rounded-[3rem] space-y-4">
               <h3 className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em]">Zona de Perigo</h3>
               <button 
                onClick={() => { if(confirm('Isso apagará todas as contas e vídeos locais. Continuar?')) { localStorage.clear(); window.location.reload(); } }}
                className="w-full py-5 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase rounded-3xl hover:bg-rose-500 hover:text-white transition-all"
              >
                Limpar Cache Local e Resetar App
              </button>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="animate-view space-y-3">
             <div className="relative mb-6">
                <input type="text" placeholder="Buscar scripter..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-xs outline-none" />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30"><SearchIcon active /></div>
             </div>
             {filteredAccounts.map(acc => (
              <div key={acc.profile.username} className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-xs font-black">
                    {acc.profile.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-black">@{acc.profile.username}</p>
                    <p className="text-[8px] text-gray-500 uppercase font-bold">{acc.profile.isVerified ? 'Verificado' : 'Normal'}</p>
                  </div>
                </div>
                <button onClick={() => onUpdateStats(acc.profile.username, { isVerified: !acc.profile.isVerified })} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${acc.profile.isVerified ? 'bg-indigo-600 text-white' : 'border border-white/10 text-gray-400'}`}>
                  {acc.profile.isVerified ? 'Remover Selo' : 'Verificar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
