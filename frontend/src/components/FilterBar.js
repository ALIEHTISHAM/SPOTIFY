import React from 'react';

const FilterBar = React.memo(function FilterBar({
  uniqueArtists,
  uniqueGenres,
  selectedArtist,
  setSelectedArtist,
  selectedGenre,
  setSelectedGenre,
  handleClearFilters,
  resultsCount
}) {
  return (
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
        {resultsCount} tracks found
      </div>
    </div>
  );
});

export default FilterBar; 