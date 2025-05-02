import express from 'express';
import { 
  createProfile, 
  getProfile, 
  updateProfile, 
  searchProfiles,
  getSuggestedProfiles,
  getCurrentUserProfile,
  getProfileByUserId
} from '../controllers/profile.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { ProfileSchema } from '../models/profile.model.js';
import { searchSchema } from '../middleware/validation.middleware.js';
import Profile from '../models/profile.model.js';

const router = express.Router();

// Create a new profile
router.post(
  '/',
  authenticate,
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
  optionalAuth,
  validate(searchSchema, 'query'),
  searchProfiles
);

// Get suggested profiles to follow
router.get(
  '/suggested',
  authenticate,
  getSuggestedProfiles
);

// Debug route to check model structure
router.get('/debug/model', async (req, res) => {
  try {
    // Get model attributes
    const attributes = Object.keys(Profile.rawAttributes);
    
    // Check if any profiles exist
    const count = await Profile.count();
    
    // Get a sample profile if available (for testing userId field)
    let sampleProfile = null;
    if (count > 0) {
      sampleProfile = await Profile.findOne();
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        modelName: Profile.name,
        tableName: Profile.tableName,
        attributes,
        profileCount: count,
        hasUserIdField: attributes.includes('userId'),
        sampleProfileId: sampleProfile?.id,
        sampleUserId: sampleProfile?.userId,
        sampleUsername: sampleProfile?.username
      }
    });
  } catch (error) {
    console.error('Error in model debug route:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error checking model'
    });
  }
});

// Get a profile by user ID (auth ID)
router.get(
  '/by-user-id/:userId',
  optionalAuth,
  getProfileByUserId
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