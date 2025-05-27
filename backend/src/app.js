const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const artistRoutes = require('./routes/artist');
const subscriptionRoutes = require('./routes/subscription');

const app = express();

// Middleware
app.use(cors());

// Regular middleware for all routes except webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/subscription/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Handle raw body for Stripe webhooks
app.use('/api/subscription/webhook', express.raw({type: 'application/json'}));

// URL encoded middleware
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/artist', artistRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/publicTracks', require('./routes/publicTracks'));
app.use('/api/subscription', subscriptionRoutes);



app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Music Streaming Platform API' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 