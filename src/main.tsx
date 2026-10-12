import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Registro automático del Service Worker con actualización inmediata en segundo plano
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(_swScriptUrl, registration) {
      if (registration) {
        // Verificar periódicamente nuevas versiones de la aplicación (cada 60 min)
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
    onOfflineReady() {
      console.info('[PWA] Datos e interfaz listos para consulta offline.');
    },
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
