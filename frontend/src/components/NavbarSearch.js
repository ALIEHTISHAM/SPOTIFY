import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearchFilter } from '../context/SearchFilterContext';

const NavbarSearch = React.memo(() => {
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
  );
});

export default NavbarSearch; 