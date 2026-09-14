import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './components/Home.jsx';
import UploadPage from './components/UploadPage.jsx';
import QueryPage from './components/QueryPage.jsx';
import ComparePage from './components/ComparePage.jsx';
import LoginPage from './components/LoginPage.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Header />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/query" element={<ProtectedRoute><QueryPage /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
        </Routes>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
