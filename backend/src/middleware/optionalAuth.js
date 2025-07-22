const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../logger');

const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (use userId, not id)
      req.user = await User.findById(decoded.userId).select('-password');
    } catch (error) {
      // If token is invalid or expired, just ignore it and proceed without a user.
      logger.warn('Optional auth: Invalid token provided. Proceeding as guest.');
      req.user = null;
    }
  }

  next();
};

module.exports = { optionalAuth }; 