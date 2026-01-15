
import React, { useState } from 'react';
import { Video, UserProfile } from '../types';
import { CloseIcon, VerifiedBadge } from './Icons';
import { generateRepostCaption } from '../services/geminiService';

interface RepostDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video;
  onConfirm: (caption?: string) => void;
  currentUser: UserProfile;
}

const RepostDrawer: React.FC<RepostDrawerProps> = ({ isOpen, onClose, video, onConfirm, currentUser }) => {
  const [caption, setCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleAiSuggest = async () => {
    setIsGenerating(true);
    const suggestion = await generateRepostCaption(video.description);
    setCaption(suggestion);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-md bg-[#0d0d0d] rounded-t-[2.5rem] border-t border-white/10 p-8 animate-slide-up shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/80 italic">Republicar Post</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><CloseIcon /></button>
        </div>

        <div className="flex gap-6 mb-8 bg-white/5 p-4 rounded-3xl border border-white/5">
          <div className="w-20 h-28 rounded-2xl overflow-hidden shrink-0 border border-white/10">
            <video src={video.url} className="w-full h-full object-cover opacity-60" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Vídeo de</p>
            <p className="text-xs font-black truncate flex items-center gap-1">
              @{video.username} {video.isVerified && <VerifiedBadge size="12" />}
            </p>
            <p className="text-[10px] text-gray-400 mt-2 line-clamp-2 italic">"{video.description}"</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicione um pensamento (opcional)..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-white h-24 resize-none transition-all"
            />
            <button 
              onClick={handleAiSuggest}
              disabled={isGenerating}
              className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? 'Gerando...' : 'IA Legenda ✨'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button 
              onClick={() => onConfirm()} 
              className="bg-white/5 border border-white/10 text-white py-5 rounded-3xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
            >
              Repost Rápido
            </button>
            <button 
              onClick={() => onConfirm(caption)} 
              className="bg-white text-black py-5 rounded-3xl font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Republicar
            </button>
          </div>
        </div>

        <p className="text-[7px] text-center text-gray-600 font-black uppercase tracking-[0.4em] mt-8">CoreStream Ecosystem</p>
      </div>
    </div>
  );
};

export default RepostDrawer;
