import express from 'express';
import { 
  likePost,
  unlikePost,
  getLikes
} from '../controllers/like.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { paginationSchema } from '../middleware/validation.middleware.js';
import { z } from 'zod';

// Tạo schema riêng cho tham số postId
const postIdSchema = z.object({
  postId: z.string().uuid()
});

const router = express.Router();

// Like a post
router.post(
  '/:postId',
  validate(postIdSchema, 'params'),
  authenticate,
  likePost
);

// Unlike a post
router.delete(
  '/:postId',
  validate(postIdSchema, 'params'),
  authenticate,
  unlikePost
);

// Get users who liked a post
router.get(
  '/:postId',
  validate(postIdSchema, 'params'),
  validate(paginationSchema, 'query'),
  optionalAuth,
  getLikes
);

export default router; 