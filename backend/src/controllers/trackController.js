const Track = require('../models/Track');
const User = require('../models/User');
const path = require('path');
const logger = require('../logger');
const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Helper to upload a file to S3
async function uploadFileToS3(file, folder) {
  const fileContent = file.buffer; // Use buffer from memoryStorage
  const fileName = `${folder}/${Date.now()}_${file.originalname}`;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: fileContent,
    ContentType: file.mimetype,
    // ACL: 'public-read', // Removed for compatibility with Bucket owner enforced
  };
  const data = await s3.upload(params).promise();
  return data.Location; // S3 URL
}

// Upload a new track
const uploadTrack = async (req, res) => {
  try {
    const { title, genre } = req.body;
    // Upload files to S3
    const audioFileS3Url = await uploadFileToS3(req.files['audioFile'][0], 'audio');
    const coverImageS3Url = await uploadFileToS3(req.files['coverImage'][0], 'images');

    // Create new track with S3 URLs
    const track = new Track({
      title,
      artist: req.user._id,
      genre,
      audioFile: audioFileS3Url,
      coverImage: coverImageS3Url
    });

    await track.save();
    logger.info('Saved track with S3 URLs:', {
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



// Get all approved tracks using aggregation (optimized version with full functionality)
const getApprovedTracks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { q, genre, artist } = req.query;
    const mongoose = require('mongoose');
    const ObjectId = mongoose.Types.ObjectId;
    const userId = req.user ? new ObjectId(String(req.user._id)) : null;

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

    // Build the aggregation pipeline step-by-step
    let pipeline = [];

    // 1. Initial match for tracks
    pipeline.push(matchStage);

    // 2. Lookup artist information
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistInfo'
      }
    });
    pipeline.push({ $unwind: '$artistInfo' });

    // 3. Conditionally add the 'liked' status check
    if (userId) {
      pipeline.push({
        $lookup: {
          from: 'likes',
          let: { trackId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [ { $toString: '$track' }, { $toString: '$$trackId' } ] },
                    { $eq: [ { $toString: '$user' }, userId.toString() ] }
                  ]
                }
              }
            }
          ],
          as: 'userLike'
        }
      });
      pipeline.push({
        $addFields: {
          isLiked: { $gt: [{ $size: '$userLike' }, 0] }
        }
      });
    }
    
    // 4. Project the final shape of the documents
    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        genre: 1,
        audioFile: 1,
        coverImage: 1,
        uploadDate: 1,
        status: 1,
        isLiked: { $ifNull: ['$isLiked', false] }, // Default to false if not logged in
        artist: {
          _id: '$artistInfo._id',
          name: '$artistInfo.name',
          artistProfile: '$artistInfo.artistProfile'
        }
      }
    });

    // 5. Use a final facet for pagination and total count
    pipeline.push({
      $facet: {
        tracks: [
          { $sort: { uploadDate: -1, _id: 1 } },
          { $skip: skip },
          { $limit: limit }
        ],
        total: [
          { $count: 'count' }
        ]
      }
    });


    const result = await Track.aggregate(pipeline);

    const tracks = result[0]?.tracks || [];
    const total = result[0]?.total[0]?.count || 0;

    res.json({
      tracks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      pageSize: tracks.length,
      method: 'aggregation' // To distinguish from the original method
    });
  } catch (error) {
    logger.error('Error fetching approved tracks (optimized):', error);
    res.status(500).json({ message: 'Error fetching approved tracks' });
  }
};

// Get tracks with comments for load testing (expensive operation)


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