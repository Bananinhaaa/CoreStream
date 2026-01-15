
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// SHIM: Define o objeto process globalmente para o navegador.
// Isso é essencial para que o SDK do Gemini (que usa process.env) não quebre a aplicação.
(window as any).process = {
  env: {
    ...(window as any).process?.env,
    API_KEY: (window as any).process?.env?.API_KEY || ''
  }
};

/**
 * Registro do Service Worker.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('CoreStream PWA: Ativo', reg.scope);
      })
      .catch(err => {
        console.warn('CoreStream PWA: SW não registrado (esperado em dev)');
      });
  });
}

// Desativa o efeito de scroll elástico para parecer um app nativo
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
  console.error("Erro Crítico: Elemento #root não encontrado no DOM.");
}
