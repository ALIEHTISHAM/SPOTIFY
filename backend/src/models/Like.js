const mongoose = require('mongoose');
const likeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  track: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', index: true },
  createdAt: { type: Date, default: Date.now }
});
likeSchema.index({ user: 1, track: 1 }, { unique: true });
module.exports = mongoose.model('Like', likeSchema); 