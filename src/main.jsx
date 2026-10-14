import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
const preview = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('preview') : null;

function render(element) {
  root.render(<React.StrictMode>{element}</React.StrictMode>);
}

if (import.meta.env.DEV && preview) {
  // Solo en desarrollo: el build de produccion elimina esta rama y el modulo de preview.
  import('./lib/previewDev.jsx').then(({ default: PreviewDev }) => render(<PreviewDev tipo={preview} />));
} else {
  render(<App />);
}
