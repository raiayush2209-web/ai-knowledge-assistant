import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>AI Knowledge Assistant</h3>
          <p>Powered by advanced RAG technology to help you extract insights from your documents and web content.</p>
        </div>
        <div className="footer-section">
          <h3>Features</h3>
          <p>Document Upload & Indexing</p>
          <p>Web Content Indexing</p>
          <p>Intelligent Querying</p>
          <p>Content Comparison</p>
        </div>
        <div className="footer-section">
          <h3>Contact</h3>
          <p>
            <FaEnvelope style={{ marginRight: '0.5rem' }} />
            <a href="mailto:support@aiknowledge.com">support@aiknowledge.com</a>
          </p>
          <p>
            <FaGithub style={{ marginRight: '0.5rem' }} />
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          </p>
          <p>
            <FaLinkedin style={{ marginRight: '0.5rem' }} />
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;