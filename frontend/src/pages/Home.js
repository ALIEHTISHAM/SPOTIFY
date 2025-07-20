// TODO: This file contains dummy data for development only. Replace with real API call before production.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ArtistCard from '../components/ArtistCard';
import styles from '../styles/Home.module.css';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [artists, setArtists] = useState([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // TODO: Replace with actual API call to fetch artists
    const fetchArtists = async () => {
      // Simulate fetching data
      const dummyArtists = [
        { id: 1, name: 'Eminem', imageUrl: '/assets/eminem.jpg' },
        { id: 2, name: 'Kendrick Lamar', imageUrl: '/assets/kendrick.jpg' },
        { id: 3, name: 'Pop Smoke', imageUrl: '/assets/pop.jpg' },
        { id: 4, name: '50 Cent', imageUrl: '/assets/50.jpg' },
      ];
      setArtists(dummyArtists);
    };

    fetchArtists();
  }, []);

  return (
    <div className={styles.home}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Your Music, Your Way</h1>
          <p className={styles.heroSubtitle}>
            Discover new artists, share your music, and connect with fans worldwide.
            Join the next generation of music streaming.
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/register" className={styles.primaryButton}>
              <span>▶</span> Get Started
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className={styles.secondaryButton}>
                Login
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className={styles.contentSections}>
        <section>
          <h2 className={styles.sectionTitle}>Why Choose Us</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎵</div>
              <h3 className={styles.featureTitle}>Discover New Music</h3>
              <p className={styles.featureDescription}>
                Explore a vast library of tracks from emerging and established artists.
                Find your next favorite song with our personalized recommendations.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎤</div>
              <h3 className={styles.featureTitle}>Share Your Music</h3>
              <p className={styles.featureDescription}>
                Upload your tracks, build your profile, and connect with fans.
                Get your music heard by listeners around the world.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎧</div>
              <h3 className={styles.featureTitle}>High Quality Audio</h3>
              <p className={styles.featureDescription}>
                Experience your music in crystal clear quality.
                Stream your favorite tracks with premium sound.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.artistsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Artists</h2>
            <Link to="/browse" className={styles.seeAllLink}>See All Artists</Link>
          </div>
          <div className={styles.artistsGrid}>
            {artists.map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home; 