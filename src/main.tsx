// Order matters: Monaco must be configured before any editor renders,
// and the font must be loaded before Monaco measures it.
import '@fontsource/jetbrains-mono/400.css';
import './editor/monacoSetup';
import './app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
