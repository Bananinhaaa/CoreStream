
import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';
import { VerifiedBadge, CloseIcon, SearchIcon } from './Icons';

interface UserListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: UserProfile[];
  onUserClick: (username: string) => void;
  emptyMessage?: string;
  isPrivate?: boolean;
}

const UserListDrawer: React.FC<UserListDrawerProps> = ({
  isOpen, onClose, title, users, onUserClick, emptyMessage = "Nenhum usuário encontrado."
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    return users.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, users]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-md bg-[#0d0d0d] rounded-t-[2.5rem] h-[75vh] flex flex-col overflow-hidden animate-slide-up border-t border-white/5 shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">{title}</h3>
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter mt-1">
              {users.length} Conexões
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-6 pb-2">
            <div className="relative">
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar usuário..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-12 outline-none focus:border-white transition-all text-xs font-bold"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
                <SearchIcon active />
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {filteredUsers.length === 0 ? (
              <div className="py-20 text-center opacity-20 italic text-[10px] uppercase tracking-widest">
                {emptyMessage}
              </div>
            ) : (
              filteredUsers.map(u => (
                <div 
                  key={u.username} 
                  onClick={() => { onUserClick(u.username); onClose(); }}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-[1.8rem] border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-white/10">
                    {u.avatar ? (
                      <img src={u.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-xs">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black flex items-center gap-1 truncate">
                      {u.displayName}
                      {u.isVerified && <VerifiedBadge size="12" />}
                    </p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">@{u.username}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                     <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserListDrawer;
