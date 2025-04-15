import express from 'express';
import { 
  createProfile, 
  getProfile, 
  updateProfile, 
  searchProfiles,
  getSuggestedProfiles,
  getCurrentUserProfile
} from '../controllers/profile.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { ProfileSchema } from '../models/profile.model.js';
import { searchSchema } from '../middleware/validation.middleware.js';

const router = express.Router();

// Create a new profile
router.post(
  '/',
  validate(ProfileSchema),
  createProfile
);

// Get current user's profile
router.get(
  '/me',
  authenticate,
  getCurrentUserProfile
);

// Search for profiles
router.get(
  '/search',
  validate(searchSchema, 'query'),
  searchProfiles
);

// Get suggested profiles to follow
router.get(
  '/suggested',
  authenticate,
  getSuggestedProfiles
);

// Get a profile by username or ID (must be last as it's a catch-all)
router.get(
  '/:identifier',
  optionalAuth,
  getProfile
);

// Update current user's profile
router.put(
  '/',
  authenticate,
  validate(ProfileSchema.partial()),
  updateProfile
);

export default router; 