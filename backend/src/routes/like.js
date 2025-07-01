const express = require('express');
const router = express.Router();
const { likeTrack, unlikeTrack, getTrackLikes } = require('../controllers/likeController');
const { auth, requireSubscription } = require('../middleware/auth');

// Check if the current user has liked a track (renamed to avoid overlap)
router.get('/check-liked/:trackId', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const trackId = req.params.trackId;
    const Like = require('../models/Like');
    const like = await Like.findOne({ user: userId, track: trackId });
    res.json({ liked: !!like });
  } catch (err) {
    res.status(500).json({ liked: false, error: 'Error checking like status' });
  }
});

// Like a track
router.post('/like', auth, requireSubscription, likeTrack);
// Unlike a track
router.post('/unlike', auth, requireSubscription, unlikeTrack);
// Get like count for a track
router.get('/:trackId/likes', getTrackLikes);

module.exports = router; 