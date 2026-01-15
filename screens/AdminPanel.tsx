
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

const SQL_INSTRUCTIONS = `-- 1. TABELA DE PERFIS
CREATE TABLE IF NOT EXISTS public.profiles (
  username TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  avatar_url TEXT,
  bio TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_total INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  profile_color TEXT,
  following_map JSONB DEFAULT '{}',
  reposted_ids TEXT[] DEFAULT '{}',
  notifications_json JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABELA DE VÍDEOS
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  owner_username TEXT REFERENCES public.profiles(username) ON DELETE CASCADE,
  owner_display_name TEXT,
  owner_avatar TEXT,
  description TEXT,
  likes_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  music_name TEXT,
  owner_is_verified BOOLEAN DEFAULT false,
  comments_json JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. POLÍTICAS DE STORAGE (Execute isto após criar os Buckets 'videos' e 'avatars')
-- Permite leitura pública
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('videos', 'avatars'));
-- Permite upload para todos (Em produção, limite para usuários autenticados)
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('videos', 'avatars'));
`;

const AccountAdminCard: React.FC<{ acc: any, onUpdate: any, onDelete: any }> = ({ acc, onUpdate, onDelete }) => {
  const [localData, setLocalData] = useState({
    email: acc.email || '',
    password: acc.password || '',
    followers: acc.profile.followers || 0,
    likes: acc.profile.likes || 0,
    profileColor: acc.profile.profileColor || '#000000',
    isVerified: acc.profile.isVerified || false,
    isAdmin: acc.profile.isAdmin || false,
    isBanned: acc.profile.isBanned || false
  });

  const handleApply = () => {
    onUpdate(acc.profile.username, localData);
    alert(`Alterações aplicadas para @${acc.profile.username}`);
  };

  return (
    <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 animate-view">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center font-black overflow-hidden border border-white/5">
            {acc.profile.avatar ? <img src={acc.profile.avatar} className="w-full h-full object-cover" /> : acc.profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-black text-sm flex items-center gap-1">
              {acc.profile.displayName} {localData.isVerified && <VerifiedBadge size="14" />}
            </p>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">@{acc.profile.username}</p>
          </div>
        </div>
        <button onClick={() => onDelete(acc.profile.username)} className="text-rose-500 p-2 bg-rose-500/10 rounded-xl active:scale-90 transition-all">
          <TrashIcon size="20" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="space-y-1">
           <label className="text-[8px] font-black text-gray-500 uppercase ml-1">E-mail</label>
           <input 
             type="text" 
             value={localData.email} 
             onChange={e => setLocalData({ ...localData, email: e.target.value })}
             className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] outline-none focus:border-white text-white"
           />
         </div>
         <div className="space-y-1">
           <label className="text-[8px] font-black text-gray-500 uppercase ml-1">Senha</label>
           <input 
             type="text" 
             value={localData.password} 
             onChange={e => setLocalData({ ...localData, password: e.target.value })}
             className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] outline-none focus:border-white text-white"
           />
         </div>
         <div className="space-y-1">
           <label className="text-[8px] font-black text-gray-500 uppercase ml-1">Seguidores</label>
           <input 
             type="number" 
             value={localData.followers} 
             onChange={e => setLocalData({ ...localData, followers: parseInt(e.target.value) || 0 })}
             className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] outline-none focus:border-white text-white"
           />
         </div>
         <div className="space-y-1">
           <label className="text-[8px] font-black text-gray-500 uppercase ml-1">Likes Totais</label>
           <input 
             type="number" 
             value={localData.likes} 
             onChange={e => setLocalData({ ...localData, likes: parseInt(e.target.value) || 0 })}
             className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] outline-none focus:border-white text-white"
           />
         </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button 
          onClick={() => setLocalData({ ...localData, isVerified: !localData.isVerified })} 
          className={`text-[8px] font-black uppercase py-3 rounded-xl border transition-all ${localData.isVerified ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-gray-500'}`}
        >
          Verificado
        </button>
        <button 
          onClick={() => setLocalData({ ...localData, isAdmin: !localData.isAdmin })} 
          className={`text-[8px] font-black uppercase py-3 rounded-xl border transition-all ${localData.isAdmin ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
        >
          Admin
        </button>
        <button 
          onClick={() => setLocalData({ ...localData, isBanned: !localData.isBanned })} 
          className={`text-[8px] font-black uppercase py-3 rounded-xl border transition-all ${localData.isBanned ? 'bg-rose-600 text-white border-rose-600' : 'bg-white/5 border-white/10 text-gray-500'}`}
        >
          {localData.isBanned ? 'Desbanir' : 'Banir'}
        </button>
      </div>

      <button 
        onClick={handleApply}
        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
      >
        Aplicar Alterações
      </button>
    </div>
  );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  accounts, videos, onUpdateStats, onClose, onDeleteVideo, onDeleteAccount, onSendSystemMessage 
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'videos' | 'messages' | 'sql'>('accounts');
  const [searchTerm, setSearchTerm] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [sysMsg, setSysMsg] = useState({ target: 'all', text: '' });

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => 
      acc.profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.profile.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  const filteredMsgRecipients = useMemo(() => {
    return accounts.filter(acc => 
      acc.profile.username.toLowerCase().includes(msgSearch.toLowerCase()) ||
      acc.profile.displayName.toLowerCase().includes(msgSearch.toLowerCase())
    );
  }, [accounts, msgSearch]);

  const handleSendSysMsg = () => {
    if (!sysMsg.text.trim()) return;
    onSendSystemMessage(sysMsg.target, sysMsg.text);
    alert('Mensagem enviada com sucesso!');
    setSysMsg({ ...sysMsg, text: '' });
  };

  return (
    <div className="h-full w-full bg-black p-6 overflow-y-auto no-scrollbar pb-24 text-white animate-view">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">Painel CORE</h2>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Moderação de Pulso</p>
        </div>
        <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">Sair</button>
      </header>

      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar border-b border-white/5 pb-4">
        {[
          { id: 'accounts', label: 'Usuários' },
          { id: 'videos', label: 'Vídeos' },
          { id: 'messages', label: 'Notificações' },
          { id: 'sql', label: 'Configuração' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-black' : 'bg-white/5 text-gray-500 border border-white/5'}`}
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
              placeholder="Pesquisar scripter..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-14 text-sm outline-none focus:border-white transition-all text-white placeholder:text-gray-700 font-bold" 
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30">
              <SearchIcon active />
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredAccounts.map(acc => (
              <AccountAdminCard 
                key={acc.profile.username} 
                acc={acc} 
                onUpdate={onUpdateStats} 
                onDelete={onDeleteAccount} 
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map(v => (
            <div key={v.id} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex gap-5 items-center">
              <div className="w-16 h-24 bg-zinc-800 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                <video src={v.url} className="w-full h-full object-cover opacity-50" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black uppercase text-white truncate mb-1">{v.description || 'Pulso sem texto'}</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">@{v.username}</p>
                <button onClick={() => onDeleteVideo(v.id)} className="mt-4 text-rose-500 text-[8px] font-black uppercase active:scale-95 transition-all">Excluir Post</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sql' && (
        <div className="space-y-6">
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem]">
            <h4 className="text-xs font-black uppercase text-indigo-400 mb-4 tracking-widest">Sincronização Cloud</h4>
            <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-wider leading-relaxed">Instruções: Crie os buckets 'videos' e 'avatars' no Storage como PUBLIC antes de rodar o SQL.</p>
            <button onClick={() => { navigator.clipboard.writeText(SQL_INSTRUCTIONS); alert('Script SQL Copiado!'); }} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-[10px] uppercase shadow-2xl active:scale-95 transition-all tracking-[0.2em]">Copiar Script SQL</button>
          </div>
          <pre className="bg-black border border-white/10 p-6 rounded-2xl text-[9px] font-mono text-gray-500 overflow-x-auto leading-relaxed">{SQL_INSTRUCTIONS}</pre>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
