import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { takeUmzugFromUrl } from './utils/umzug';

// Coming from the old address: take the device handover out of the URL before anything renders
takeUmzugFromUrl();

console.log('🚀 App booting...');

// Register Service Worker for PWA - DISABLED TEMPORARILY FOR DEBUGGING
/*
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ Service Worker registered', reg))
      .catch(err => console.error('❌ Service Worker registration failed', err));
  });
}
*/

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
