import express from 'express';
import { 
  followProfile,
  unfollowProfile,
  getFollowers,
  getFollowing
} from '../controller/follow.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { paginationSchema } from '../middleware/validation.middleware';
import { z } from 'zod';

// Tạo schema riêng cho tham số targetId
const targetIdSchema = z.object({
  targetId: z.string().uuid()
});

// Tạo schema cho tham số identifier (không cần là UUID)
const identifierSchema = z.object({
  identifier: z.string()
});

const router = express.Router();

// Follow a profile
router.post(
  '/:targetId',
  validate(targetIdSchema, 'params'),
  authenticate,
  followProfile
);

// Unfollow a profile
router.delete(
  '/:targetId',
  validate(targetIdSchema, 'params'),
  authenticate,
  unfollowProfile
);

// Get followers of a profile
router.get(
  '/followers/:identifier',
  validate(identifierSchema, 'params'),
  validate(paginationSchema, 'query'),
  optionalAuth,
  getFollowers
);

// Get profiles a user is following
router.get(
  '/following/:identifier',
  validate(identifierSchema, 'params'),
  validate(paginationSchema, 'query'),
  optionalAuth,
  getFollowing
);

export default router; 