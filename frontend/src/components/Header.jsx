import { Link } from 'react-router-dom';
import { FaHome, FaUpload, FaSearch, FaExchangeAlt, FaRobot, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo">
          <FaRobot style={{ marginRight: '0.5rem' }} />
          AI Knowledge Assistant
        </Link>
        <nav>
          <ul className="nav-links">
            {isAuthenticated && <>
              <li><Link to="/"><FaHome /> Home</Link></li>
              <li><Link to="/upload"><FaUpload /> Upload</Link></li>
              <li><Link to="/query"><FaSearch /> Query</Link></li>
              <li><Link to="/compare"><FaExchangeAlt /> Compare</Link></li>
              <li><span className="header-user">{user?.username}</span></li>
              <li><button type="button" className="nav-logout" onClick={logout}><FaSignOutAlt /> Sign out</button></li>
            </>}
            {!isAuthenticated && <li><Link to="/login"><FaSignInAlt /> Sign in</Link></li>}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;