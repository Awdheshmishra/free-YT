import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './tailwind.css';
import './styles.css';
import './api.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => registration.active?.postMessage({ type: 'PRECACHE_APP' }))
      .catch((error) => console.error('Infinity service worker registration failed:', error));
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
