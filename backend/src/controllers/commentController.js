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

// Reply to a comment (threaded, but all descendants of a reply are direct children of the first reply)
async function replyToComment(req, res) {
  try {
    const { trackId, text } = req.body;
    let parentId = req.params.commentId;
    const userId = req.user._id;

    // Find the parent comment
    let parentComment = await Comment.findById(parentId);
    if (!parentComment) {
      return res.status(404).json({ message: 'Parent comment not found' });
    }

    // If replying to a reply (or deeper), walk up until you find the first reply under the top-level comment
    while (parentComment.parent) {
      const grandParent = await Comment.findById(parentComment.parent);
      if (!grandParent) break;
      if (grandParent.parent === null) break; // parentComment is the first reply under top-level
      parentComment = grandParent;
    }
    // If parentComment.parent is not null, set parentId to parentComment._id
    if (parentComment.parent !== null) {
      parentId = parentComment._id;
    }
    // Otherwise, parentId stays as the top-level comment

    const comment = await Comment.create({ user: userId, track: trackId, parent: parentId, text });
    res.status(201).json({ message: 'Reply added', comment });
  } catch (error) {
    res.status(500).json({ message: 'Error adding reply', error: error.message });
  }
}

// Get comments for a track (top-level only, with nested replies)
async function getTrackComments(req, res) {
  try {
    const { trackId } = req.params;
    // Get top-level comments
    const comments = await Comment.find({ track: trackId, parent: null })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    // For each comment, fetch its replies
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parent: comment._id })
          .populate('user', 'name')
          .sort({ createdAt: 1 });
        return { ...comment.toObject(), replies };
      })
    );
    res.json({ trackId, comments: commentsWithReplies });
  } catch (error) {
    res.status(500).json({ message: 'Error getting comments', error: error.message });
  }
}

// Get all comments for a track as a flat array (for frontend grouping)
async function getAllTrackCommentsFlat(req, res) {
  try {
    const { trackId } = req.params;
    const comments = await Comment.find({ track: trackId })
      .populate('user', 'name')
      .sort({ createdAt: 1 });
    res.json({ trackId, comments });
  } catch (error) {
    res.status(500).json({ message: 'Error getting comments', error: error.message });
  }
}

module.exports = { addComment, replyToComment, getTrackComments, getAllTrackCommentsFlat }; 