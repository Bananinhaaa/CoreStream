
import React, { useState, useMemo } from 'react';
import { UserProfile, Video } from '../types';
import { formatNumber } from '../utils/formatters';
import { TrashIcon, VerifiedBadge, SearchIcon } from '../components/Icons';

interface AdminPanelProps {
  accounts: any[];
  videos: Video[];
  onUpdateStats: (username: string, stats: Partial<UserProfile> & { password?: string, email?: string }) => void;
  onUpdateVideoStats: (videoId: string, stats: Partial<Video>) => void;
  onDeleteAccount: (username: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onSendSystemMessage: (target: string | 'all', text: string) => void;
  onClose: () => void;
}

const AccountAdminCard: React.FC<{ acc: any, onUpdate: any }> = ({ acc, onUpdate }) => {
  const [localColor, setLocalColor] = useState(acc.profile.profileColor || '#000000');
  const [localFollowers, setLocalFollowers] = useState(acc.profile.followers || 0);

  const handleApply = () => {
    onUpdate(acc.profile.username, { 
      profileColor: localColor,
      followers: localFollowers
    });
    alert(`Cor aplicada para @${acc.profile.username}!`);
  };

  return (
    <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col gap-4 animate-view">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black">
          {acc.profile.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-black">@{acc.profile.username}</p>
          <p className="text-[9px] text-gray-500 uppercase font-bold">{acc.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-gray-500 ml-1">Cor do Perfil</label>
            <input 
              type="color" 
              value={localColor} 
              onChange={e => setLocalColor(e.target.value)} 
              className="w-full h-10 bg-black border border-white/10 rounded-xl cursor-pointer" 
            />
         </div>
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-gray-500 ml-1">Seguidores</label>
            <input 
              type="number" 
              value={localFollowers} 
              onChange={e => setLocalFollowers(parseInt(e.target.value) || 0)} 
              className="w-full h-10 bg-black border border-white/10 rounded-xl px-3 text-xs outline-none" 
            />
         </div>
      </div>

      <button 
        onClick={handleApply}
        className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
      >
        Sincronizar Perfil
      </button>
    </div>
  );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  accounts, videos, onUpdateStats, onClose, onDeleteVideo, onDeleteAccount, onSendSystemMessage 
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'videos' | 'storage' | 'sql'>('accounts');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => 
      acc.profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.profile.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  return (
    <div className="h-full w-full bg-black p-6 overflow-y-auto no-scrollbar pb-24 text-white animate-view">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">Painel CORE</h2>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Controle Total</p>
        </div>
        <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-xl">Sair</button>
      </header>

      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar border-b border-white/5 pb-4">
        {[
          { id: 'accounts', label: 'Usuários' },
          { id: 'videos', label: 'Vídeos' },
          { id: 'storage', label: 'Arquivos' },
          { id: 'sql', label: 'Script SQL' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-black' : 'bg-white/5 text-gray-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'accounts' && (
        <div className="space-y-6">
           <div className="relative">
              <input 
                type="text" 
                placeholder="Pesquisar por username..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-sm outline-none"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
                <SearchIcon active />
              </div>
           </div>
           
           <div className="space-y-4">
              {filteredAccounts.map(acc => (
                <AccountAdminCard key={acc.profile.username} acc={acc} onUpdate={onUpdateStats} />
              ))}
           </div>
        </div>
      )}

      {/* Outras abas permanecem as mesmas */}
    </div>
  );
};

export default AdminPanel;
