const Track = require('../models/Track');
const User = require('../models/User');
const path = require('path');

// Upload a new track
const uploadTrack = async (req, res) => {
  try {
    const { title, genre } = req.body;
    
    // Log the full file information
    console.log('File upload details:', {
      audioFile: {
        originalname: req.files['audioFile'][0].originalname,
        path: req.files['audioFile'][0].path,
        filename: req.files['audioFile'][0].filename
      },
      coverImage: {
        originalname: req.files['coverImage'][0].originalname,
        path: req.files['coverImage'][0].path,
        filename: req.files['coverImage'][0].filename
      }
    });

    // Store just the filename for the database
    const audioFile = `uploads/audio/${req.files['audioFile'][0].filename}`;
    const coverImage = `uploads/images/${req.files['coverImage'][0].filename}`;

    // Create new track
    const track = new Track({
      title,
      artist: req.user._id,
      genre,
      audioFile,
      coverImage
    });

    await track.save();
    console.log('Saved track with paths:', {
      audioFile: track.audioFile,
      coverImage: track.coverImage
    });

    res.status(201).json({
      message: 'Track uploaded successfully',
      track
    });
  } catch (error) {
    console.error('Track upload error:', error);
    res.status(500).json({ message: 'Error uploading track' });
  }
};

// Get artist's tracks
const getArtistTracks = async (req, res) => {
  try {
    console.log('Fetching tracks for artist:', req.user._id);
    const tracks = await Track.find({ artist: req.user._id })
      .populate('artist', 'name artistProfile')
      .sort({ uploadDate: -1 });

    console.log('Retrieved tracks:', tracks.map(t => ({
      id: t._id,
      title: t.title,
      status: t.status,
      coverImage: t.coverImage
    })));

    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ message: 'Error fetching tracks' });
  }
};

// Get all approved tracks (for browsing - public)
const getApprovedTracks = async (req, res) => {
  try {
    const tracks = await Track.find({ status: 'approved' }).populate('artist', 'name artistProfile');
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching approved tracks:', error);
    res.status(500).json({ message: 'Error fetching approved tracks' });
  }
};

module.exports = {
  uploadTrack,
  getArtistTracks,
  getApprovedTracks,
};