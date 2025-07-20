import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavbarSearch from './NavbarSearch';

// Memoized Link component
const MemoLink = React.memo(({ to, children, ...props }) => (
  <Link to={to} {...props}>{children}</Link>
));

// Memoized NavbarMenu
const NavbarMenu = React.memo(({ isAuthenticated, user, handleLogout }) => (
  <div className="navbar-menu">
    {isAuthenticated ? (
      <>
        {user?.role === 'artist' ? (
          <MemoLink to="/artist/dashboard" className="navbar-item">
            Artist Dashboard
          </MemoLink>
        ) : (
          <MemoLink to="/browse" className="navbar-item">
            Browse
          </MemoLink>
        )}
        <MemoLink to="/profile" className="navbar-item">
          Profile
        </MemoLink>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </>
    ) : (
      <div className="auth-buttons">
        <MemoLink to="/login" className="navbar-item">
          Login
        </MemoLink>
        <MemoLink to="/register" className="navbar-item">
          Register
        </MemoLink>
        <MemoLink to="/artist/register" className="navbar-item artist-link">
          Register as Artist
        </MemoLink>
      </div>
    )}
  </div>
));

const Navbar = React.memo(() => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Initialize search term from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      // setSearchTerm(query); // This state is now managed by NavbarSearch
      // setSearchQuery(query); // This context is now managed by NavbarSearch
    }
  }, [location.search]); // Removed setSearchQuery from dependency array

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Music Stream
        </Link>
        <NavbarSearch />
        {/* Hamburger button for mobile */}
        <button
          className="navbar-hamburger"
          aria-label="Open navigation menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="hamburger-icon">&#9776;</span>
        </button>
        {/* Desktop menu */}
        <div className="navbar-menu-wrapper">
          <NavbarMenu isAuthenticated={isAuthenticated} user={user} handleLogout={handleLogout} />
        </div>
        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="navbar-mobile-menu">
            <NavbarMenu isAuthenticated={isAuthenticated} user={user} handleLogout={handleLogout} />
          </div>
        )}
      </div>
    </nav>
  );
});

export default Navbar; 