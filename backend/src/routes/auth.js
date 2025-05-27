const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Get current user route
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      artistProfile: user.artistProfile
    });
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

module.exports = router; 