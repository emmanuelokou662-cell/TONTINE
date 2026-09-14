import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { SocketProvider } from './context/SocketContext';
import './index.css';

// Enregistrement du Service Worker PWA avec Workbox
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('✅ [PWA] Service Worker enregistré avec succès :', reg.scope);
    }).catch((err) => {
      console.warn('⚠️ [PWA] Échec d\'enregistrement du Service Worker :', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <GroupProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </GroupProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
