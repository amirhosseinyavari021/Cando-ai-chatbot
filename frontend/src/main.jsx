import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// --- THIS IS THE FIX ---
// Revert this import to use the .jsx extension, which matches the file's content
import App from './App.jsx';
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