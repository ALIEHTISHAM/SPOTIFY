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

module.exports = {
  getPendingTracks,
  approveTrack,
  rejectTrack,
}; 