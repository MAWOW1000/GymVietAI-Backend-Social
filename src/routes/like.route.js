import express from 'express';
import { 
  likePost,
  unlikePost,
  getLikes
} from '../controller/like.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { paginationSchema } from '../middleware/validation.middleware';
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