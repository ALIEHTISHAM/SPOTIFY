import React, { createContext, useContext, useState } from 'react';

const TrackContext = createContext();

export function TrackProvider({ children }) {
  const [selectedTrack, setSelectedTrack] = useState(null);

  return (
    <TrackContext.Provider value={{ selectedTrack, setSelectedTrack }}>
      {children}
    </TrackContext.Provider>
  );
}

export function useTrack() {
  return useContext(TrackContext);
} 