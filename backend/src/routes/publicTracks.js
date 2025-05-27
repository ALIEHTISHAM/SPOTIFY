const express = require('express');
const router = express.Router();
const { getApprovedTracks } = require('../controllers/trackController');

// GET all approved tracks (public access)
router.get('/approved', getApprovedTracks);

module.exports = router; 