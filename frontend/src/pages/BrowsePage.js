import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import '../styles/BrowsePage.css';
import AudioPlayer from '../components/AudioPlayer';

const BrowsePage = () => {
  console.log('BrowsePage rendered');
  const { hasSubscription, createCheckoutSession, loading: subscriptionLoading, subscriptionDetails } = useSubscription();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const location = useLocation();

  // Filter states
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/publicTracks/approved');
        console.log('Fetched tracks:', response.data);
        setTracks(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching approved tracks:', err);
        setError('Failed to load tracks. Please try again later.');
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  // Initialize search from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchQuery(query);
      setIsSearchActive(!!query);
    }
  }, [location.search]);

  // Listen for search events from navbar
  useEffect(() => {
    const handleSearchInput = (e) => {
      const { searchTerm } = e.detail;
      setSearchQuery(searchTerm);
      setIsSearchActive(!!searchTerm);
    };

    const handleSearchPerformed = (e) => {
      const { searchTerm } = e.detail;
      setSearchQuery(searchTerm);
      setIsSearchActive(true);
    };

    window.addEventListener('searchInput', handleSearchInput);
    window.addEventListener('searchPerformed', handleSearchPerformed);

    return () => {
      window.removeEventListener('searchInput', handleSearchInput);
      window.removeEventListener('searchPerformed', handleSearchPerformed);
    };
  }, []);

  // Filter tracks based on search and filters
  const filteredTracks = tracks.filter(track => {
    const matchesSearch = searchQuery ? 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist?.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    
    const matchesGenre = selectedGenre ? 
      track.genre.toLowerCase() === selectedGenre.toLowerCase() : true;
    
    const matchesArtist = selectedArtist ? 
      track.artist?.name.toLowerCase() === selectedArtist.toLowerCase() : true;

    return matchesSearch && matchesGenre && matchesArtist;
  });

  // Get unique genres and artists for filter dropdowns
  const uniqueGenres = [...new Set(tracks.map(track => track.genre))];
  const uniqueArtists = [...new Set(tracks.map(track => track.artist?.name).filter(Boolean))];

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedArtist('');
    setSelectedGenre('');
    setSearchQuery('');
    setIsSearchActive(false);
    // Clear URL search parameter
    window.history.replaceState({}, '', '/browse');
  };

  // Update play logic to only set selectedTrack
  const handlePlay = (track) => {
    if (!hasSubscription) {
      if (subscriptionDetails?.status === 'cancelled') {
        alert('Your subscription has ended. Please resubscribe to continue streaming music.');
      } else {
        alert('Please subscribe to stream music');
      }
      return;
    }
    setSelectedTrack(track);
  };

  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      // Redirect to login page if user is not authenticated
      navigate('/login');
      return;
    }
    createCheckoutSession();
  };

  useEffect(() => {
    console.log('Subscription state:', { hasSubscription, subscriptionLoading });
  }, [hasSubscription, subscriptionLoading]);

  if (loading || subscriptionLoading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Browse Music</h1>
        {isAuthenticated && !hasSubscription && (
          <button 
            className="subscribe-button"
            onClick={handleSubscribeClick}
          >
            Subscribe to Stream Music - $5/month
          </button>
        )}
        {!isAuthenticated && (
          <div className="auth-prompt">
            <p>Please <button onClick={() => navigate('/login')} className="auth-link">login</button> or <button onClick={() => navigate('/register')} className="auth-link">sign up</button> to subscribe and stream music</p>
          </div>
        )}
      </div>

      {/* Filter Section - Only shown when search is active */}
      {isSearchActive && (
        <div className="filter-section">
          <div className="filters">
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="filter-select"
            >
              <option value="">All Artists</option>
              {uniqueArtists.map(artist => (
                <option key={artist} value={artist}>{artist}</option>
              ))}
            </select>

            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="filter-select"
            >
              <option value="">All Genres</option>
              {uniqueGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            <button 
              onClick={handleClearFilters}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>

          <div className="results-count">
            {filteredTracks.length} tracks found
          </div>
        </div>
      )}

      {/* Tracks Section - Always shown to allow browsing */}
      <div className="tracks-section">
        <div className="tracks-grid">
          {filteredTracks.map((track, index) => (
            <div
              key={track._id}
              className={`track-card ${selectedTrack?._id === track._id ? 'playing' : ''}`}
              onClick={() => handlePlay(track)}
              style={{ cursor: 'pointer' }}
            >
              <div className="track-number">{index + 1}</div>
              <span className="play-icon">▶</span>
              <div className="track-cover-container">
                <img
                  src={`http://localhost:5000/${track.coverImage}`}
                  alt={track.title}
                  className="track-cover"
                />
              </div>
              <div className="track-info">
                <h3>{track.title}</h3>
                <p>{track.artist?.name || 'Unknown Artist'}</p>
                <p className="genre">{track.genre}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Music Player - Only shown if a track is selected (hasSubscription check is in handlePlay) */}
      {selectedTrack && (
        <AudioPlayer
          track={{
            ...selectedTrack,
            audioUrl: `http://localhost:5000/${selectedTrack.audioFile}`
          }}
        />
      )}
    </div>
  );
};

export default BrowsePage; 