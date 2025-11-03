import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout/Layout'; // لِی‌اوت اصلی
import HomePage from './pages/HomePage';
import './i18n';

function App() {
  return (
    <ThemeProvider>
      <Router>
        {/* FIX: Layout فقط یک بار در اینجا رندر می‌شود و تمام صفحات را در بر می‌گیرد.
          این کار مشکل هدرهای تکراری را حل می‌کند.
        */}
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* صفحات دیگر در صورت وجود... */}
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;