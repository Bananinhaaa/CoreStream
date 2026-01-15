
import React, { useEffect, useState } from 'react';

interface SecurityNotificationProps {
  email: string;
  code: string;
  onClose: () => void;
}

const SecurityNotification: React.FC<SecurityNotificationProps> = ({ email, code, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500);
    const autoClose = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoClose);
    };
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-4 right-4 z-[1000] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}>
      <div className="max-w-md mx-auto bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl shadow-black/50 flex gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">E-mail de Segurança</p>
            <p className="text-[8px] text-gray-500 font-bold uppercase">Agora</p>
          </div>
          <p className="text-xs font-black text-white mb-1 truncate">VibeStream: Seu Código de Acesso</p>
          <p className="text-[10px] text-gray-400 leading-tight">Olá! Use o código <span className="text-white font-black">{code}</span> para confirmar sua identidade em <span className="underline">{email}</span>.</p>
        </div>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 500); }} className="text-gray-500 hover:text-white p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" strokeLinecap="round"/></svg>
        </button>
      </div>
    </div>
  );
};

export default SecurityNotification;
