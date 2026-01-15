
import React from 'react';

export const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-7 h-7 transition-all ${active ? 'text-white scale-110' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

export const SearchIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-7 h-7 transition-all ${active ? 'text-white scale-110' : 'text-gray-600'}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

export const PlusIcon = () => (
  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MessageIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-7 h-7 transition-all ${active ? 'text-white scale-110' : 'text-gray-600'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
  </svg>
);

export const UserIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-7 h-7 transition-all ${active ? 'text-white scale-110' : 'text-gray-600'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const HeartIcon = ({ liked }: { liked: boolean }) => (
  <svg className={`w-8 h-8 transition-all ${liked ? 'text-rose-500 scale-110' : 'text-white drop-shadow-lg'}`} fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

export const VerifiedBadge = ({ size = "14" }: { size?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-white inline-block ml-1">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
  </svg>
);

export const CommentIcon = () => (
  <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);

export const RepostIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-8 h-8 transition-all ${active ? 'text-white' : 'text-white opacity-40 drop-shadow-lg'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M17 1l4 4-4 4m-12 5l-4-4 4-4m13 8v4h-16v-4" />
  </svg>
);

export const MoreIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

export const TrashIcon = ({ size = "16" }: { size?: string }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const MusicIcon = () => (
  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const CloseIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
