import React, { useEffect } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import '../styles/CancelSubscription.css';

const CancelSubscription = () => {
  const { hasSubscription, loading, cancelSubscription, subscriptionDetails } = useSubscription();
  const { user } = useAuth();

  useEffect(() => {
  }, [hasSubscription, loading, user, subscriptionDetails]);

  // Add detailed logs for rendering conditions
  useEffect(() => {
  }, [loading, subscriptionDetails]);

  if (loading) {
    return <div className="cancel-subscription-loading">Loading subscription status...</div>;
  }

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render logic based on subscription details from backend
  // Check if we should render null (no subscription details or cancelled and access ended)
  if (!subscriptionDetails || (subscriptionDetails.status === 'cancelled' && !subscriptionDetails.hasSubscription)) {
     return null;
  }

  // Check if we should show the cancelled message (cancelled in DB AND still has access)
  if (subscriptionDetails.status === 'cancelled' && subscriptionDetails.hasSubscription) {
    return (
      <div className="cancel-subscription">
        <h3>Subscription Management</h3>
        <p className="cancel-note">
          Your subscription is set to cancel on {formatDate(subscriptionDetails.currentPeriodEnd)}.
        </p>
      </div>
    );
  }

  // Check if we should show the cancel button (active in DB AND still has access)
  if (subscriptionDetails.status === 'active' && subscriptionDetails.hasSubscription) {
     const handleCancel = async () => {
      try {
        const result = await cancelSubscription();
        if (result.success) {
          alert('Your subscription will be cancelled at the end of the billing period.');
        } else {
          alert(result.message || 'Failed to cancel subscription. Please try again.');
        }
      } catch (error) {
        alert('An error occurred while cancelling your subscription. Please try again.');
      }
    };

    return (
      <div className="cancel-subscription">
        <h3>Subscription Management</h3>
        <button 
          className="cancel-button"
          onClick={handleCancel}
        >
          Cancel Subscription
        </button>
        <p className="cancel-note">
          Your subscription will remain active until the end of the current billing period.
        </p>
      </div>
    );
  }

  // Fallback: Should theoretically not be reached if logic covers all states, but included for safety
   return null;
};

export default CancelSubscription; 