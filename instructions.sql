
-- SCRIPT DE INFRAESTRUTURA CORESTREAM
-- Este script cria as tabelas necessárias para que a conta funcione em qualquer dispositivo.

-- 1. Tabela de Perfis (Contas)
CREATE TABLE IF NOT EXISTS profiles (
  username TEXT PRIMARY KEY,           -- Identificador único (ID da conta)
  display_name TEXT NOT NULL,          -- Nome que aparece no perfil
  email TEXT UNIQUE NOT NULL,          -- E-mail para login
  password TEXT NOT NULL,              -- Senha (identificação)
  bio TEXT DEFAULT '',                 -- Biografia
  avatar_url TEXT,                     -- Foto de perfil sincronizada
  followers_count INTEGER DEFAULT 0,    -- Total de seguidores
  following_count INTEGER DEFAULT 0,    -- Total de quem a conta segue
  likes_total INTEGER DEFAULT 0,       -- Total de curtidas recebidas
  is_verified BOOLEAN DEFAULT false,   -- Selo de verificado
  is_admin BOOLEAN DEFAULT false,      -- Permissão de Admin
  is_support BOOLEAN DEFAULT false,    -- Permissão de Suporte
  is_banned BOOLEAN DEFAULT false,     -- Status de banimento
  profile_color TEXT DEFAULT '#000000',-- Cor de fundo do perfil
  following_map JSONB DEFAULT '{}',    -- Mapa de quem esta conta segue (Sincronização de rede)
  reposted_ids TEXT[] DEFAULT '{}',    -- Lista de IDs de vídeos republicados
  notifications_json JSONB DEFAULT '[]',-- Inbox sincronizado
  last_seen BIGINT,                    -- Status online/offline
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Tabela de Vídeos (Pulsos)
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,                 -- ID único do vídeo
  url TEXT NOT NULL,                   -- Link da mídia (Storage)
  owner_username TEXT REFERENCES profiles(username) ON DELETE CASCADE,
  owner_display_name TEXT,
  owner_avatar TEXT,
  description TEXT,
  likes_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  music_name TEXT DEFAULT 'Original Audio',
  owner_is_verified BOOLEAN DEFAULT false,
  comments_json JSONB DEFAULT '[]',    -- Comentários sincronizados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Habilitar Realtime (Opcional no Dashboard do Supabase)
-- No Supabase, vá em Database > Replication e ative as tabelas 'profiles' e 'videos'.
