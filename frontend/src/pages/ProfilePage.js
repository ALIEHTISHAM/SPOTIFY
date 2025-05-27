import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import CancelSubscription from '../components/CancelSubscription';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const { hasSubscription, loading: subscriptionLoading } = useSubscription();

  // Add debug logs
  useEffect(() => {
    console.log('ProfilePage - Subscription state:', {
      hasSubscription,
      subscriptionLoading,
      user
    });
  }, [hasSubscription, subscriptionLoading, user]);

  if (!user) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Profile</h1>
      </div>
      <div className="profile-content">
        <div className="profile-info">
          <h2>Account Information</h2>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
        </div>
        
        {/* Add debug info */}
        <div style={{ margin: '20px 0', padding: '10px', background: '#f5f5f5' }}>
          <p>Subscription Status: {hasSubscription ? 'Active' : 'None'}</p>
          <p>Loading: {subscriptionLoading ? 'Yes' : 'No'}</p>
        </div>

        <CancelSubscription />
      </div>
    </div>
  );
};

export default ProfilePage; 