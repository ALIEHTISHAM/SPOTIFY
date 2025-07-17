const express = require('express');
const router = express.Router();
const { getApprovedTracks, getApprovedTracksOptimized, getTracksAndCommentsForLoadTesting, getTracksAndCommentsOptimized, getAllArtists, getAllGenres } = require('../controllers/trackController');

// GET all approved tracks (public access)
router.get('/approved', getApprovedTracks);
router.get('/approved-optimized', getApprovedTracksOptimized);
router.get('/load-testing', getTracksAndCommentsForLoadTesting);
router.get('/load-testing-optimized', getTracksAndCommentsOptimized);
router.get('/artists', getAllArtists);
router.get('/genres', getAllGenres);

module.exports = router; 