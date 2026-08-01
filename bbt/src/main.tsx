import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { InstallPromptHandler } from './components/InstallPromptHandler.tsx';
import { capturePendingReferral } from './utils/referral.ts';
import './index.css';

// Captured before anything else — the player might not be signed in
// yet when they first open a referral link, so this needs to survive
// in storage until their actual first sign-in completes.
capturePendingReferral();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <InstallPromptHandler />
    </ErrorBoundary>
  </StrictMode>,
);
