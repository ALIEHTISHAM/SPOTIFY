const express = require('express');
const router = express.Router();
const { addComment, replyToComment, getTrackComments, getCommentReplies, getAllTrackCommentsFlat } = require('../controllers/commentController');
const { auth, requireSubscription } = require('../middleware/auth');

// Add a comment to a track
router.post('/track/:trackId/add', auth, requireSubscription, addComment);
// Reply to a comment
router.post('/comment/:commentId/reply', auth, requireSubscription, replyToComment);
// Get comments for a track
router.get('/track/:trackId/comments', getTrackComments);
// Get all comments for a track (flat)
router.get('/track/:trackId/comments-flat', getAllTrackCommentsFlat);

module.exports = router; 