import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@digdir/designsystemet-theme';
import '@digdir/designsystemet-css';
import '@digdir/brui-ui/style.css';
import './designsystemet.css';
import './playground.css';

import { PlaygroundApp } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlaygroundApp />
  </StrictMode>,
);
