const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Create a subscription checkout session
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    console.log('Creating checkout session for user:', req.user._id);
    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Create or get Stripe customer
    let customer;
    const existingSubscription = await Subscription.findOne({ user: req.user._id });
    
    if (existingSubscription) {
      console.log('Found existing subscription, retrieving customer');
      customer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
    } else {
      console.log('Creating new Stripe customer');
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: req.user._id.toString()
        }
      });
    }

    console.log('Creating checkout session for customer:', customer.id);
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/browse?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL}/browse?subscription=canceled`,
    });

    console.log('Checkout session created:', session.id);
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      message: 'Error creating checkout session',
      error: error.message 
    });
  }
});

// Get subscription status
router.get('/status', auth, async (req, res) => {
  try {
    console.log('Checking subscription for user:', req.user._id);
    
    // Find the most recent subscription
    const subscription = await Subscription.findOne({
      user: req.user._id
    }).sort({ createdAt: -1 });
    
    console.log('Found subscription:', subscription);
    
    if (!subscription) {
      console.log('No subscription found for user');
      return res.json({ 
        hasSubscription: false,
        status: 'none',
        plan: 'free'
      });
    }

    // Check if subscription is still valid (provides access)
    const currentDate = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
    console.log('Current date:', currentDate);
    console.log('Period end:', periodEnd);
    console.log('End date (if cancelled):', endDate);
    
    // hasSubscription indicates if the user currently has access
    const hasSubscription = (subscription.status === 'active' && periodEnd > currentDate) || 
                            (subscription.status === 'cancelled' && endDate && endDate > currentDate);
    
    console.log('Is subscription currently active (providing access):', hasSubscription);
    console.log('Subscription database status:', subscription.status);
    console.log('Period end > current date:', periodEnd > currentDate);
    console.log('Has end date:', !!endDate);
    console.log('End date > current date:', endDate && endDate > currentDate);

    // Update user's embedded subscription status (optional, but good practice)
     // Only update if there's a change to avoid unnecessary writes
     const currentUserSub = req.user.subscription || {};
     const statusToEmbed = hasSubscription ? subscription.status : (subscription.status === 'cancelled' ? 'cancelled' : 'expired');
     const currentPeriodEndToEmbed = hasSubscription ? (endDate || periodEnd) : (subscription.status === 'cancelled' ? endDate : null);

     if (currentUserSub.status !== statusToEmbed || currentUserSub.currentPeriodEnd?.getTime() !== currentPeriodEndToEmbed?.getTime()) {
        console.log(`Updating user embedded subscription status from ${currentUserSub.status} to ${statusToEmbed}`);
        await User.findByIdAndUpdate(req.user._id, {
          'subscription.status': statusToEmbed,
          'subscription.plan': subscription.plan,
          'subscription.stripeCustomerId': subscription.stripeCustomerId,
          'subscription.currentPeriodEnd': currentPeriodEndToEmbed
        });
     }


    const response = {
      hasSubscription: hasSubscription, // Still indicates access
      status: subscription.status,      // *** Send the actual database status ***
      plan: subscription.plan,
      currentPeriodEnd: endDate || periodEnd // Send the effective end date of access
    };
    
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ message: 'Error getting subscription status' });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    console.log('Cancelling subscription for user:', req.user._id);
    
    // Find the active subscription
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'active'
    });
    
    if (!subscription) {
      console.log('No active subscription found');
      return res.status(404).json({ message: 'No active subscription found' });
    }

    console.log('Found subscription to cancel:', subscription);

    // Cancel the subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true
      }
    );

    console.log('Stripe subscription updated:', stripeSubscription);

    // Update local subscription status
    subscription.status = 'cancelled';
    subscription.endDate = new Date(stripeSubscription.current_period_end * 1000);
    await subscription.save();

    console.log('Local subscription updated:', subscription);

    // Update user's subscription status
    await User.findByIdAndUpdate(req.user._id, {
      'subscription.status': 'cancelled',
      'subscription.currentPeriodEnd': subscription.endDate
    });

    console.log('User subscription status updated');

    res.json({ 
      message: 'Subscription will be cancelled at the end of the billing period',
      currentPeriodEnd: subscription.endDate
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      message: 'Error cancelling subscription',
      error: error.message 
    });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleSubscriptionCreated(session);
      break;
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await handleSubscriptionUpdated(subscription);
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      await handleSubscriptionDeleted(deletedSubscription);
      break;
  }

  res.json({received: true});
});

// Helper functions for webhook handlers
async function handleSubscriptionCreated(session) {
  try {
    console.log('Handling subscription creation:', session);
    const customer = await stripe.customers.retrieve(session.customer);
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    // Check for existing subscription
    let existingSubscription = await Subscription.findOne({
      user: customer.metadata.userId,
      stripeCustomerId: customer.id
    });

    if (existingSubscription) {
      console.log('Found existing subscription, updating it');
      // Update existing subscription
      existingSubscription.stripeSubscriptionId = subscription.id;
      existingSubscription.status = 'active';
      existingSubscription.plan = 'monthly';
      existingSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      existingSubscription.startDate = new Date();
      await existingSubscription.save();
    } else {
      console.log('Creating new subscription');
      // Create new subscription
      await Subscription.create({
        user: customer.metadata.userId,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        status: 'active',
        plan: 'monthly',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        startDate: new Date()
      });
    }
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Handling subscription update:', subscription);
    const dbSubscription = await Subscription.findOne({
      stripeCustomerId: subscription.customer
    });

    if (dbSubscription) {
      console.log('Found matching subscription in database:', dbSubscription._id);
      
      // Get the period end from Stripe, ensuring it's a valid date
      const periodEnd = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000)
        : dbSubscription.currentPeriodEnd; // Fallback to existing period end if Stripe data is missing

      console.log('Stripe period end:', periodEnd);
      console.log('Stripe cancel_at_period_end:', subscription.cancel_at_period_end);
      console.log('Stripe status:', subscription.status);

      // Determine the status to save in our database
      let newStatus = dbSubscription.status;
      let newEndDate = dbSubscription.endDate;
      let newCurrentPeriodEnd = periodEnd;

      if (subscription.cancel_at_period_end) {
        // If subscription is set to cancel at period end
        console.log('Subscription set to cancel at period end');
        newStatus = 'cancelled';
        // Keep the original period end date when cancelling
        newEndDate = periodEnd;
        newCurrentPeriodEnd = periodEnd;
      } else if (subscription.status === 'active') {
        // Active subscription
        console.log('Subscription is active');
        if (dbSubscription.status !== 'cancelled') {
          newStatus = 'active';
          newEndDate = null;
          newCurrentPeriodEnd = periodEnd;
        } else {
          // Keep cancelled status but maintain the original period end
          newStatus = 'cancelled';
          newEndDate = dbSubscription.endDate || periodEnd;
          newCurrentPeriodEnd = periodEnd;
        }
      } else if (subscription.status === 'canceled') {
        // Subscription has been fully cancelled
        console.log('Subscription is fully cancelled');
        newStatus = 'cancelled';
        // Maintain the original period end date
        newEndDate = periodEnd;
        newCurrentPeriodEnd = periodEnd;
      } else {
        // Handle other statuses
        console.log(`Handling other subscription status: ${subscription.status}`);
        newStatus = subscription.status;
        newCurrentPeriodEnd = periodEnd;
      }

      // Ensure we're not setting the period end to a date before the start date
      if (newCurrentPeriodEnd < dbSubscription.startDate) {
        console.log('Warning: Period end would be before start date, maintaining original period end');
        newCurrentPeriodEnd = dbSubscription.currentPeriodEnd;
      }

      // Update the database subscription document
      dbSubscription.status = newStatus;
      dbSubscription.endDate = newEndDate;
      dbSubscription.currentPeriodEnd = newCurrentPeriodEnd;
      dbSubscription.stripeSubscriptionId = subscription.id;
      await dbSubscription.save();

      console.log('Database subscription updated:', {
        status: dbSubscription.status,
        endDate: dbSubscription.endDate,
        currentPeriodEnd: dbSubscription.currentPeriodEnd
      });

      // Update user's embedded subscription
      const user = await User.findById(dbSubscription.user);
      if (user) {
        const userSub = user.subscription || {};
        // Determine if user should have access based on dates
        const now = new Date();
        const hasAccess = (dbSubscription.status === 'active' && newCurrentPeriodEnd > now) || 
                         (dbSubscription.status === 'cancelled' && newEndDate && newEndDate > now);
        
        const effectiveUserStatus = hasAccess ? 'active' : dbSubscription.status;
        const effectiveUserEndDate = newEndDate || newCurrentPeriodEnd;

        if (userSub.status !== effectiveUserStatus || 
            userSub.currentPeriodEnd?.getTime() !== effectiveUserEndDate?.getTime()) {
          console.log(`Updating user subscription status from ${userSub.status} to ${effectiveUserStatus}`);
          user.subscription.status = effectiveUserStatus;
          user.subscription.plan = dbSubscription.plan;
          user.subscription.stripeCustomerId = dbSubscription.stripeCustomerId;
          user.subscription.currentPeriodEnd = effectiveUserEndDate;
          await user.save();
          console.log('User subscription updated');
        }
      }
    } else {
      console.log('No matching subscription found in database for update');
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Handling subscription deletion:', subscription);
    const dbSubscription = await Subscription.findOne({
      stripeCustomerId: subscription.customer
    });

    if (dbSubscription) {
      dbSubscription.status = 'cancelled';
      dbSubscription.endDate = new Date();
      await dbSubscription.save();
      console.log('Subscription marked as cancelled');
    } else {
      console.log('No matching subscription found in database');
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

module.exports = router; 