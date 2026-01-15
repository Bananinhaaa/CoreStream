
import React from 'react';
import { UserProfile, Video } from '../types';

interface InboxProps {
  currentUser: UserProfile;
  onNavigateToProfile: (username: string) => void;
  videos: Video[];
}

const Inbox: React.FC<InboxProps> = ({ currentUser, onNavigateToProfile, videos }) => {
  return (
    <div className="h-full bg-black flex flex-col overflow-hidden animate-view">
      <header className="p-8 pb-4">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Inbox</h2>
        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">Atividades Recentes</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 space-y-3 no-scrollbar pb-24 mt-4">
        {(currentUser.notifications || []).length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center opacity-20 italic text-sm text-center">
            <p>Nenhuma atividade por enquanto.<br/>Fique de olho nos seus pulsos!</p>
          </div>
        ) : (
          (currentUser.notifications || []).map(notif => {
            const relatedVideo = notif.videoId ? videos.find(v => v.id === notif.videoId) : null;
            return (
              <div 
                key={notif.id} 
                onClick={() => notif.videoId ? {} : onNavigateToProfile(notif.fromUser)}
                className={`flex items-center gap-4 p-5 rounded-[2rem] border ${notif.type === 'security' ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-white/5 border-white/5'}`}
              >
                <div className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center border border-white/10 ${notif.type === 'security' ? 'bg-indigo-600' : 'bg-zinc-800'}`}>
                  {notif.fromAvatar ? <img src={notif.fromAvatar} className="w-full h-full rounded-full object-cover" /> : <span className="font-black text-xs uppercase">{notif.fromUser.charAt(0)}</span>}
                </div>
                <div className="flex-1">
                  <p className="text-xs">
                    <span className="font-black">@{notif.fromUser}</span> {notif.text}
                  </p>
                  <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {relatedVideo && (
                  <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0">
                    <video src={relatedVideo.url} className="w-full h-full object-cover opacity-50" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Inbox;
