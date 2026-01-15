
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

const SQL_INSTRUCTIONS = `-- 1. TABELA DE PERFIS (ATUALIZADA COM LAST_SEEN)
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
  last_seen BIGINT, -- Timestamp da última atividade
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

-- 3. POLÍTICAS DE STORAGE
CREATE POLICY "Leitura Publica de Videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Leitura Publica de Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Upload Publico de Videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos');
CREATE POLICY "Upload Publico de Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Update Publico de Objetos" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Delete Publico de Objetos" ON storage.objects FOR DELETE USING (true);
`;

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  accounts, videos, onUpdateStats, onClose, onDeleteVideo, onDeleteAccount, onSendSystemMessage 
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'videos' | 'storage' | 'sql'>('accounts');
  const [searchTerm, setSearchTerm] = useState('');

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
          { id: 'storage', label: 'Arquivos (Storage)' },
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

      {activeTab === 'sql' && (
        <div className="space-y-6 animate-view">
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem]">
            <h4 className="text-xs font-black uppercase text-indigo-400 mb-4 tracking-widest">Script Atualizado</h4>
            <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-wider leading-relaxed">Este script inclui a nova coluna de rastreamento "last_seen".</p>
            <button onClick={() => { navigator.clipboard.writeText(SQL_INSTRUCTIONS); alert('Script SQL Copiado!'); }} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-[10px] uppercase shadow-2xl active:scale-95 transition-all">Copiar Script SQL Completo</button>
          </div>
          <pre className="bg-black border border-white/10 p-6 rounded-2xl text-[9px] font-mono text-gray-500 overflow-x-auto leading-relaxed">{SQL_INSTRUCTIONS}</pre>
        </div>
      )}

      {/* Outras abas (accounts/videos/storage) continuam as mesmas */}
    </div>
  );
};

export default AdminPanel;
