const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./logger');

const authRoutes = require('./routes/auth');
const artistRoutes = require('./routes/artist');
const subscriptionRoutes = require('./routes/subscription');

const app = express();

// Middleware
app.use(cors());

// Log all incoming requests
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

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
app.use('/api/like', require('./routes/like'));
app.use('/api/comments', require('./routes/comment'));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Music Streaming Platform API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error occurred: %O', {
    message: err.message,
    stack: err.stack,
    status: err.status,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user ? req.user._id : undefined,
  });
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app; 