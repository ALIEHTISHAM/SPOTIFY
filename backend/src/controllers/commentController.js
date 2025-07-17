const Comment = require('../models/Comment');
const Track = require('../models/Track');
const mongoose = require('mongoose');

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
      if (grandParent.parent === null) break; 
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

// async function getTrackCommentsHierarchical(req, res) {
//   try {
//     const { trackId } = req.params;
//     const comments = await Comment.find({ track: trackId })
//       .populate('user', 'name')
//       .sort({ createdAt: 1 });
//
//    
//     const commentMap = {};
//     comments.forEach(c => commentMap[c._id] = { ...c.toObject(), replies: [], descendants: [] });
//
//     const topLevel = [];
//     comments.forEach(c => {
//       if (!c.parent) {
//         topLevel.push(commentMap[c._id]);
//       } else {
//         const parent = commentMap[c.parent];
//         if (parent && !parent.parent) {
//           parent.replies.push(commentMap[c._id]);
//         } else if (parent) {
//           let firstReply = parent;
//           while (firstReply.parent && commentMap[firstReply.parent] && commentMap[firstReply.parent].parent) {
//             firstReply = commentMap[firstReply.parent];
//           }
//           firstReply.descendants.push(commentMap[c._id]);
//         }
//       }
//     });
//
//     const track = await Track.findById(trackId).populate('artist');
//     if (!track) return res.status(404).json({ message: 'Track not found' });
//     const artist = track.artist;
//     const artistName = artist.artistProfile?.artistName || artist.name || 'Unknown Artist';
//     const numTracksByArtist = await Track.countDocuments({ artist: artist._id });
//
//     res.json({
//       trackId,
//       comments: topLevel,
//       artist: {
//         _id: artist._id,
//         name: artistName,
//         numTracks: numTracksByArtist,
//       },
//       trackTitle: track.title,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error getting comments', error: error.message });
//   }
// }

/*async function getTrackCommentsHierarchicalAggregated(req, res) {
  try {
    const { trackId } = req.params;
    const ObjectId = mongoose.Types.ObjectId;

    // Aggregation with facets: fetch comments (with user), track (with artist), and artist's track count
    const result = await Comment.aggregate([
      { $match: { track: new ObjectId(trackId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $sort: { createdAt: 1 } },
      {
        $facet: {
          comments: [
            {
              $project: {
                _id: 1,
                content: '$text',
                parent: 1,
                createdAt: 1,
                user: { _id: '$user._id', name: '$user.name' },
              },
            },
          ],
          trackInfo: [
            {
              $limit: 1,
            },
            {
              $lookup: {
                from: 'tracks',
                let: { trackId: '$track' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', new ObjectId(trackId)] } } },
                  {
                    $lookup: {
                      from: 'users',
                      localField: 'artist',
                      foreignField: '_id',
                      as: 'artist',
                    },
                  },
                  { $unwind: '$artist' },
                  {
                    $project: {
                      _id: 1,
                      title: 1,
                      artist: {
                        _id: '$artist._id',
                        name: { $ifNull: ['$artist.artistProfile.artistName', '$artist.name'] },
                        artistProfile: '$artist.artistProfile',
                      },
                    },
                  },
                ],
                as: 'track',
              },
            },
            { $unwind: '$track' },
            {
              $addFields: {
                artistId: '$track.artist._id',
                trackTitle: '$track.title',
                artist: '$track.artist',
              },
            },
            {
              $lookup: {
                from: 'tracks',
                localField: 'artistId',
                foreignField: 'artist',
                as: 'artistTracks',
              },
            },
            {
              $addFields: {
                numTracks: { $size: '$artistTracks' },
              },
            },
            {
              $project: {
                trackTitle: 1,
                artist: 1,
                numTracks: 1,
              },
            },
          ],
        },
      },//Mongo compass aggregation query inside mongo compass and optmize query further
    ]);

    const comments = result[0]?.comments || [];
    const trackInfo = result[0]?.trackInfo?.[0];
    if (!trackInfo) {
      return res.status(404).json({ message: 'Track not found' });
    }

    const commentMap = {};
    comments.forEach(c => commentMap[c._id] = { ...c, replies: [], descendants: [] });

    const topLevel = [];
    comments.forEach(c => {
      if (!c.parent) {
        topLevel.push(commentMap[c._id]);
      } else {
        const parent = commentMap[c.parent];
        if (parent && !parent.parent) {
          parent.replies.push(commentMap[c._id]);
        } else if (parent) {
          let firstReply = parent;
          while (firstReply.parent && commentMap[firstReply.parent] && commentMap[firstReply.parent].parent) {
            firstReply = commentMap[firstReply.parent];
          }
          firstReply.descendants.push(commentMap[c._id]);
        }
      }
    });

    res.json({
      trackId,
      comments: topLevel,

      artist: {
        _id: trackInfo.artist._id,
        name: trackInfo.artist.name || 'Unknown Artist',
        numTracks: trackInfo.numTracks,
      },
      trackTitle: trackInfo.trackTitle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting comments', error: error.message });
  }
}*/

async function getTrackCommentsHierarchicalAggregated(req, res) {
  try {
    const { trackId } = req.params;
    const ObjectId = mongoose.Types.ObjectId;

    // Aggregation: start from tracks, lookup artist, comments, and artist's track count
    const result = await mongoose.model('Track').aggregate([
      { $match: { _id: new ObjectId(trackId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'artist',
          foreignField: '_id',
          as: 'artist'
        }
      },
      { $unwind: { path: '$artist', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'tracks',
          localField: 'artist._id',
          foreignField: 'artist',
          as: 'artistTracks'
        }
      },
      {
        $lookup: {
          from: 'comments',
          let: { trackId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$track', '$$trackId'] } } },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                //_id: 1,
                content: '$text',
                parent: 1,
                //createdAt: 1,
                user: { _id: '$user._id', name: '$user.name' }
              }
            }
          ],
          as: 'comments'
        }
      },
      {
        $project: {
          //_id:1,
          trackTitle: '$title',
          artist: {
            //_id: '$artist._id',
            name: { $ifNull: ['$artist.artistProfile.artistName', '$artist.name'] },
            //artistProfile: '$artist.artistProfile'
          },
          numTracks: { $size: '$artistTracks' },
          comments: 1
        }
      }
    ]);

    const track = result[0];
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Build hierarchy in JS (same as before)
    const comments = track.comments || [];
    const commentMap = {};
    comments.forEach(c => commentMap[c._id] = { ...c, replies: [], descendants: [] });

    const topLevel = [];
    comments.forEach(c => {
      if (!c.paenrt) {
        topLevel.push(commentMap[c._id]);
      } else {
        const parent = commentMap[c.parent];
        if (parent && !parent.parent) {
          parent.replies.push(commentMap[c._id]);
        } else if (parent) {
          let firstReply = parent;
          while (firstReply.parent && commentMap[firstReply.parent] && commentMap[firstReply.parent].parent) {
            firstReply = commentMap[firstReply.parent];
          }
          firstReply.descendants.push(commentMap[c._id]);
        }
      }
    });

    res.json({
      //trackId,
      comments: topLevel,
      artist: {
        //_id: track.artist._id,
        name: track.artist.name || 'Unknown Artist',
        numTracks: track.numTracks,
      },
      trackTitle: track.trackTitle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting comments', error: error.message });
  }
}

module.exports = { addComment, replyToComment, getTrackCommentsHierarchicalAggregated }; 