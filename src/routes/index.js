const express = require('express');
const authRoutes = require('./authRoutes');
const postRoutes = require('./postRoutes');
const commentRoutes = require('./commentRoutes');
const dashboardRoutes = require('./dashboardRoutes')
const router = express.Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Mount routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/posts`, postRoutes);
router.use(`${API_PREFIX}/comments`, commentRoutes);
router.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// Health check route
router.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running'
  });
});

module.exports = router; 