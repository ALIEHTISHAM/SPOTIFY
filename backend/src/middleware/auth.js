const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      throw new Error('User not found');
    }

    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      artistProfile: user.artistProfile
    };
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Middleware to require active subscription
const requireSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // Find the most recent subscription
    const subscription = await Subscription.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!subscription) {
      return res.status(403).json({ message: 'Subscription required' });
    }
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
    const hasAccess = (subscription.status === 'active' && periodEnd > now) ||
                      (subscription.status === 'cancelled' && endDate && endDate > now);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Subscription required' });
    }
    next();
  } catch (error) {
    console.error('requireSubscription middleware error:', error.message);
    res.status(500).json({ message: 'Error checking subscription' });
  }
};

module.exports = { auth, checkRole, requireSubscription }; 