const Comment = require('../models/Comment');

// Add a comment to a track
async function addComment(req, res) {
  try {
    const { text } = req.body;
    const trackId = req.params.trackId;
    const userId = req.user._id;
    const comment = await Comment.create({ user: userId, track: trackId, text });
    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
}

// Reply to a comment (threaded)
async function replyToComment(req, res) {
  try {
    const { trackId, text } = req.body;
    const parentId = req.params.commentId;
    const userId = req.user._id;
    const comment = await Comment.create({ user: userId, track: trackId, parent: parentId, text });
    res.status(201).json({ message: 'Reply added', comment });
  } catch (error) {
    res.status(500).json({ message: 'Error adding reply', error: error.message });
  }
}

// Get comments for a track (top-level only, with optional threading)
async function getTrackComments(req, res) {
  try {
    const { trackId } = req.params;
    // Get top-level comments
    const comments = await Comment.find({ track: trackId, parent: null })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ trackId, comments });
  } catch (error) {
    res.status(500).json({ message: 'Error getting comments', error: error.message });
  }
}

// Get replies for a comment
async function getCommentReplies(req, res) {
  try {
    const { commentId } = req.params;
    const replies = await Comment.find({ parent: commentId })
      .populate('user', 'name')
      .sort({ createdAt: 1 });
    res.json({ commentId, replies });
  } catch (error) {
    res.status(500).json({ message: 'Error getting replies', error: error.message });
  }
}

module.exports = { addComment, replyToComment, getTrackComments, getCommentReplies }; 