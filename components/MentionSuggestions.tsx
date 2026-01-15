
import React from 'react';
import { UserProfile } from '../types';
import { VerifiedBadge } from './Icons';

interface MentionSuggestionsProps {
  query: string;
  users: UserProfile[];
  onSelect: (username: string) => void;
}

const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({ query, users, onSelect }) => {
  if (!query) return null;

  const filtered = users.filter(u => 
    u.username.toLowerCase().includes(query.toLowerCase()) || 
    u.displayName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1a1a1c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[1000] animate-view">
      <div className="p-3 border-b border-white/5 bg-black/20">
        <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Sugeridos</p>
      </div>
      <div className="max-h-40 overflow-y-auto no-scrollbar">
        {filtered.map(user => (
          <div 
            key={user.username} 
            onClick={() => onSelect(user.username)}
            className="flex items-center gap-3 p-3 hover:bg-white/5 active:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-900 overflow-hidden shrink-0 border border-white/10">
              {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-[10px]">{user.username.charAt(0).toUpperCase()}</div>}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-black flex items-center gap-1 truncate">
                {user.displayName} {user.isVerified && <VerifiedBadge size="10" />}
              </p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">@{user.username}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentionSuggestions;
