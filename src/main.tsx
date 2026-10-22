import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  // Mark app as mounted successfully
  (window as unknown as { __APP_LOADED__?: boolean }).__APP_LOADED__ = true;
}
