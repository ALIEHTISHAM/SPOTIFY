const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Artist registration
const registerArtist = async (req, res) => {
  try {
    const { name, email, password, artistName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new artist user
    const artist = new User({
      name,
      email,
      password,
      role: 'artist',
      artistProfile: {
        artistName
      }
    });

    await artist.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: artist._id, role: artist.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Artist registered successfully',
      token,
      user: {
        id: artist._id,
        name: artist.name,
        email: artist.email,
        role: artist.role,
        artistProfile: artist.artistProfile
      }
    });
  } catch (error) {
    console.error('Artist registration error:', error);
    res.status(500).json({ message: 'Error registering artist' });
  }
};

// Artist login
const loginArtist = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find artist by email
    const artist = await User.findOne({ email, role: 'artist' });
    if (!artist) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await artist.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: artist._id, role: artist.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Artist logged in successfully',
      token,
      user: {
        id: artist._id,
        name: artist.name,
        email: artist.email,
        role: artist.role,
        artistProfile: artist.artistProfile
      }
    });
  } catch (error) {
    console.error('Artist login error:', error);
    res.status(500).json({ message: 'Error logging in artist' });
  }
};

module.exports = {
  registerArtist,
  loginArtist
}; 