import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearchFilter } from '../context/SearchFilterContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useSearchFilter();
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize search term from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchTerm(query);
      setSearchQuery(query);
    }
  }, [location.search, setSearchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchQuery(searchTerm.trim());
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchQuery(value);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Music Stream
        </Link>
        <div className="navbar-menu">
          <div className="search-bar navbar-search">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
          </div>
          {isAuthenticated ? (
            <>
              {user?.role === 'artist' ? (
                <Link to="/artist/dashboard" className="navbar-item">
                  Artist Dashboard
                </Link>
              ) : (
                <Link to="/browse" className="navbar-item">
                  Browse
                </Link>
              )}
              <Link to="/profile" className="navbar-item">
                Profile
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="navbar-item">
                Login
              </Link>
              <Link to="/register" className="navbar-item">
                Register
              </Link>
              <Link to="/artist/register" className="navbar-item artist-link">
                Register as Artist
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 