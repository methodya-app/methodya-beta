import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './lib/auth.jsx';
import './index.css';

// HashRouter porque el frontend se despliega como sitio estático en GitHub
// Pages (sin servidor que reescriba rutas); con hash (#/ruta) funciona sin
// configuración adicional sin importar el nombre del repositorio.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
