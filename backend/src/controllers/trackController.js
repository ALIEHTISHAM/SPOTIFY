const Track = require('../models/Track');
const User = require('../models/User');
const path = require('path');
const logger = require('../logger');

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
    logger.error('Track upload error:', error);
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
    logger.error('Error fetching tracks:', error);
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
    logger.error('Error fetching approved tracks:', error);
    res.status(500).json({ message: 'Error fetching approved tracks' });
  }
};

// Get all approved tracks using aggregation (optimized version with full functionality)
const getApprovedTracksOptimized = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { q, genre, artist } = req.query;
    const mongoose = require('mongoose');
    const ObjectId = mongoose.Types.ObjectId;

    // Build match conditions
    let matchConditions = [{ status: 'approved' }];

    // Handle search by title or artist name
    if (q) {
      // First, get artist IDs that match the search query
      const artistDocs = await User.find({ name: { $regex: q, $options: 'i' } }, '_id');
      const artistIds = artistDocs.map(a => a._id);

      matchConditions.push({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { artist: { $in: artistIds } }
        ]
      });
    }

    // Handle genre filter
    if (genre) {
      matchConditions.push({ genre: genre });
    }

    // Handle artist filter (dropdown)
    if (artist) {
      const artistDocs = await User.find({ name: { $regex: artist, $options: 'i' } }, '_id');
      const filterArtistIds = artistDocs.map(a => a._id);
      matchConditions.push({ artist: { $in: filterArtistIds } });
    }

    // Combine all match conditions
    const matchStage = matchConditions.length === 1 
      ? { $match: matchConditions[0] }
      : { $match: { $and: matchConditions } };

    // Aggregation pipeline
    const result = await Track.aggregate([
      // Apply all filters
      matchStage,
      
      // Sort for pagination
      { $sort: { uploadDate: -1, _id: 1 } },
      
      // Use facet to get both paginated tracks and total count
      {
        $facet: {
          // Get paginated tracks
          tracks: [
            { $skip: skip },
            { $limit: limit },
            // Lookup artist information
            {
              $lookup: {
                from: 'users',
                localField: 'artist',
                foreignField: '_id',
                as: 'artistInfo'
              }
            },
            { $unwind: '$artistInfo' },
            // Project the final structure
            {
              $project: {
                _id: 1,
                title: 1,
                genre: 1,
                audioFile: 1,
                coverImage: 1,
                uploadDate: 1,
                status: 1,
                artist: {
                  _id: '$artistInfo._id',
                  name: '$artistInfo.name',
                  artistProfile: '$artistInfo.artistProfile'
                }
              }
            }
          ],
          // Get total count for pagination
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    const tracks = result[0]?.tracks || [];
    const total = result[0]?.total[0]?.count || 0;

    res.json({
      tracks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      method: 'aggregation' // To distinguish from the original method
    });
  } catch (error) {
    logger.error('Error fetching approved tracks (optimized):', error);
    res.status(500).json({ message: 'Error fetching approved tracks' });
  }
};

// Get tracks with comments for load testing (expensive operation)
const getTracksAndCommentsForLoadTesting = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Simple query - just get approved tracks
    const query = { status: 'approved' };

    // First, get the tracks for the current page
    const tracks = await Track.find(query)
      .populate('artist', 'name artistProfile')
      .sort({ uploadDate: -1, _id: 1 })
      .skip(skip)
      .limit(limit);

    // Get track IDs for comment fetching
    const trackIds = tracks.map(track => track._id);

    // Fetch ALL comments for these tracks (expensive operation for load testing)
    const Comment = require('../models/Comment');
    const comments = await Comment.find({ track: { $in: trackIds } })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Group comments by track ID
    const commentsByTrack = {};
    comments.forEach(comment => {
      const trackId = comment.track.toString();
      if (!commentsByTrack[trackId]) {
        commentsByTrack[trackId] = [];
      }
      commentsByTrack[trackId].push({
        _id: comment._id,
        text: comment.text,
        username: comment.user.name,
        createdAt: comment.createdAt
      });
    });

    // Attach comments to each track
    const tracksWithComments = tracks.map(track => {
      const trackObj = track.toObject();
      trackObj.comments = commentsByTrack[track._id.toString()] || [];
      return trackObj;
    });

    // Get total count for pagination
    const total = await Track.countDocuments(query);

    res.json({
      tracks: tracksWithComments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      commentsFetched: comments.length // Additional info for load testing
    });
  } catch (error) {
    logger.error('Error fetching tracks with comments for load testing:', error);
    res.status(500).json({ message: 'Error fetching tracks with comments' });
  }
};

// Get tracks with comments using aggregation (optimized version)
const getTracksAndCommentsOptimized = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const mongoose = require('mongoose');
    const ObjectId = mongoose.Types.ObjectId;

    // Single aggregation pipeline using facets
    const result = await Track.aggregate([
      // Match approved tracks
      { $match: { status: 'approved' } },
      
      // Sort for pagination
      { $sort: { uploadDate: -1, _id: 1 } },
      
      // Use facet to get both paginated tracks and total count
      {
        $facet: {
          // Get paginated tracks with comments
          tracks: [
            { $skip: skip },
            { $limit: limit },
            // Lookup artist information
            {
              $lookup: {
                from: 'users',
                localField: 'artist',
                foreignField: '_id',
                as: 'artistInfo'
              }
            },
            { $unwind: '$artistInfo' },
            // Lookup comments for each track
            {
              $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'track',
                as: 'comments'
              }
            },
            // Lookup user information for each comment
            {
              $lookup: {
                from: 'users',
                localField: 'comments.user',
                foreignField: '_id',
                as: 'commentUsers'
              }
            },
            // Project the final structure
            {
              $project: {
                _id: 1,
                title: 1,
                genre: 1,
                audioFile: 1,
                coverImage: 1,
                uploadDate: 1,
                artist: {
                  _id: '$artistInfo._id',
                  name: '$artistInfo.name',
                  artistProfile: '$artistInfo.artistProfile'
                },
                comments: {
                  $map: {
                    input: '$comments',
                    as: 'comment',
                    in: {
                      _id: '$$comment._id',
                      text: '$$comment.text',
                      createdAt: '$$comment.createdAt',
                      username: {
                        $let: {
                          vars: {
                            user: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: '$commentUsers',
                                    cond: { $eq: ['$$this._id', '$$comment.user'] }
                                  }
                                },
                                0
                              ]
                            }
                          },
                          in: '$$user.name'
                        }
                      }
                    }
                  }
                }
              }
            },
            // Sort comments by creation date (newest first)
            {
              $addFields: {
                comments: {
                  $sortArray: {
                    input: '$comments',
                    sortBy: { createdAt: -1 }
                  }
                }
              }
            }
          ],
          // Get total count for pagination
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    const tracks = result[0]?.tracks || [];
    const total = result[0]?.total[0]?.count || 0;
    const totalComments = tracks.reduce((sum, track) => sum + track.comments.length, 0);

    res.json({
      tracks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      commentsFetched: totalComments,
      method: 'aggregation' // To distinguish from the other method
    });
  } catch (error) {
    logger.error('Error fetching tracks with comments (optimized):', error);
    res.status(500).json({ message: 'Error fetching tracks with comments' });
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
  getApprovedTracksOptimized,
  getTracksAndCommentsForLoadTesting,
  getTracksAndCommentsOptimized,
  getAllArtists,
  getAllGenres,
};