import express from 'express';
import postRoutes from './post.route.js';
import likeRoutes from './like.route.js';
import followRoutes from './follow.route.js';
import notificationRoutes from './notification.route.js';
import profileRoutes from './profile.route.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Social service is running',
    timestamp: new Date().toISOString()
  });
});

// Debug route to check environment and configuration
router.get('/debug', (req, res) => {
  // Gather available routes for documentation
  const routes = [];
  
  // Main API routes
  routes.push(`${API_PREFIX}/auth - Authentication routes`);
  routes.push(`${API_PREFIX}/profiles - Profile management`);
  routes.push(`${API_PREFIX}/profiles/by-user-id/:userId - Get profile by Auth userId`);
  routes.push(`${API_PREFIX}/profiles/:identifier - Get profile by username or ID`);
  routes.push(`${API_PREFIX}/posts - Post management`);
  routes.push(`${API_PREFIX}/follows - Follow relationships`);
  routes.push(`${API_PREFIX}/notifications - User notifications`);
  
  res.status(200).json({
    status: 'success',
    message: 'Social service debug information',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: API_PREFIX,
    availableRoutes: routes
  });
});

// Mount routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/profiles`, profileRoutes);
router.use(`${API_PREFIX}/posts`, postRoutes);
router.use(`${API_PREFIX}/likes`, authenticate, likeRoutes);
router.use(`${API_PREFIX}/follows`, authenticate, followRoutes);
router.use(`${API_PREFIX}/notifications`, authenticate, notificationRoutes);
router.use(`${API_PREFIX}/users`, userRoutes);

// Error handling for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

export default router;