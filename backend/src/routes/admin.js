const express = require('express');
const router = express.Router();
const { getPendingTracks, approveTrack, rejectTrack } = require('../controllers/adminController');
const { auth, checkRole } = require('../middleware/auth');
const { adminLoginTemporary } = require('../controllers/adminController');
// We will add authentication and role checking middleware here later

// Temporary Admin Login Route (INSECURE - for development only)
router.post('/login-temp', adminLoginTemporary);

// Protect all other admin routes with auth and admin role check
router.use(auth);
router.use(checkRole(['admin']));

// GET all pending tracks
router.get('/tracks/pending', getPendingTracks);

// PUT update track status to approved
router.put('/tracks/:id/approve', approveTrack);

// PUT update track status to rejected
router.put('/tracks/:id/reject', rejectTrack);

module.exports = router; 