import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { useTrack } from '../context/TrackContext';
import { useSearchFilter } from '../context/SearchFilterContext';
import TrackCard from './TrackCard';
import CommentOverlay from './CommentOverlay';
import FilterBar from './FilterBar';

const TrackList = React.memo(function TrackList({ page, setPage, totalPages, setTotalPages, total, setTotal, hasSubscription, subscriptionDetails }) {
  const { searchQuery, selectedGenre, selectedArtist, setSearchQuery, setSelectedGenre, setSelectedArtist } = useSearchFilter();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedTrack, setSelectedTrack } = useTrack();
  const [commentOverlayOpen, setCommentOverlayOpen] = useState(false);
  const [commentTrack, setCommentTrack] = useState(null);
  const [allArtists, setAllArtists] = useState([]);
  const [allGenres, setAllGenres] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/publicTracks/artists`).then(res => setAllArtists(res.data.artists));
    axios.get(`${API_URL}/api/publicTracks/genres`).then(res => setAllGenres(res.data.genres));
  }, []);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line
  }, [searchQuery, selectedGenre, selectedArtist]);

  // Fetch tracks when page or filters/search change
  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const params = { page, limit: 20 };
        if (searchQuery) params.q = searchQuery;
        if (selectedGenre) params.genre = selectedGenre;
        if (selectedArtist) params.artist = selectedArtist;
        const response = await axios.get(`${API_URL}/api/publicTracks/approved`, {
          params,
          headers
        });
        setTracks(response.data.tracks);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
        setLoading(false);
      } catch (err) {
        setError('Failed to load tracks. Please try again later.');
        setLoading(false);
      }
    };
    fetchTracks();
    // eslint-disable-next-line
  }, [page, searchQuery, selectedGenre, selectedArtist]);

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedArtist('');
    setSelectedGenre('');
    setSearchQuery('');
  };

  // Play logic (memoized)
  const handlePlay = useCallback((track) => {
    if (!hasSubscription) {
      if (subscriptionDetails?.status === 'cancelled') {
        alert('Your subscription has ended. Please resubscribe to continue streaming music.');
      } else {
        alert('Please subscribe to stream music');
      }
      return;
    }
    setSelectedTrack(track);
  }, [hasSubscription, subscriptionDetails, setSelectedTrack]);

  const handleOpenComments = useCallback((track) => {
    setCommentTrack(track);
    setCommentOverlayOpen(true);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentOverlayOpen(false);
    setCommentTrack(null);
  }, []);

  // Determine if filters should be shown based on searchQuery
  const showFilters = !!searchQuery;

  if (loading) return (
    <div className="loader-container">
      <div className="loader"></div>
    </div>
  );
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      {showFilters && (
        <FilterBar
          uniqueArtists={allArtists}
          uniqueGenres={allGenres}
          selectedArtist={selectedArtist}
          setSelectedArtist={setSelectedArtist}
          selectedGenre={selectedGenre}
          setSelectedGenre={setSelectedGenre}
          handleClearFilters={handleClearFilters}
          resultsCount={tracks.length}
        />
      )}
      <div className="tracks-section">
        {/* Track Cards */}
        <div className="tracks-grid">
          {tracks.map((track) => (
            <TrackCard
              key={track._id}
              track={track}
              isSelected={selectedTrack?._id === track._id}
              onSelect={handlePlay}
              onOpenComments={handleOpenComments}
            />
          ))}
        </div>
        <CommentOverlay open={commentOverlayOpen} onClose={handleCloseComments} track={commentTrack} allTracks={tracks} />
      </div>
    </>
  );
});

export default TrackList; 