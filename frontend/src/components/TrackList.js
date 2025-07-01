import React, { useCallback } from 'react';
import { useTrack } from '../context/TrackContext';
import { useSearchFilter } from '../context/SearchFilterContext';
import TrackCard from './TrackCard';
import CommentOverlay from './CommentOverlay';

const TrackList = React.memo(function TrackList({ tracks, hasSubscription, subscriptionDetails }) {
  const { selectedTrack, setSelectedTrack } = useTrack();
  const {
    searchQuery,
    setSearchQuery,
    selectedGenre,
    setSelectedGenre,
    selectedArtist,
    setSelectedArtist
  } = useSearchFilter();

  const [commentOverlayOpen, setCommentOverlayOpen] = React.useState(false);
  const [commentTrack, setCommentTrack] = React.useState(null);

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

  const handleOpenComments = React.useCallback((track) => {
    setCommentTrack(track);
    setCommentOverlayOpen(true);
  }, []);

  const handleCloseComments = React.useCallback(() => {
    setCommentOverlayOpen(false);
    setCommentTrack(null);
  }, []);

  return (
    <div className="tracks-section">
      {/* Filter Section */}
      <div className="filter-section">
        <div className="filters">
          <select
            value={selectedArtist}
            onChange={e => setSelectedArtist(e.target.value)}
            className="filter-select"
          >
            <option value="">All Artists</option>
            {uniqueArtists.map(artist => (
              <option key={artist} value={artist}>{artist}</option>
            ))}
          </select>
          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
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
      {/* Track Cards */}
      <div className="tracks-grid">
        {filteredTracks.map((track) => (
          <TrackCard
            key={track._id}
            track={track}
            isSelected={selectedTrack?._id === track._id}
            onSelect={handlePlay}
            onOpenComments={handleOpenComments}
          />
        ))}
      </div>
      <CommentOverlay open={commentOverlayOpen} onClose={handleCloseComments} track={commentTrack} />
    </div>
  );
});

export default TrackList; 