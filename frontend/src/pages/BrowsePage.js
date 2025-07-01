import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import '../styles/BrowsePage.css';
import AudioPlayer from '../components/AudioPlayer';
import TrackList from '../components/TrackList';

const BrowsePage = () => {
  const { hasSubscription, createCheckoutSession, loading: subscriptionLoading, subscriptionDetails } = useSubscription();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/publicTracks/approved');
        setTracks(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load tracks. Please try again later.');
        setLoading(false);
      }
    };
    fetchTracks();
  }, []);

  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    createCheckoutSession();
  };

  if (loading || subscriptionLoading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="browse-page">
      <div className="browse-header">
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
      <TrackList tracks={tracks} hasSubscription={hasSubscription} subscriptionDetails={subscriptionDetails} />
      <AudioPlayer />
    </div>
  );
};

export default BrowsePage; 