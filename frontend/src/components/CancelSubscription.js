import React, { useEffect } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import '../styles/CancelSubscription.css';

const CancelSubscription = () => {
  const { hasSubscription, loading, cancelSubscription, subscriptionDetails } = useSubscription();
  const { user } = useAuth();

  useEffect(() => {
    console.log('CancelSubscription mounted');
    console.log('hasSubscription (from context):', hasSubscription);
    console.log('loading:', loading);
    console.log('user:', user);
    console.log('subscriptionDetails (from context):', subscriptionDetails);
  }, [hasSubscription, loading, user, subscriptionDetails]);

  // Add detailed logs for rendering conditions
  useEffect(() => {
    console.log('CancelSubscription rendering check:');
    console.log('  loading:', loading);
    console.log('  subscriptionDetails:', subscriptionDetails);
    if (subscriptionDetails) {
      console.log('  subscriptionDetails.status (from DB):', subscriptionDetails.status);
      console.log('  subscriptionDetails.hasSubscription (current access):', subscriptionDetails.hasSubscription);
      console.log('  subscriptionDetails.currentPeriodEnd:', subscriptionDetails.currentPeriodEnd);
      // Note: currentPeriodEnd here is the *effective* end date of access from the backend
      const effectiveEndDate = new Date(subscriptionDetails.currentPeriodEnd);
      console.log('  Effective end date object:', effectiveEndDate);
      console.log('  Current date object:', new Date());
      console.log('  Is effective end date <= current date:', effectiveEndDate <= new Date());
    }

    const isCancelledInDB = subscriptionDetails?.status === 'cancelled';
    const hasCurrentAccess = subscriptionDetails?.hasSubscription;
    const hasDetails = !!subscriptionDetails;

    const shouldReturnNull = !hasDetails || (isCancelledInDB && !hasCurrentAccess);
    const shouldShowCancelledMessage = hasDetails && isCancelledInDB && hasCurrentAccess; // Only show message if cancelled but still has access
    const shouldShowCancelButton = hasDetails && !isCancelledInDB && hasCurrentAccess; // Only show button if active in DB and has access

    console.log('  isCancelledInDB:', isCancelledInDB);
    console.log('  hasCurrentAccess:', hasCurrentAccess);
    console.log('  hasDetails:', hasDetails);
    console.log('  shouldReturnNull:', shouldReturnNull);
    console.log('  shouldShowCancelledMessage:', shouldShowCancelledMessage);
    console.log('  shouldShowCancelButton:', shouldShowCancelButton);

  }, [loading, subscriptionDetails]);

  if (loading) {
    console.log('CancelSubscription: Rendering loading state.');
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
     console.log('CancelSubscription: Returning null (no subscription or cancelled and access ended).');
     return null;
  }

  // Check if we should show the cancelled message (cancelled in DB AND still has access)
  if (subscriptionDetails.status === 'cancelled' && subscriptionDetails.hasSubscription) {
    console.log('CancelSubscription: Rendering cancelled message (DB status is cancelled and has access).');
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
     console.log('CancelSubscription: Rendering cancel button (DB status active and has access).');
     const handleCancel = async () => {
      try {
        const result = await cancelSubscription();
        console.log('Cancel subscription result:', result);
        if (result.success) {
          alert('Your subscription will be cancelled at the end of the billing period.');
        } else {
          alert(result.message || 'Failed to cancel subscription. Please try again.');
        }
      } catch (error) {
        console.error('Error cancelling subscription:', error);
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
   console.log('CancelSubscription: Returning null - Fallback.', subscriptionDetails);
   return null;
};

export default CancelSubscription; 