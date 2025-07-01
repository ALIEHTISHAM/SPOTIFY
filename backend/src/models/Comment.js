const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
  track: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Comment', commentSchema); 