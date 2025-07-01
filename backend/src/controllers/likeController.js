const Like = require('../models/Like');

// Like a track
async function likeTrack(req, res) {
  try {
    const { trackId } = req.body;
    const userId = req.user._id;
    await Like.create({ user: userId, track: trackId });
    res.status(201).json({ message: 'Track liked' });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate like
      return res.status(400).json({ message: 'Track already liked' });
    }
    res.status(500).json({ message: 'Error liking track', error: error.message });
  }
}

// Unlike a track
async function unlikeTrack(req, res) {
  try {
    const { trackId } = req.body;
    const userId = req.user._id;
    await Like.deleteOne({ user: userId, track: trackId });
    res.json({ message: 'Track unliked' });
  } catch (error) {
    res.status(500).json({ message: 'Error unliking track', error: error.message });
  }
}

// Get like count for a track
async function getTrackLikes(req, res) {
  try {
    const { trackId } = req.params;
    const count = await Like.countDocuments({ track: trackId });
    res.json({ trackId, likeCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Error getting like count', error: error.message });
  }
}

module.exports = { likeTrack, unlikeTrack, getTrackLikes }; 