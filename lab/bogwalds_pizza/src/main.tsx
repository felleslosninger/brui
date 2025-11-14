import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@digdir/designsystemet-theme';
import '@digdir/designsystemet-css';
import '../styles/layers.css';
import '../styles/designsystemet.css'
import '../styles/party.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
