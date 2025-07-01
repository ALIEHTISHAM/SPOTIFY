import React, { createContext, useContext, useState } from 'react';

const SearchFilterContext = createContext();

export function SearchFilterProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');

  return (
    <SearchFilterContext.Provider value={{
      searchQuery,
      setSearchQuery,
      selectedGenre,
      setSelectedGenre,
      selectedArtist,
      setSelectedArtist
    }}>
      {children}
    </SearchFilterContext.Provider>
  );
}

export function useSearchFilter() {
  return useContext(SearchFilterContext);
} 