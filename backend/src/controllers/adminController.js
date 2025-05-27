const Track = require('../models/Track');
const User = require('../models/User');

// Get all pending tracks
const getPendingTracks = async (req, res) => {
  try {
    const tracks = await Track.find({ status: 'pending' }).populate('artist', 'name artistProfile');
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching pending tracks:', error);
    res.status(500).json({ message: 'Error fetching pending tracks' });
  }
};

// Approve a track
const approveTrack = async (req, res) => {
  try {
    const trackId = req.params.id;
    const track = await Track.findByIdAndUpdate(trackId, { status: 'approved', adminFeedback: '' }, { new: true });
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }
    res.json({ message: 'Track approved', track });
  } catch (error) {
    console.error('Error approving track:', error);
    res.status(500).json({ message: 'Error approving track' });
  }
};

// Reject a track
const rejectTrack = async (req, res) => {
  try {
    const trackId = req.params.id;
    const { feedback } = req.body;
    const track = await Track.findByIdAndUpdate(trackId, { status: 'rejected', adminFeedback: feedback }, { new: true });
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }
    res.json({ message: 'Track rejected', track });
  } catch (error) {
    console.error('Error rejecting track:', error);
    res.status(500).json({ message: 'Error rejecting track' });
  }
};

// Temporary Admin Login (for development only - INSECURE)
const adminLoginTemporary = async (req, res) => {
  const TEMP_ADMIN_EMAIL = process.env.TEMP_ADMIN_EMAIL || 'admin@example.com'; // Use environment variables for slightly better practice
  const TEMP_ADMIN_PASSWORD = process.env.TEMP_ADMIN_PASSWORD || 'adminpassword';

  try {
    const { email, password } = req.body;

    // Check hardcoded credentials
    if (email === TEMP_ADMIN_EMAIL && password === TEMP_ADMIN_PASSWORD) {
      // Find the user with admin role (or create if needed - finding is safer)
      const adminUser = await User.findOne({ email: TEMP_ADMIN_EMAIL, role: 'admin' });

      if (!adminUser) {
        // If admin user doesn't exist in DB, maybe create a temporary one for testing?
        // For now, let's just return an error if not found.
        console.error('Temporary admin user not found in DB. Please create a user with email', TEMP_ADMIN_EMAIL, 'and role admin.');
        return res.status(404).json({ message: 'Admin user not configured in database' });
      }

      // Generate token for the admin user
      const jwt = require('jsonwebtoken');
      const generateToken = (userId) => {
        return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
      };
      const token = generateToken(adminUser._id);

      res.json({
        message: 'Temporary admin login successful',
        token,
        user: {
          id: adminUser._id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role
        }
      });

    } else {
      res.status(401).json({ message: 'Invalid temporary admin credentials' });
    }
  } catch (error) {
    console.error('Temporary admin login error:', error);
    res.status(500).json({ message: 'Server error during temporary admin login' });
  }
};

module.exports = {
  getPendingTracks,
  approveTrack,
  rejectTrack,
  adminLoginTemporary,
}; 