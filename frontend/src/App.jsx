import React from 'react';
import { Routes, Route } from 'react-router-dom';
// FIX: import به named (با آکولاد) تغییر کرد تا با فایل Layout.jsx مچ شود
import { Layout } from './components/Layout/Layout';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* اگر می‌خواهید Layout تمام صفحات را در بر بگیرد، ساختار باید این شکلی باشد:
        <Route path="/" element={<Layout />}> 
          <Route index element={<HomePage />} />
          {/* <Route path="about" element={<AboutPage />} /> *\/}
        </Route>
        اما چون HomePage خودش Layout را رندر می‌کند، همین ساختار فعلی شما درست است.
      */}
    </Routes>
  );
}

export default App;