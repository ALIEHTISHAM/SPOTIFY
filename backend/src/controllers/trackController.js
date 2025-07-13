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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { q, genre, artist } = req.query;
    let query = { status: 'approved' };

    // Handle search by title or artist name
    if (q) {
      // Find artist IDs matching q
      const artistDocs = await User.find({ name: { $regex: q, $options: 'i' } }, '_id');
      const artistIds = artistDocs.map(a => a._id);

      query = {
        ...query,
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { artist: { $in: artistIds } }
        ]
      };
    }

    // Handle genre filter
    if (genre) {
      query.genre = genre;
    }

    // Handle artist filter (dropdown)
    if (artist) {
      const artistDocs = await User.find({ name: { $regex: artist, $options: 'i' } }, '_id');
      const filterArtistIds = artistDocs.map(a => a._id);
      query.artist = { $in: filterArtistIds };
    }

    const [tracks, total] = await Promise.all([
      Track.find(query)
        .populate('artist', 'name artistProfile')
        .sort({ uploadDate: -1, _id: 1 }) // Stable, unique sort
        .skip(skip)
        .limit(limit),
      Track.countDocuments(query)
    ]);

    res.json({
      tracks,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching approved tracks:', error);
    res.status(500).json({ message: 'Error fetching approved tracks' });
  }
};

const getAllArtists = async (req, res) => {
  try {
    const artists = await Track.distinct('artist', { status: 'approved' });
    const artistDocs = await User.find({ _id: { $in: artists } }, 'name');
    const artistNames = artistDocs.map(a => a.name);
    res.json({ artists: artistNames });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching artists' });
  }
};

const getAllGenres = async (req, res) => {
  try {
    const genres = await Track.distinct('genre', { status: 'approved' });
    res.json({ genres });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching genres' });
  }
};

module.exports = {
  uploadTrack,
  getArtistTracks,
  getApprovedTracks,
  getAllArtists,
  getAllGenres,
};