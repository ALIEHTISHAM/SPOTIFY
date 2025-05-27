import React from 'react';
import styles from '../styles/ArtistCard.module.css';

const ArtistCard = ({ artist }) => {
  // Basic placeholder structure for an artist card
  return (
    <div className={styles.artistCard}>
      <div className={styles.imageContainer}>
        <img 
          src={artist.imageUrl || '/assets/placeholder-artist.png'} 
          alt={artist.name}
          className={styles.artistImage}
        />
      </div>
      <p className={styles.artistName}>{artist.name}</p>
    </div>
  );
};

export default ArtistCard; 