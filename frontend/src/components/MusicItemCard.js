import React from 'react';

const MusicItemCard = ({ item }) => {
  // Basic placeholder structure for a music item card
  return (
    <div className="music-item-card">
      <div className="item-cover-placeholder">
        {/* Placeholder for music cover image */}
        <img src={item.coverUrl || '../../public/assets/placeholder-cover.png'} alt={item.title} />
      </div>
      <p className="item-title">{item.title}</p>
      <p className="item-artist">{item.artist}</p>
    </div>
  );
};

export default MusicItemCard; 