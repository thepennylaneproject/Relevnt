import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';

import './styles/app-theme.css';  // ⬅ global theme
import './styles/textures.css';   // ⬅ texture system
import './index.css';             // existing base styles

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);