import { Link } from 'react-router-dom';
import { FaUpload, FaSearch, FaExchangeAlt, FaRocket, FaShieldAlt, FaBrain } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="page-container">
      <section className="hero-section">
        <h1 className="hero-title">AI Knowledge Assistant</h1>
        <p className="hero-subtitle">
          Transform your documents and web content into an intelligent knowledge base.
          Upload files, index websites, and ask questions against your custom content with AI-powered precision.
        </p>
        <div className="hero-buttons">
          <Link to="/upload" className="hero-button primary">
            <FaUpload style={{ marginRight: '0.5rem' }} />
            Get Started - Upload Content
          </Link>
          <Link to="/query" className="hero-button secondary">
            <FaSearch style={{ marginRight: '0.5rem' }} />
            Query Your Knowledge Base
          </Link>
        </div>
      </section>

      <div className="box">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <FaRocket style={{ marginRight: '0.5rem' }} />
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <FaUpload size={48} color="#6366f1" style={{ marginBottom: '1rem' }} />
            <h3>1. Upload & Index</h3>
            <p>Upload documents, index websites, or add text content to build your knowledge base.</p>
            <Link to="/upload" style={{ color: '#6366f1', textDecoration: 'none' }}>Go to Upload →</Link>
          </div>
          <div style={{ textAlign: 'center' }}>
            <FaSearch size={48} color="#8b5cf6" style={{ marginBottom: '1rem' }} />
            <h3>2. Ask Questions</h3>
            <p>Query your knowledge base with natural language questions and get AI-powered answers.</p>
            <Link to="/query" style={{ color: '#8b5cf6', textDecoration: 'none' }}>Go to Query →</Link>
          </div>
          <div style={{ textAlign: 'center' }}>
            <FaExchangeAlt size={48} color="#06b6d4" style={{ marginBottom: '1rem' }} />
            <h3>3. Compare Content</h3>
            <p>Compare information across multiple sources and get comprehensive analysis.</p>
            <Link to="/compare" style={{ color: '#06b6d4', textDecoration: 'none' }}>Go to Compare →</Link>
          </div>
        </div>
      </div>

      <div className="box">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <FaRocket style={{ marginRight: '0.5rem' }} />
          Key Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <FaUpload size={48} color="#6366f1" style={{ marginBottom: '1rem' }} />
            <h3>Document Upload</h3>
            <p>Upload PDFs, DOCX, TXT, and other document formats. Our AI extracts and indexes content automatically.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <FaSearch size={48} color="#8b5cf6" style={{ marginBottom: '1rem' }} />
            <h3>Web Indexing</h3>
            <p>Index entire websites or specific URLs. Convert web content into searchable knowledge instantly.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <FaExchangeAlt size={48} color="#06b6d4" style={{ marginBottom: '1rem' }} />
            <h3>Content Comparison</h3>
            <p>Compare information across multiple sources. Get comprehensive answers from diverse content.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <FaBrain size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3>AI-Powered Queries</h3>
            <p>Ask natural language questions. Our AI understands context and provides accurate, relevant answers.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <FaShieldAlt size={48} color="#f59e0b" style={{ marginBottom: '1rem' }} />
            <h3>Secure & Private</h3>
            <p>Your documents and queries are processed securely. Content is not shared or stored permanently.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <FaRocket size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h3>Fast & Efficient</h3>
            <p>Lightning-fast processing with advanced vector search technology for instant results.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;