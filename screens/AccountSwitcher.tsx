
import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';
import { TrashIcon, SearchIcon } from '../components/Icons';

interface AccountSwitcherProps {
  accounts: UserProfile[];
  onSelect: (username: string) => void;
  onAddAccount: () => void;
  onDeleteAccount: (username: string) => void;
  onBack: () => void;
}

const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ accounts, onSelect, onAddAccount, onDeleteAccount, onBack }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return accounts.filter(acc => 
      acc.username.toLowerCase().includes(search.toLowerCase()) || 
      acc.displayName.toLowerCase().includes(search.toLowerCase())
    );
  }, [accounts, search]);

  return (
    <div className="h-full w-full bg-black flex flex-col p-8 animate-view overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase">Minhas Contas</h2>
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="Pesquisar contas logadas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-xs outline-none focus:border-white transition-all text-white"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
          <SearchIcon active />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
        {filtered.map((acc) => (
          <div 
            key={acc.username}
            className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-[2rem] transition-all group"
          >
            <div onClick={() => onSelect(acc.username)} className="flex flex-1 items-center gap-4 cursor-pointer">
              <div className={`w-14 h-14 rounded-[1.4rem] ${acc.isBanned ? 'bg-rose-900' : 'bg-indigo-600'} flex items-center justify-center border border-white/10 overflow-hidden shrink-0`}>
                 {acc.avatar ? <img src={acc.avatar} className="w-full h-full object-cover" alt="avatar" /> : <span className="text-xl font-black uppercase">{acc.displayName.charAt(0)}</span>}
              </div>
              <div className="flex-1">
                <p className="font-black text-sm flex items-center gap-2">
                  {acc.displayName}
                  {acc.isBanned && <span className="text-[7px] bg-rose-500 px-1.5 py-0.5 rounded uppercase">Ban</span>}
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">@{acc.username}</p>
              </div>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteAccount(acc.username); }}
              className="p-3 bg-rose-600/10 text-rose-500 rounded-2xl border border-rose-500/20 active:scale-90 transition-all"
            >
              <TrashIcon size="16" />
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-10 text-center opacity-30 italic text-sm">
            Nenhuma conta encontrada.
          </div>
        )}

        <button 
          onClick={onAddAccount}
          className="w-full flex items-center justify-center gap-3 p-6 border-2 border-dashed border-white/10 rounded-[2rem] hover:bg-white/5 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Adicionar Nova Conta</span>
        </button>
      </div>

      <p className="mt-8 text-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">CoreStream Account Manager</p>
    </div>
  );
};

export default AccountSwitcher;
