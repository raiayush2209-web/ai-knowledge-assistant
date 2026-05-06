import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './components/Home.jsx';
import UploadPage from './components/UploadPage.jsx';
import QueryPage from './components/QueryPage.jsx';
import ComparePage from './components/ComparePage.jsx';

function App() {
  return (
    <div className="app-shell">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/query" element={<QueryPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
