import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[ShreniKart PWA] Service worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[ShreniKart PWA] Service worker registration failed:', err);
      });
  });
}
