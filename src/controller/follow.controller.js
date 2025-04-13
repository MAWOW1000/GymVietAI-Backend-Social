import { Follow, Profile, Notification } from '../models';
import { Op } from 'sequelize';
import sequelize from '../config/database';

/**
 * Follow a profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const followProfile = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { targetId } = req.params;
    const { profileId } = req.user;
    
    // Prevent following yourself
    if (targetId === profileId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot follow yourself'
      });
    }
    
    // Check if target profile exists
    const targetProfile = await Profile.findByPk(targetId);
    
    if (!targetProfile) {
      return res.status(404).json({
        status: 'error',
        message: 'Target profile not found'
      });
    }
    
    // Check if already following
    const existingFollow = await Follow.findOne({
      where: {
        followerId: profileId,
        followingId: targetId
      }
    });
    
    if (existingFollow) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already following this profile'
      });
    }
    
    // Determine if approval is needed
    const isApproved = !targetProfile.isPrivate;
    
    // Create follow relationship
    await Follow.create({
      followerId: profileId,
      followingId: targetId,
      isApproved
    }, { transaction });
    
    // If approved immediately, update follower/following counts
    if (isApproved) {
      // Increment follower count for target
      await targetProfile.increment('followerCount', { transaction });
      
      // Increment following count for current user
      await Profile.increment('followingCount', {
        where: { id: profileId },
        transaction
      });
      
      // Create notification
      await Notification.create({
        recipientId: targetId,
        senderId: profileId,
        type: 'FOLLOW',
        entityType: 'PROFILE',
        entityId: profileId,
        message: `@${req.user.username} started following you`
      }, { transaction });
    } else {
      // Create follow request notification
      await Notification.create({
        recipientId: targetId,
        senderId: profileId,
        type: 'FOLLOW_REQUEST',
        entityType: 'PROFILE',
        entityId: profileId,
        message: `@${req.user.username} requested to follow you`
      }, { transaction });
    }
    
    // Commit transaction
    await transaction.commit();
    
    return res.status(200).json({
      status: 'success',
      message: isApproved 
        ? 'Successfully followed profile' 
        : 'Follow request sent',
      data: {
        isApproved
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Error following profile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to follow profile'
    });
  }
};

/**
 * Unfollow a profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const unfollowProfile = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { targetId } = req.params;
    const { profileId } = req.user;
    
    // Prevent unfollowing yourself
    if (targetId === profileId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot unfollow yourself'
      });
    }
    
    // Check if target profile exists
    const targetProfile = await Profile.findByPk(targetId);
    
    if (!targetProfile) {
      return res.status(404).json({
        status: 'error',
        message: 'Target profile not found'
      });
    }
    
    // Check if following relationship exists
    const follow = await Follow.findOne({
      where: {
        followerId: profileId,
        followingId: targetId
      }
    });
    
    if (!follow) {
      return res.status(400).json({
        status: 'error',
        message: 'You are not following this profile'
      });
    }
    
    // If the follow was approved, update counts
    if (follow.isApproved) {
      // Decrement follower count for target
      if (targetProfile.followerCount > 0) {
        await targetProfile.decrement('followerCount', { transaction });
      }
      
      // Decrement following count for current user
      const currentProfile = await Profile.findByPk(profileId);
      if (currentProfile.followingCount > 0) {
        await currentProfile.decrement('followingCount', { transaction });
      }
    }
    
    // Delete follow relationship
    await follow.destroy({ transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return res.status(200).json({
      status: 'success',
      message: 'Successfully unfollowed profile'
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Error unfollowing profile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to unfollow profile'
    });
  }
};

/**
 * Get followers of a profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getFollowers = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const currentUser = req.user;
    
    // Determine if looking up by username or ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    // Find the profile
    const profile = await Profile.findOne({
      where: isUUID 
        ? { id: identifier }
        : { username: identifier }
    });
    
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }
    
    // Check privacy if not the profile owner
    const isOwner = currentUser && currentUser.profileId === profile.id;
    if (profile.isPrivate && !isOwner) {
      // Check if current user is following this profile
      const isFollowing = currentUser && await Follow.findOne({
        where: {
          followerId: currentUser.profileId,
          followingId: profile.id,
          isApproved: true
        }
      });
      
      if (!isFollowing) {
        return res.status(403).json({
          status: 'error',
          message: 'Profile is private'
        });
      }
    }
    
    // Get followers
    const { count, rows } = await Follow.findAndCountAll({
      where: {
        followingId: profile.id,
        isApproved: true
      },
      include: [
        {
          model: Profile,
          as: 'follower',
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified', 'bio']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    // Check if current user is following each profile
    let followingMap = {};
    
    if (currentUser) {
      const followerIds = rows.map(follow => follow.followerId);
      
      const followings = await Follow.findAll({
        where: {
          followerId: currentUser.profileId,
          followingId: { [Op.in]: followerIds },
          isApproved: true
        }
      });
      
      followingMap = followings.reduce((map, follow) => {
        map[follow.followingId] = true;
        return map;
      }, {});
    }
    
    // Format response
    const followers = rows.map(follow => ({
      ...follow.follower.toJSON(),
      isFollowing: !!followingMap[follow.followerId],
      isFollower: true
    }));
    
    return res.status(200).json({
      status: 'success',
      data: {
        followers,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting followers:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get followers'
    });
  }
};

/**
 * Get profiles a user is following
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getFollowing = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const currentUser = req.user;
    
    // Determine if looking up by username or ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    // Find the profile
    const profile = await Profile.findOne({
      where: isUUID 
        ? { id: identifier }
        : { username: identifier }
    });
    
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }
    
    // Check privacy if not the profile owner
    const isOwner = currentUser && currentUser.profileId === profile.id;
    if (profile.isPrivate && !isOwner) {
      // Check if current user is following this profile
      const isFollowing = currentUser && await Follow.findOne({
        where: {
          followerId: currentUser.profileId,
          followingId: profile.id,
          isApproved: true
        }
      });
      
      if (!isFollowing) {
        return res.status(403).json({
          status: 'error',
          message: 'Profile is private'
        });
      }
    }
    
    // Get following
    const { count, rows } = await Follow.findAndCountAll({
      where: {
        followerId: profile.id,
        isApproved: true
      },
      include: [
        {
          model: Profile,
          as: 'following',
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified', 'bio']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    // Check if current user is following each profile
    let followingMap = {};
    let followerMap = {};
    
    if (currentUser) {
      const followingIds = rows.map(follow => follow.followingId);
      
      // Check which profiles current user is following
      const userFollowings = await Follow.findAll({
        where: {
          followerId: currentUser.profileId,
          followingId: { [Op.in]: followingIds },
          isApproved: true
        }
      });
      
      followingMap = userFollowings.reduce((map, follow) => {
        map[follow.followingId] = true;
        return map;
      }, {});
      
      // Check which profiles are following current user
      const userFollowers = await Follow.findAll({
        where: {
          followerId: { [Op.in]: followingIds },
          followingId: currentUser.profileId,
          isApproved: true
        }
      });
      
      followerMap = userFollowers.reduce((map, follow) => {
        map[follow.followerId] = true;
        return map;
      }, {});
    }
    
    // Format response
    const following = rows.map(follow => ({
      ...follow.following.toJSON(),
      isFollowing: currentUser ? (followingMap[follow.followingId] || follow.followerId === currentUser.profileId) : false,
      isFollower: !!followerMap[follow.followingId]
    }));
    
    return res.status(200).json({
      status: 'success',
      data: {
        following,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting following:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get following'
    });
  }
}; 