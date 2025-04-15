import { Op } from 'sequelize';
import { ProfileSchema } from '../models/profile.model.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { Profile, Follow, User, Post } from '../models/index.js';

/**
 * Create a new user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createProfile = async (req, res) => {
  try {
    const { userId, username, displayName, bio, profilePicture } = req.body;
    
    // Check if profile with this username or userId already exists
    const existingProfile = await Profile.findOne({
      where: {
        [Op.or]: [
          { username },
          { userId }
        ]
      }
    });
    
    if (existingProfile) {
      return res.status(409).json({
        status: 'error',
        message: existingProfile.username === username 
          ? 'Username already taken' 
          : 'Profile already exists for this user'
      });
    }
    
    // Create new profile
    const newProfile = await Profile.create({
      userId,
      username,
      displayName,
      bio,
      profilePicture
    });
    
    return res.status(201).json({
      status: 'success',
      data: {
        profile: newProfile
      }
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create profile'
    });
  }
};

/**
 * Get a profile by username or ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfile = async (req, res) => {
  try {
    // Check if we're using the by-user-id route or the standard identifier route
    const { identifier, userId } = req.params;
    const lookupValue = userId || identifier;
    const currentUser = req.user;
    
    console.log(`[ProfileController] Request params:`, {
      identifier,
      userId,
      lookupValue,
      path: req.path,
      originalUrl: req.originalUrl
    });
    
    // Determine lookup type - for by-user-id, we look up by userId field
    // Otherwise, determine if it's a UUID for id or use username
    let whereClause = {};
    
    if (userId) {
      // If using the by-user-id route, look up by userId field
      console.log(`[ProfileController] Looking up by userId: ${userId}`);
      whereClause = { userId: lookupValue };
    } else {
      // For standard route, determine if UUID or username
      const isUUID = z.string().uuid().safeParse(lookupValue).success;
      console.log(`[ProfileController] Looking up by ${isUUID ? 'UUID id' : 'username'}: ${lookupValue}`);
      whereClause = isUUID ? { id: lookupValue } : { username: lookupValue };
    }
    
    console.log(`[ProfileController] Final where clause:`, whereClause);
    
    const profile = await Profile.findOne({
      where: whereClause,
      attributes: { 
        exclude: ['deletedAt']
      }
    });
    
    if (!profile) {
      console.log(`[ProfileController] Profile not found for where clause:`, whereClause);
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }
    
    console.log(`[ProfileController] Profile found:`, {
      id: profile.id,
      userId: profile.userId,
      username: profile.username
    });
    
    // Check if current user follows this profile
    let isFollowing = false;
    let isFollowedBy = false;
    
    if (currentUser) {
      // Check if current user follows this profile
      const followRecord = await Follow.findOne({
        where: {
          followerId: currentUser.profileId,
          followingId: profile.id
        }
      });
      
      isFollowing = !!followRecord;
      
      // Check if this profile follows the current user
      const followerRecord = await Follow.findOne({
        where: {
          followerId: profile.id,
          followingId: currentUser.profileId
        }
      });
      
      isFollowedBy = !!followerRecord;
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        profile: {
          ...profile.toJSON(),
          isFollowing,
          isFollowedBy
        }
      }
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get profile'
    });
  }
};

/**
 * Update a user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfile = async (req, res) => {
  try {
    const { profileId } = req.user;
    const { displayName, bio, profilePicture, coverPicture } = req.body;
    
    const profile = await Profile.findByPk(profileId);
    
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }
    
    // Update profile
    await profile.update({
      displayName: displayName || profile.displayName,
      bio: bio !== undefined ? bio : profile.bio,
      profilePicture: profilePicture || profile.profilePicture,
      coverPicture: coverPicture || profile.coverPicture
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        profile
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
};

/**
 * Search for profiles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const searchProfiles = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const profiles = await Profile.findAndCountAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { displayName: { [Op.like]: `%${query}%` } }
        ]
      },
      limit,
      offset,
      order: [['followerCount', 'DESC']],
      attributes: { exclude: ['deletedAt'] }
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        profiles: profiles.rows,
        pagination: {
          total: profiles.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(profiles.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error searching profiles:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to search profiles'
    });
  }
};

/**
 * Get suggested profiles to follow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getSuggestedProfiles = async (req, res) => {
  try {
    const { profileId } = req.user;
    const { limit = 10 } = req.query;
    
    // Get IDs of profiles the user already follows
    const following = await Follow.findAll({
      where: { followerId: profileId },
      attributes: ['followingId']
    });
    
    const followingIds = following.map(f => f.followingId);
    followingIds.push(profileId); // Add user's own ID to exclude
    
    // Find profiles with most followers that user doesn't follow yet
    const suggestedProfiles = await Profile.findAll({
      where: {
        id: { [Op.notIn]: followingIds }
      },
      order: [['followerCount', 'DESC']],
      limit: parseInt(limit),
      attributes: { exclude: ['deletedAt'] }
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        profiles: suggestedProfiles
      }
    });
  } catch (error) {
    console.error('Error getting suggested profiles:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get suggested profiles'
    });
  }
};

/**
 * Get current user's profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCurrentUserProfile = async (req, res) => {
  try {
    const { profileId } = req.user;
    
    const profile = await Profile.findByPk(profileId, {
      attributes: { exclude: ['deletedAt'] }
    });
    
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        profile: profile.toJSON()
      }
    });
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get profile'
    });
  }
}; 