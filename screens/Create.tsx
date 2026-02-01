
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
    if (lastWord.startsWith('@')) setMentionQuery(lastWord.substring(1));
    else setMentionQuery('');
  }, [description]);

  const handlePost = async () => {
    if (!videoUrl || !description || isPosting) return;
    setIsPosting(true);

    try {
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      let finalVideoUrl = videoUrl;

      // Se houver nuvem, faz upload real
      if (databaseService.isConnected()) {
        const fileToUpload = videoFile || await (await fetch(videoUrl)).blob();
        const uploadedUrl = await databaseService.uploadFile('videos', fileToUpload, `${videoId}.mp4`);
        if (uploadedUrl) finalVideoUrl = uploadedUrl;
      }
      
      const newVideo: Video = {
        id: videoId,
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
        isVerified: !!currentUser.isVerified
      };
      
      // Passa o arquivo original para o service salvar no IndexedDB se estiver offline
      await databaseService.saveVideo(newVideo, videoFile || undefined);
      
      onAddVideo(newVideo);
      setVideoUrl('');
      setVideoFile(null);
      setDescription('');
    } catch (err) {
      alert("Erro ao publicar.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="h-full animate-view bg-black flex flex-col overflow-hidden pb-32 px-6">
      <div className="flex justify-center pt-8 pb-4">
        <div className="bg-white/5 p-1.5 rounded-2xl flex gap-1 border border-white/5">
           <button onClick={() => setMode('upload')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'upload' ? 'bg-white text-black' : 'text-gray-600'}`}>Upload</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-6 pt-4 max-w-md mx-auto">
          <div onClick={() => videoInputRef.current?.click()} className="relative bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10">
            {videoUrl ? (
              <video src={videoUrl} className="w-full aspect-[9/16] max-h-[400px] rounded-3xl object-cover shadow-2xl" autoPlay muted loop />
            ) : (
              <div className="text-center">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round"/></svg>
                </div>
                <p className="font-black text-[10px] uppercase tracking-widest opacity-40">Escolher Vídeo</p>
              </div>
            )}
            <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />
          </div>
          
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 relative">
            <MentionSuggestions query={mentionQuery} users={allAccounts.map(a => a.profile)} onSelect={(u) => {
              const words = description.split(/\s/); words.pop(); setDescription([...words, `@${u} `].join(' ')); setMentionQuery('');
            }} />
            <textarea placeholder="Diga algo sobre este pulso..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-transparent text-sm outline-none h-20 resize-none text-white placeholder:text-gray-700 font-medium" />
          </div>
          
          <button onClick={handlePost} disabled={!videoUrl || isPosting} className="w-full bg-white text-black font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-30">
            {isPosting ? 'Publicando...' : 'Publicar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Create;
