import express from 'express';
import postRoutes from './post.route';
import likeRoutes from './like.route';
import followRoutes from './follow.route';
import notificationRoutes from './notification.route';
import profileRoutes from './profile.route';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

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
