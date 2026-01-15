
import React, { useState } from 'react';
import Logo from '../components/Logo';

interface RegisteredAccount {
  email: string;
  username: string;
  password?: string;
}

interface AuthProps {
  onLogin: (identifier: string, isNew: boolean, password?: string, randomData?: { displayName: string, username: string }) => void;
  registeredAccounts: RegisteredAccount[];
}

const Auth: React.FC<AuthProps> = ({ onLogin, registeredAccounts }) => {
  const [mode, setMode] = useState<'landing' | 'login' | 'signup'>('landing');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [signupUser, setSignupUser] = useState('');
  const [signupDisplay, setSignupDisplay] = useState('');
  const [error, setError] = useState('');

  const validate = (val: string) => /^[a-zA-Z0-9]{3,20}$/.test(val);

  const handleAction = (isSignup: boolean) => {
    setError('');
    const idClean = identifier.toLowerCase().trim();
    
    if (isSignup) {
      if (!idClean || !password || !signupUser || !signupDisplay) return setError('Preencha todos os campos.');
      if (!validate(signupUser)) return setError('Username: 3-20 letras ou números.');
      if (password.length < 3) return setError('Senha muito curta.');
      
      const emailExists = registeredAccounts.some(a => a.email.toLowerCase() === idClean);
      const userExists = registeredAccounts.some(a => a.username.toLowerCase() === signupUser.toLowerCase());
      
      if (emailExists || userExists) {
        return setError('Este e-mail ou username já está em uso. Tente fazer login.');
      }

      onLogin(idClean, true, password, { username: signupUser, displayName: signupDisplay });
    } else {
      if (!idClean || !password) return setError('Preencha e-mail e senha.');
      
      const acc = registeredAccounts.find(a => 
        (a.email.toLowerCase() === idClean || a.username.toLowerCase() === idClean) && 
        a.password === password
      );
      
      if (!acc) return setError('Credenciais incorretas ou conta ainda não sincronizada.');
      onLogin(acc.email, false, password);
    }
  };

  if (mode === 'landing') {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center p-8 text-center animate-view">
        <Logo size={100} className="mb-10 rotate-6" variant="icon" />
        <h1 className="text-6xl font-black italic mb-2 tracking-tighter">CORE</h1>
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.5em] mb-20">O Pulso do Conteúdo</p>
        <div className="w-full max-w-xs space-y-4">
          <button onClick={() => setMode('signup')} className="w-full bg-white text-black h-16 rounded-[2rem] font-black text-xs shadow-xl active:scale-95 transition-transform">CRIAR CONTA</button>
          <button onClick={() => setMode('login')} className="w-full border border-white/10 text-white h-16 rounded-[2rem] font-black text-xs active:scale-95 transition-transform">ENTRAR</button>
        </div>
        {registeredAccounts.length === 0 && (
          <p className="mt-8 text-[8px] text-gray-500 uppercase tracking-widest opacity-50">Nenhuma conta detectada. Verifique sua conexão.</p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-black p-10 flex flex-col items-center overflow-y-auto no-scrollbar">
      <button onClick={() => setMode('landing')} className="self-start mb-10 opacity-50">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="w-full max-w-xs">
        <Logo size={50} className="mb-8 self-start" />
        <h2 className="text-4xl font-black italic mb-10 uppercase tracking-tighter">{mode === 'signup' ? 'CADASTRO' : 'LOGIN'}</h2>
        
        {error && (
          <div className="bg-rose-600/20 text-rose-500 text-[10px] font-black p-4 rounded-2xl mb-6 uppercase border border-rose-500/20 text-center animate-pulse">
            {error}
          </div>
        )}
        
        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-600 uppercase ml-1">{mode === 'signup' ? 'E-mail' : 'E-mail ou Username'}</label>
            <input 
              type="text" 
              value={identifier} 
              onChange={e => setIdentifier(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-white transition-all" 
              placeholder={mode === 'signup' ? "exemplo@email.com" : "usuario ou email"}
            />
          </div>

          {mode === 'signup' && (
            <>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-600 uppercase ml-1">Username</label>
                <input 
                  maxLength={20} 
                  type="text" 
                  value={signupUser} 
                  onChange={e => setSignupUser(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-white transition-all" 
                  placeholder="usuario123"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-600 uppercase ml-1">Nome Público</label>
                <input 
                  maxLength={20} 
                  type="text" 
                  value={signupDisplay} 
                  onChange={e => setSignupDisplay(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ''))} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-white transition-all" 
                  placeholder="Seu Nome"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-600 uppercase ml-1">Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-white transition-all" 
              placeholder="••••••••"
            />
          </div>
        </div>

        <button 
          onClick={() => handleAction(mode === 'signup')} 
          className="w-full bg-white text-black h-16 rounded-[2rem] font-black text-[10px] uppercase tracking-widest mt-12 shadow-xl active:scale-95 transition-transform"
        >
          {mode === 'login' ? 'ENTRAR' : 'FINALIZAR'}
        </button>
        
        <p className="mt-8 text-center text-[8px] text-gray-700 font-black uppercase tracking-widest">
          {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
          <span 
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} 
            className="text-white cursor-pointer hover:underline"
          >
            Clique aqui
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
