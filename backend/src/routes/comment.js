const express = require('express');
const router = express.Router();
const { addComment, replyToComment, getTrackCommentsHierarchicalAggregated } = require('../controllers/commentController');
const { auth, requireSubscription } = require('../middleware/auth');

// Add a comment to a track
router.post('/track/:trackId/add', auth, requireSubscription, addComment);
// Reply to a comment
router.post('/comment/:commentId/reply', auth, requireSubscription, replyToComment);
// Get comments for a track
// Get comments for a track (hierarchical)
router.get('/track/:trackId/comments-hierarchical', getTrackCommentsHierarchicalAggregated);

module.exports = router; 