import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tailwind.css';   // FÖRST: Tailwind base + design tokens
import App from './App';            // sen App som laddar in våra övriga CSS-filer
import { migrateLegacyStorageKeys } from './lib/storage-migration';

// Migrera localStorage-nycklar (costa-sol: → costa-del-sol:) före render.
migrateLegacyStorageKeys();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
