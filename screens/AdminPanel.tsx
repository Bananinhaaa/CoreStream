
import React, { useState, useMemo } from 'react';
import { UserProfile, Video } from '../types';
import { formatNumber } from '../utils/formatters';

interface AdminPanelProps {
  accounts: any[];
  videos: Video[];
  onUpdateStats: (username: string, stats: Partial<UserProfile> & { password?: string, email?: string }) => void;
  onUpdateVideoStats: (videoId: string, stats: Partial<Video>) => void;
  onDeleteAccount: (username: string, reason?: string) => void;
  onSendSystemMessage: (target: string | 'all', text: string) => void;
  onTransferVideo: (videoId: string, targetUsername: string) => void;
  onClose: () => void;
}

const SQL_INSTRUCTIONS = `-- SCRIPT DE CONFIGURAÇÃO DO SUPABASE
-- Execute este código no SQL Editor do seu projeto Supabase

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Vídeos
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  owner_username TEXT,
  description TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  music_name TEXT DEFAULT 'Original Audio',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Interações
CREATE TABLE IF NOT EXISTS public.likes (
  user_id UUID REFERENCES public.profiles(id),
  video_id UUID REFERENCES public.videos(id),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.reposts (
  user_id UUID REFERENCES public.profiles(id),
  video_id UUID REFERENCES public.videos(id),
  custom_caption TEXT,
  PRIMARY KEY (user_id, video_id)
);`;

const AdminPanel: React.FC<AdminPanelProps> = ({ accounts, videos, onUpdateStats, onClose, onUpdateVideoStats, onDeleteAccount, onSendSystemMessage, onTransferVideo }) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'videos' | 'messages' | 'sql'>('accounts');
  const [accountSearch, setAccountSearch] = useState('');

  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) return accounts;
    return accounts.filter(acc => 
      acc.profile.username.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.profile.displayName.toLowerCase().includes(accountSearch.toLowerCase())
    );
  }, [accounts, accountSearch]);

  const copySql = () => {
    navigator.clipboard.writeText(SQL_INSTRUCTIONS).then(() => {
      alert("Código SQL copiado com sucesso! Agora vá ao Supabase e cole no SQL Editor.");
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      alert("Erro ao copiar automaticamente. Selecione o texto manualmente abaixo.");
    });
  };

  return (
    <div className="h-full w-full bg-black p-6 overflow-y-auto no-scrollbar pb-24 text-white animate-view">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">AdminPanel</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Controle do Ecossistema</p>
        </div>
        <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">Sair</button>
      </header>

      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('accounts')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'accounts' ? 'bg-white text-black' : 'bg-white/5 text-gray-500 border border-white/5'}`}>Usuários</button>
        <button onClick={() => setActiveTab('videos')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'videos' ? 'bg-white text-black' : 'bg-white/5 text-gray-500 border border-white/5'}`}>Vídeos</button>
        <button onClick={() => setActiveTab('sql')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'sql' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'}`}>Config SQL 🛠️</button>
      </div>

      {activeTab === 'sql' && (
        <div className="space-y-6 animate-view">
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all" />
            <h4 className="text-xs font-black uppercase mb-4 text-indigo-400 tracking-widest">Criação do Banco de Dados</h4>
            <p className="text-sm text-gray-400 leading-relaxed mb-8 italic">
              Este script cria as tabelas de **Perfis**, **Vídeos**, **Curtidas** e **Republicações** no seu Supabase.
            </p>
            <button 
              onClick={copySql} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95"
            >
              Copiar Script Agora
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute top-4 right-4 text-[8px] font-black text-white/20 uppercase tracking-widest">Visualização do Código</div>
            <pre className="bg-[#050505] border border-white/10 p-8 rounded-[2rem] text-[10px] font-mono text-gray-500 overflow-x-auto leading-relaxed">
              {SQL_INSTRUCTIONS}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <input type="text" placeholder="Filtrar contas..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm mb-6 outline-none focus:border-white transition-all" />
          {filteredAccounts.map(acc => (
            <div key={acc.profile.username} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center font-black overflow-hidden border border-white/5">
                  {acc.profile.avatar ? <img src={acc.profile.avatar} className="w-full h-full object-cover" /> : acc.profile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-sm">{acc.profile.displayName}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">@{acc.profile.username}</p>
                </div>
              </div>
              <button className="text-[9px] font-black uppercase bg-white/5 hover:bg-white text-gray-400 hover:text-black px-5 py-2.5 rounded-xl transition-all">Gerenciar</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 gap-4">
          {videos.map(v => (
            <div key={v.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex gap-5 items-center">
              <div className="w-16 h-24 bg-zinc-800 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                <video src={v.url} className="w-full h-full object-cover opacity-50" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black uppercase text-white truncate mb-1">{v.description || 'Sem descrição'}</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Dono: @{v.username}</p>
                <div className="flex gap-4 mt-3">
                   <span className="text-[8px] font-black text-indigo-400 uppercase">❤️ {formatNumber(v.likes)}</span>
                   <span className="text-[8px] font-black text-gray-500 uppercase">💬 {formatNumber(v.comments.length)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
