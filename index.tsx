
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Registro do Service Worker.
 * Em ambientes de sandbox e preview, caminhos relativos simples ('sw.js') são 
 * a forma mais confiável de registro, pois o navegador garante a resolução 
 * automática contra a origem correta do documento atual.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => {
        console.log('CoreStream PWA: Registrado com sucesso no escopo:', reg.scope);
      })
      .catch(err => {
        // Captura falhas comuns em ambientes de desenvolvimento/sandbox
        if (err.name === 'SecurityError') {
          console.warn('CoreStream PWA: Registro de SW ignorado devido a restrições de segurança do ambiente de preview.');
        } else {
          console.error('CoreStream PWA: Erro no registro do Service Worker:', err);
        }
      });
  });
}

// Bloqueio de comportamentos que denunciam ser um navegador em elementos não-editáveis
document.addEventListener('contextmenu', e => {
  const target = e.target as HTMLElement;
  if (!(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
    e.preventDefault();
  }
});

// Desativa o efeito de scroll elástico/overscroll para parecer um app nativo
document.body.style.overscrollBehavior = 'none';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
