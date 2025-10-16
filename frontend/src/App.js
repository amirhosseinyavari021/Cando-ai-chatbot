import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
// import AdminPage from './pages/AdminPage'; // For later
// import LoginPage from './pages/LoginPage'; // For later

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path="/admin" element={<AdminPage />} /> */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
      </Routes>
    </Layout>
  );
}

export default App;