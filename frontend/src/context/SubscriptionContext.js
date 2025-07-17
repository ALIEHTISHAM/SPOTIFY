import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from './AuthContext';

// Create the context
const SubscriptionContext = createContext();

// Custom hook to use the subscription context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Provider component
export const SubscriptionProvider = ({ children }) => {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  // Check subscription status when auth state changes
  useEffect(() => {
    checkSubscriptionStatus();
  }, [isAuthenticated]);

  const checkSubscriptionStatus = async () => {
    if (!isAuthenticated) {
      setHasSubscription(false);
      setLoading(false);
      setSubscriptionDetails(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setHasSubscription(false);
        setLoading(false);
        setSubscriptionDetails(null);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/subscription/status', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Check if user has access based on subscription status and period end
      const hasAccess = response.data.hasSubscription;
      const isCancelled = response.data.status === 'cancelled';
      const currentPeriodEnd = new Date(response.data.currentPeriodEnd);
      const now = new Date();
      
      // User has access if either:
      // 1. Subscription is active and not cancelled
      // 2. Subscription is cancelled but still within the paid period
      const shouldHaveAccess = hasAccess && (!isCancelled || (isCancelled && currentPeriodEnd > now));
      
      setHasSubscription(shouldHaveAccess);
      setSubscriptionDetails({
        ...response.data,
        hasSubscription: shouldHaveAccess
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setError('Failed to check subscription status');
      setLoading(false);
      setHasSubscription(false);
      setSubscriptionDetails(null);
    }
  };

  const createCheckoutSession = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.post(
        'http://localhost:5000/api/subscription/create-checkout-session',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
      await stripe.redirectToCheckout({
        sessionId: response.data.sessionId
      });
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Failed to create checkout session');
      throw err;
    }
  };

  const cancelSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.post(
        'http://localhost:5000/api/subscription/cancel',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // After successful cancellation, refetch the subscription status to get the latest state from the backend
      await checkSubscriptionStatus(); 
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      // Even on error, attempt to refetch status in case of partial success
      checkSubscriptionStatus();
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to cancel subscription'
      };
    }
  };

  const value = {
    hasSubscription,
    loading,
    error,
    createCheckoutSession,
    checkSubscriptionStatus,
    cancelSubscription,
    subscriptionDetails // Ensure subscriptionDetails is included in the context value
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext; 