const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerArtist, loginArtist } = require('../controllers/artistController');
const { uploadTrack, getArtistTracks } = require('../controllers/trackController');
const { auth } = require('../middleware/auth');

// Use memoryStorage for multer (no local folders needed)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Artist routes are working' });
});

// Artist registration route
router.post('/register', registerArtist);

// Artist login route
router.post('/login', loginArtist);

// Track management routes (protected)
router.post('/upload', 
  auth,
  (req, res, next) => {
    upload.fields([
      { name: 'audioFile', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      }
      next();
    });
  },
  uploadTrack
);

router.get('/tracks', auth, getArtistTracks);

module.exports = router; 