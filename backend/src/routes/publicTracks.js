const express = require('express');
const router = express.Router();
const { getApprovedTracks, getAllArtists, getAllGenres } = require('../controllers/trackController');
const { optionalAuth } = require('../middleware/optionalAuth');

// GET all approved tracks (public access, but with optional auth for liked status)
router.get('/approved', optionalAuth, getApprovedTracks);
router.get('/artists', getAllArtists);
router.get('/genres', getAllGenres);

module.exports = router; 