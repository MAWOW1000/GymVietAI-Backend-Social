import express from 'express';
import postRoutes from './post.route';
import likeRoutes from './like.route';
import followRoutes from './follow.route';
import notificationRoutes from './notification.route';
import profileRoutes from './profile.route';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Social service is running',
    timestamp: new Date().toISOString()
  });
});

// Prefix all routes with /api/v1
const apiRouter = express.Router();

// Profile routes
apiRouter.use('/profiles', profileRoutes);

// Post routes - some public endpoints with optional auth
apiRouter.use('/posts', postRoutes);

// Like routes - all require authentication
apiRouter.use('/likes', authenticate, likeRoutes);

// Follow routes - all require authentication
apiRouter.use('/follows', authenticate, followRoutes);

// Notification routes - all require authentication
apiRouter.use('/notifications', authenticate, notificationRoutes);

// Mount API router
router.use('/api/v1', apiRouter);

// Error handling for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

export default router; 