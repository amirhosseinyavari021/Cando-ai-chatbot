import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// --- THIS IS THE FIX ---
// Change this line from './App.jsx' to './App.js'
import App from './App.js';
// --- END FIX ---

import './i18n'; // Initialize i18next
import './index.css'; // Global styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);