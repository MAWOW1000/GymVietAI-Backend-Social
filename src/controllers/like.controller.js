import { Like, Post, Profile, Notification } from '../models/index.js';
import sequelize from '../config/database.js';

/**
 * Like a post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const likePost = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { postId } = req.params;
    const { profileId } = req.user;
    
    // Check if post exists
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Check if already liked
    const existingLike = await Like.findOne({
      where: {
        postId,
        profileId
      }
    });
    
    if (existingLike) {
      return res.status(400).json({
        status: 'error',
        message: 'You already liked this post'
      });
    }
    
    // Create like
    await Like.create({
      postId,
      profileId
    }, { transaction });
    
    // Increment post's like count
    await post.increment('likeCount', { transaction });
    
    // Create notification if the post isn't user's own
    if (post.profileId !== profileId) {
      await Notification.create({
        recipientId: post.profileId,
        senderId: profileId,
        type: 'LIKE',
        entityType: 'POST',
        entityId: postId,
        message: `@${req.user.username} liked your post`
      }, { transaction });
    }
    
    // Commit transaction
    await transaction.commit();
    
    return res.status(200).json({
      status: 'success',
      message: 'Post liked successfully'
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Error liking post:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to like post'
    });
  }
};

/**
 * Unlike a post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const unlikePost = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { postId } = req.params;
    const { profileId } = req.user;
    
    // Check if post exists
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Check if like exists
    const like = await Like.findOne({
      where: {
        postId,
        profileId
      }
    });
    
    if (!like) {
      return res.status(400).json({
        status: 'error',
        message: 'You have not liked this post'
      });
    }
    
    // Delete like
    await like.destroy({ transaction });
    
    // Decrement post's like count
    if (post.likeCount > 0) {
      await post.decrement('likeCount', { transaction });
    }
    
    // Commit transaction
    await transaction.commit();
    
    return res.status(200).json({
      status: 'success',
      message: 'Post unliked successfully'
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Error unliking post:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to unlike post'
    });
  }
};

/**
 * Get users who liked a post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if post exists
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Get likes with profile information
    const { count, rows } = await Like.findAndCountAll({
      where: { postId },
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    // Format response
    const profiles = rows.map(like => like.profile);
    
    return res.status(200).json({
      status: 'success',
      data: {
        profiles,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting post likes:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get post likes'
    });
  }
}; 