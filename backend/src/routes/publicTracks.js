const express = require('express');
const router = express.Router();
const { getApprovedTracks, getAllArtists, getAllGenres } = require('../controllers/trackController');

// GET all approved tracks (public access)
router.get('/approved', getApprovedTracks);
router.get('/artists', getAllArtists);
router.get('/genres', getAllGenres);

module.exports = router; 