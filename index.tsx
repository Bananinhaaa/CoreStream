
/**
 * SHIM DE EMERGÊNCIA: Deve ser a primeira coisa no arquivo.
 * Garante que o SDK do Gemini tenha acesso ao objeto process.env 
 * antes de qualquer componente ou serviço ser importado.
 */
(window as any).process = {
  env: {
    API_KEY: (window as any).process?.env?.API_KEY || ''
  }
};

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Registro do Service Worker para PWA.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('CoreStream PWA: Ativo'))
      .catch(err => console.warn('CoreStream PWA: SW erro local'));
  });
}

// Configurações globais de interface
document.body.style.overscrollBehavior = 'none';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Erro Crítico: Elemento #root não encontrado.");
}
