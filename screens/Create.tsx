
import React, { useState, useRef, useEffect } from 'react';
import { Video, UserProfile } from '../types';
import MentionSuggestions from '../components/MentionSuggestions';
import { generateAiVideo } from '../services/geminiService';
import { databaseService } from '../services/databaseService';

interface CreateProps {
  onAddVideo: (video: Video) => void;
  currentUser: UserProfile;
  allAccounts: any[];
}

const Create: React.FC<CreateProps> = ({ onAddVideo, currentUser, allAccounts = [] }) => {
  const [mode, setMode] = useState<'upload' | 'ai'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const lastWord = description.split(/\s/).pop() || '';
    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.substring(1));
    } else {
      setMentionQuery('');
    }
  }, [description]);

  const handleGenerateVideo = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const url = await generateAiVideo(aiPrompt);
      setVideoUrl(url);
      setDescription(`Gerado por IA: ${aiPrompt} #CoreAI #Veo`);
      setMode('upload');
    } catch (err) {
      alert("Erro ao gerar vídeo. Verifique sua chave de API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!videoUrl || !description || isPosting) return;
    setIsPosting(true);

    try {
      let finalVideoUrl = videoUrl;

      // 1. Upload para o Storage (Nuvem)
      if (videoFile) {
        const fileName = `${currentUser.username}_${Date.now()}.mp4`;
        const uploadedUrl = await databaseService.uploadFile('videos', videoFile, fileName);
        if (uploadedUrl) finalVideoUrl = uploadedUrl;
      } 
      else if (videoUrl.startsWith('blob:')) {
        try {
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          const fileName = `ai_${currentUser.username}_${Date.now()}.mp4`;
          const uploadedUrl = await databaseService.uploadFile('videos', blob, fileName);
          if (uploadedUrl) finalVideoUrl = uploadedUrl;
        } catch (e) {
          console.warn("CORE: Falha ao subir vídeo de IA, usando URL temporária.");
        }
      }
      
      const newVideo: Video = {
        id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        url: finalVideoUrl,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar || '',
        description,
        likes: 0,
        comments: [],
        reposts: 0,
        views: 0,
        isLiked: false,
        isFollowing: true,
        music: `Som Original - ${currentUser.displayName}`,
        isVerified: !!currentUser.isVerified,
        commentsDisabled: false
      };
      
      // 2. Salvar metadados no Banco de Dados
      await databaseService.saveVideo(newVideo);
      
      onAddVideo(newVideo);
      setVideoUrl('');
      setVideoFile(null);
      setDescription('');
    } catch (err) {
      alert("Erro ao publicar vídeo. Verifique sua conexão com a nuvem.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleSelectMention = (username: string) => {
    const words = description.split(/\s/);
    words.pop();
    setDescription([...words, `@${username} `].join(' '));
    setMentionQuery('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  if (isGenerating) {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center p-10 text-center animate-view">
        <div className="relative w-24 h-24 mb-10">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-4 bg-indigo-500/10 rounded-full animate-pulse"></div>
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tighter mb-4">Core Rendering</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] leading-relaxed max-w-xs">
          O modelo Veo está processando sua imaginação. Isso pode levar alguns minutos.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full animate-view bg-black flex flex-col overflow-hidden pb-32 px-6">
      <div className="flex justify-center pt-8 pb-4">
        <div className="bg-white/5 p-1.5 rounded-2xl flex gap-1 border border-white/5">
           <button onClick={() => setMode('upload')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'upload' ? 'bg-white text-black' : 'text-gray-600'}`}>Upload</button>
           <button onClick={() => setMode('ai')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'ai' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>IA Creator ✨</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-6 pt-4 max-w-md mx-auto">
          {mode === 'ai' ? (
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem] space-y-6">
               <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.3em]">Criação Veo</h3>
               <textarea 
                  placeholder="Ex: Uma paisagem futurista de São Paulo em 2099 com carros voadores..."
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm outline-none h-32 resize-none focus:border-indigo-500 transition-all text-white placeholder:text-gray-700"
               />
               <button 
                  onClick={handleGenerateVideo}
                  disabled={!aiPrompt.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-3xl text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-30"
               >
                 Gerar Vídeo com IA
               </button>
            </div>
          ) : (
            <>
              <div onClick={() => videoInputRef.current?.click()} className="relative bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-white/10 group">
                {videoUrl ? (
                  <video src={videoUrl} className="w-full aspect-[9/16] max-h-[400px] rounded-3xl object-cover shadow-2xl" autoPlay muted loop />
                ) : (
                  <div className="text-center">
                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <p className="font-black text-[10px] uppercase tracking-widest opacity-40">Escolher Vídeo</p>
                  </div>
                )}
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />
              </div>
              
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 relative">
                <MentionSuggestions query={mentionQuery} users={allAccounts.map(a => a.profile)} onSelect={handleSelectMention} />
                <label className="text-[9px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Legenda</label>
                <textarea placeholder="Diga algo sobre este pulso..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-transparent text-sm outline-none h-20 resize-none text-white placeholder:text-gray-700 font-medium" />
              </div>
              
              <button 
                onClick={handlePost} 
                disabled={!videoUrl || isPosting} 
                className="w-full bg-white text-black font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-30"
              >
                {isPosting ? 'Publicando na Nuvem...' : 'Publicar Agora'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Create;
