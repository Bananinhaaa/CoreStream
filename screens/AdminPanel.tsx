
import React, { useState, useMemo } from 'react';
import { Video, UserProfile } from '../types';
import { TrashIcon, SearchIcon, MessageIcon, VerifiedBadge } from '../components/Icons';

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

const SQL_SCHEMA = `-- SCHEMA PARA SUPABASE (SINCRONIZAÇÃO TOTAL)
-- Execute no painel SQL do Supabase para garantir armazenamento entre dispositivos.

CREATE TABLE IF NOT EXISTS profiles (
  username TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  password TEXT,
  bio TEXT,
  avatar_url TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_total INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  is_support BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  profile_color TEXT DEFAULT '#000000',
  following_map JSONB DEFAULT '{}',
  reposted_ids TEXT[] DEFAULT '{}',
  notifications_json JSONB DEFAULT '[]',
  last_seen BIGINT
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  owner_username TEXT REFERENCES profiles(username) ON DELETE CASCADE,
  owner_display_name TEXT,
  owner_avatar TEXT,
  description TEXT,
  likes_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  music_name TEXT,
  owner_is_verified BOOLEAN DEFAULT false,
  comments_json JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);`;

const AdminAccountCard: React.FC<{ acc: any, onUpdate: any, onGoSupport: () => void }> = ({ acc, onUpdate, onGoSupport }) => {
  const [form, setForm] = useState({
    email: acc.email || '',
    password: acc.password || '',
    followers: acc.profile.followers || 0,
    likes: acc.profile.likes || 0,
    isVerified: !!acc.profile.isVerified,
    isAdmin: !!acc.profile.isAdmin,
    isSupport: !!acc.profile.isSupport,
    profileColor: acc.profile.profileColor || '#000000'
  });

  const handleSave = () => {
    onUpdate(acc.profile.username, form);
    alert(`Alterações salvas para @${acc.profile.username}! Sincronizado com a rede.`);
  };

  return (
    <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 space-y-5">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shadow-lg">
            {acc.profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black uppercase flex items-center gap-1">
              @{acc.profile.username} {form.isVerified && <VerifiedBadge size="14" />}
            </p>
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Dispositivo Sincronizado</p>
          </div>
        </div>
        <button onClick={onGoSupport} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 text-[9px] font-black uppercase tracking-widest">Suporte</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[7px] font-black uppercase text-gray-500 ml-1 tracking-widest">E-mail</label>
          <input type="text" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-white transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[7px] font-black uppercase text-gray-500 ml-1 tracking-widest">Senha</label>
          <input type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-white transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[7px] font-black uppercase text-gray-500 ml-1 tracking-widest">Seguidores</label>
          <input type="number" value={form.followers} onChange={e => setForm({...form, followers: parseInt(e.target.value) || 0})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[7px] font-black uppercase text-gray-500 ml-1 tracking-widest">Likes Totais</label>
          <input type="number" value={form.likes} onChange={e => setForm({...form, likes: parseInt(e.target.value) || 0})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none" />
        </div>
      </div>

      <div className="pt-2 flex flex-wrap gap-2">
        <button onClick={() => setForm({...form, isVerified: !form.isVerified})} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${form.isVerified ? 'bg-white text-black border-white shadow-xl' : 'bg-transparent text-gray-500 border-white/10'}`}>Verificado</button>
        <button onClick={() => setForm({...form, isAdmin: !form.isAdmin})} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${form.isAdmin ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'bg-transparent text-gray-500 border-white/10'}`}>Admin</button>
        <button onClick={() => setForm({...form, isSupport: !form.isSupport})} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${form.isSupport ? 'bg-rose-600 text-white border-rose-500 shadow-xl' : 'bg-transparent text-gray-500 border-white/10'}`}>Suporte</button>
        <div className="flex items-center gap-2 ml-auto bg-black rounded-xl px-3 border border-white/10">
          <span className="text-[7px] font-black uppercase text-gray-500">Perfil</span>
          <input type="color" value={form.profileColor} onChange={e => setForm({...form, profileColor: e.target.value})} className="w-6 h-6 bg-transparent border-none cursor-pointer" />
        </div>
      </div>

      <button onClick={handleSave} className="w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Salvar e Sincronizar</button>
    </div>
  );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  accounts, videos, onUpdateStats, onUpdateVideoStats, onDeleteVideo, onSendSystemMessage, onOpenSupport, onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'staff' | 'videos' | 'system' | 'sql'>('accounts');
  const [search, setSearch] = useState('');
  const [sysMsg, setSysMsg] = useState('');
  const [sysTarget, setSysTarget] = useState<'all' | string>('all');

  const filteredAccounts = useMemo(() => 
    accounts.filter(a => a.profile.username.toLowerCase().includes(search.toLowerCase()) || a.profile.displayName.toLowerCase().includes(search.toLowerCase())),
    [accounts, search]
  );

  const staffList = useMemo(() => 
    accounts.filter(a => a.profile.isAdmin || a.profile.isSupport),
    [accounts]
  );

  const filteredVideos = useMemo(() => 
    videos.filter(v => v.username.toLowerCase().includes(search.toLowerCase())),
    [videos, search]
  );

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden animate-view text-white">
      <header className="p-8 pb-4 flex justify-between items-center bg-zinc-950 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Painel Master</h2>
          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.5em]">Central de Controle e Identificação</p>
        </div>
        <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-xl text-[9px] font-black uppercase">Voltar</button>
      </header>

      <nav className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5 bg-zinc-950/50">
        {['accounts', 'staff', 'videos', 'system', 'sql'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === t ? 'bg-white text-black' : 'bg-white/5 text-gray-500'}`}>
            {t === 'accounts' ? 'Contas' : t === 'staff' ? 'Equipe' : t === 'videos' ? 'Vídeos' : t === 'system' ? 'Broadcast' : 'SQL Sinc'}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24 space-y-4 no-scrollbar">
        {['accounts', 'staff', 'videos'].includes(activeTab) && (
          <div className="relative mb-6">
            <input type="text" placeholder="Pesquisar scripters, equipe ou vídeos..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 text-xs outline-none focus:border-white transition-all" />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30"><SearchIcon active /></div>
          </div>
        )}

        {activeTab === 'accounts' && filteredAccounts.map(acc => (
          <AdminAccountCard key={acc.profile.username} acc={acc} onUpdate={onUpdateStats} onGoSupport={onOpenSupport} />
        ))}

        {activeTab === 'staff' && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] ml-2">Membros da Staff ({staffList.length})</h3>
            {staffList.map(acc => (
              <div key={acc.profile.username} className="bg-white/5 p-4 rounded-[2rem] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black ${acc.profile.isAdmin ? 'bg-white text-black' : 'bg-indigo-600'}`}>
                    {acc.profile.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-black">@{acc.profile.username}</p>
                    <div className="flex gap-1.5 mt-1">
                      {acc.profile.isAdmin && <span className="text-[6px] font-black bg-white text-black px-1.5 py-0.5 rounded uppercase">Admin</span>}
                      {acc.profile.isSupport && <span className="text-[6px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase">Suporte</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => {setSearch(acc.profile.username); setActiveTab('accounts');}} className="text-[8px] font-black uppercase text-indigo-400 border border-indigo-400/20 px-3 py-1.5 rounded-lg">Gerenciar</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'videos' && filteredVideos.map(v => (
          <div key={v.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 flex gap-4 items-center">
            <video src={v.url} className="w-16 h-24 rounded-2xl object-cover bg-zinc-900" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black uppercase text-indigo-300 tracking-widest">@{v.username}</p>
                <button onClick={() => {if(confirm('Excluir este pulso permanentemente?')) onDeleteVideo(v.id)}} className="p-2 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20"><TrashIcon size="12" /></button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-1">
                  <span className="text-[6px] text-gray-600 font-black uppercase ml-1">Likes</span>
                  <input type="number" defaultValue={v.likes} onBlur={e => onUpdateVideoStats(v.id, { likes: parseInt(e.target.value) || 0 })} className="w-full bg-black border border-white/10 rounded-lg p-1.5 text-[10px] outline-none" />
                </div>
                <div className="space-y-1">
                  <span className="text-[6px] text-gray-600 font-black uppercase ml-1">Views</span>
                  <input type="number" defaultValue={v.views} onBlur={e => onUpdateVideoStats(v.id, { views: parseInt(e.target.value) || 0 })} className="w-full bg-black border border-white/10 rounded-lg p-1.5 text-[10px] outline-none" />
                </div>
                <div className="space-y-1">
                  <span className="text-[6px] text-gray-600 font-black uppercase ml-1">Reposts</span>
                  <input type="number" defaultValue={v.reposts} onBlur={e => onUpdateVideoStats(v.id, { reposts: parseInt(e.target.value) || 0 })} className="w-full bg-black border border-white/10 rounded-lg p-1.5 text-[10px] outline-none" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {activeTab === 'system' && (
          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 space-y-6">
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20"><MessageIcon active /></div>
              <h3 className="text-xs font-black uppercase text-white tracking-[0.2em]">Broadcast do Sistema</h3>
            </div>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-gray-600 ml-1">Para quem?</label>
                <select value={sysTarget} onChange={e => setSysTarget(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-black outline-none focus:border-white transition-all">
                  <option value="all">TODOS OS DISPOSITIVOS</option>
                  {accounts.map(a => <option key={a.profile.username} value={a.profile.username}>@{a.profile.username}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-gray-600 ml-1">Mensagem Oficial</label>
                <textarea placeholder="Digite o comunicado..." value={sysMsg} onChange={e => setSysMsg(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm h-44 outline-none focus:border-white transition-all" />
              </div>
              <button onClick={() => { onSendSystemMessage(sysTarget, sysMsg); setSysMsg(''); alert('Mensagem enviada com sucesso!'); }} className="w-full bg-indigo-600 h-16 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Enviar Broadcast</button>
            </div>
          </div>
        )}

        {activeTab === 'sql' && (
          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
               <div>
                 <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em]">Database Sincronização</h3>
                 <p className="text-[7px] text-gray-600 font-bold uppercase mt-1">Garantir acesso universal da conta</p>
               </div>
               <button onClick={() => {navigator.clipboard.writeText(SQL_SCHEMA); alert('SQL Copiado!');}} className="p-3 bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10">Copiar SQL</button>
            </div>
            <pre className="bg-black p-6 rounded-3xl text-[9px] text-indigo-300 border border-white/5 overflow-x-auto font-mono leading-relaxed max-h-[500px]">
              {SQL_SCHEMA}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
