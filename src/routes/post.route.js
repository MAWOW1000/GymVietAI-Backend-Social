import express from 'express';
import { 
  createPost,
  getPost,
  deletePost,
  getFeed,
  getReplies,
  getProfilePosts
} from '../controller/post.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { PostSchema } from '../models/post.model';
import { paginationSchema, idSchema } from '../middleware/validation.middleware';

const router = express.Router();

// Protected endpoints (require authentication)
router.post(
  '/',
  authenticate,
  validate(PostSchema),
  createPost
);

// Get feed (authenticated route)
router.get(
  '/feed',
  authenticate,
  validate(paginationSchema, 'query'),
  getFeed
);

// Get posts from a specific profile
router.get(
  '/profile/:identifier',
  validate(paginationSchema, 'query'),
  optionalAuth,
  getProfilePosts
);

// Public endpoints (with optional auth) - must be after specific routes
router.get(
  '/:id/replies',
  validate(idSchema, 'params'),
  validate(paginationSchema, 'query'),
  optionalAuth,
  getReplies
);

router.delete(
  '/:id',
  validate(idSchema, 'params'),
  authenticate,
  deletePost
);

// Get post by ID (must be last since it's a catch-all route)
router.get(
  '/:id',
  validate(idSchema, 'params'),
  optionalAuth,
  getPost
);

export default router; 