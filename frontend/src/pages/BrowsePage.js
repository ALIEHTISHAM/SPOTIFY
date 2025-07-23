import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import '../styles/BrowsePage.css';
import AudioPlayer from '../components/AudioPlayer';
import TrackList from '../components/TrackList';
import Loader from '../components/Loader';

const BrowsePage = React.memo(() => {
  const { hasSubscription, createCheckoutSession, loading: subscriptionLoading, subscriptionDetails } = useSubscription();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    createCheckoutSession();
  };

  if (subscriptionLoading) {
    return <Loader />;
  }

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
      <TrackList
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        setTotalPages={setTotalPages}
        total={total}
        setTotal={setTotal}
        hasSubscription={hasSubscription}
        subscriptionDetails={subscriptionDetails}
      />
      {/* Pagination Controls */}
      <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '1.5rem 0' }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ marginRight: '1rem' }}>Previous</button>
        <span>Page {page} of {totalPages} ({total} tracks)</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ marginLeft: '1rem' }}>Next</button>
      </div>
      <AudioPlayer />
    </div>
  );
});

export default BrowsePage;