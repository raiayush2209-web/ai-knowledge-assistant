import { Link } from 'react-router-dom';
import { FaHome, FaUpload, FaSearch, FaExchangeAlt, FaRobot } from 'react-icons/fa';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo">
          <FaRobot style={{ marginRight: '0.5rem' }} />
          AI Knowledge Assistant
        </Link>
        <nav>
          <ul className="nav-links">
            <li><Link to="/"><FaHome /> Home</Link></li>
            <li><Link to="/upload"><FaUpload /> Upload</Link></li>
            <li><Link to="/query"><FaSearch /> Query</Link></li>
            <li><Link to="/compare"><FaExchangeAlt /> Compare</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;