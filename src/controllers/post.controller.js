import { Post, Profile, Like, Comment, Follow, Notification, Hashtag } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { extractHashtags, extractMentions } from '../utils/content.utils.js';
import axios from 'axios';

// Cấu hình API Authen_service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8080';

/**
 * Create a new post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createPost = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId, profileId } = req.user; // Lấy thông tin từ JWT auth middleware
    let { content, mediaUrls, parentId, isPublic = true, isRepost = false, originalPostId } = req.body;
    
    // Đảm bảo mediaUrls luôn là mảng
    if (mediaUrls && !Array.isArray(mediaUrls)) {
      if (typeof mediaUrls === 'string') {
        mediaUrls = [mediaUrls];
      } else {
        mediaUrls = [];
      }
    }
    
    // Nếu là repost, phải có originalPostId
    if (isRepost && !originalPostId) {
      return res.status(400).json({
        status: 'error',
        message: 'Original post ID is required for a repost'
      });
    }
    
    // Nếu không phải là repost, phải có nội dung hoặc media
    if (!isRepost && !content && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Post must contain either text content or media'
      });
    }
    
    // Kiểm tra và xử lý repost
    let originalPost = null;
    if (isRepost) {
      originalPost = await Post.findByPk(originalPostId);
      
      if (!originalPost) {
        return res.status(404).json({
          status: 'error',
          message: 'Original post not found'
        });
      }
    }
    
    // Check if this is a thread reply
    let parentPost = null;
    let rootThreadId = null;
    let threadPosition = 0;
    
    if (parentId) {
      parentPost = await Post.findByPk(parentId);
      
      if (!parentPost) {
        return res.status(404).json({
          status: 'error',
          message: 'Parent post not found'
        });
      }
      
      // Set thread information
      rootThreadId = parentPost.rootThreadId || parentPost.id;
      threadPosition = (parentPost.threadPosition || 0) + 1;
    }
    
    // Extract hashtags and mentions
    const tags = content ? extractHashtags(content) : [];
    const mentions = content ? extractMentions(content) : [];
    
    // Create the post
    const newPost = await Post.create({
      profileId,
      content,
      mediaUrls,
      parentId,
      rootThreadId,
      threadPosition,
      tags,
      mentions,
      isPublic,
      isRepost,
      originalPostId
    }, { transaction });
    
    // Update parent post's comment count if this is a reply
    if (parentId) {
      await parentPost.increment('commentCount', { transaction });
    }
    
    // Update original post's repost count if this is a repost
    if (isRepost && originalPost) {
      await originalPost.increment('repostCount', { transaction });
      
      // Tạo thông báo cho chủ bài đăng gốc
      if (originalPost.profileId !== profileId) {
        await Notification.create({
          recipientId: originalPost.profileId,
          senderId: profileId,
          type: 'REPOST',
          entityType: 'POST',
          entityId: newPost.id,
          message: `@${req.user.username} reposted your post`,
          metadata: {
            originalPostId
          }
        }, { transaction });
      }
    }
    
    // Update profile's post count
    await Profile.increment('postCount', {
      where: { id: profileId },
      transaction
    });
    
    // Process hashtags
    if (tags.length > 0) {
      for (const tag of tags) {
        // Find or create hashtag
        const [hashtag] = await Hashtag.findOrCreate({
          where: { name: tag.toLowerCase() },
          defaults: { name: tag.toLowerCase() },
          transaction
        });
        
        // Update counts
        await hashtag.increment('postCount', { transaction });
        
        // Update trend score (simplified algorithm)
        const now = new Date();
        const hoursSinceLastUpdate = hashtag.lastUpdated
          ? (now - new Date(hashtag.lastUpdated)) / (1000 * 60 * 60)
          : 0;
          
        // Decay score by 10% per hour passed
        const decayedScore = hashtag.trendScore * Math.pow(0.9, hoursSinceLastUpdate);
        const newScore = decayedScore + 1; // Add 1 for new post
        
        await hashtag.update({
          trendScore: newScore,
          lastUpdated: now
        }, { transaction });
      }
    }
    
    // Create notifications for mentions
    if (mentions.length > 0) {
      const mentionedProfiles = await Profile.findAll({
        where: { username: { [Op.in]: mentions } },
        transaction
      });
      
      for (const mentionedProfile of mentionedProfiles) {
        // Don't notify yourself
        if (mentionedProfile.id === profileId) continue;
        
        await Notification.create({
          recipientId: mentionedProfile.id,
          senderId: profileId,
          type: 'MENTION',
          entityType: 'POST',
          entityId: newPost.id,
          message: `@${req.user.username} mentioned you in a post`
        }, { transaction });
      }
    }
    
    // Commit transaction
    await transaction.commit();
    
    // Fetch the created post with profile information
    const postWithProfile = await Post.findByPk(newPost.id, {
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified']
        }
      ]
    });
    
    return res.status(201).json({
      status: 'success',
      data: {
        post: postWithProfile
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Error creating post:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create post'
    });
  }
};

/**
 * Get a post by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user; // Có thể null nếu chưa đăng nhập (optionalAuth)
    
    const post = await Post.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified']
        },
        {
          model: Post,
          as: 'parent',
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified']
            }
          ]
        }
      ]
    });
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Check if current user has liked this post
    let isLiked = false;
    
    if (currentUser) {
      const like = await Like.findOne({
        where: {
          postId: id,
          profileId: currentUser.profileId
        }
      });
      
      isLiked = !!like;
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        post: {
          ...post.toJSON(),
          isLiked
        }
      }
    });
  } catch (error) {
    console.error('Error getting post:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get post'
    });
  }
};

/**
 * Delete a post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deletePost = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { profileId } = req.user;
    
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Ensure user owns the post
    if (post.profileId !== profileId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this post'
      });
    }
    
    // Decrement parent's comment count if this was a reply
    if (post.parentId) {
      await Post.increment('commentCount', {
        by: -1,
        where: { id: post.parentId },
        transaction
      });
    }
    
    // Decrement profile's post count
    await Profile.increment('postCount', {
      by: -1,
      where: { id: profileId },
      transaction
    });
    
    // Delete the post
    await post.destroy({ transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return res.status(200).json({
      status: 'success',
      message: 'Post deleted successfully'
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Error deleting post:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete post'
    });
  }
};

/**
 * Get posts for feed
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getFeed = async (req, res) => {
  try {
    const { profileId } = req.user; // Từ JWT auth middleware
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get IDs of profiles the user follows
    const following = await Follow.findAll({
      where: { followerId: profileId },
      attributes: ['followingId']
    });
    
    const followingIds = following.map(f => f.followingId);
    followingIds.push(profileId); // Include user's own posts
    
    // Get posts from followed profiles
    const posts = await Post.findAndCountAll({
      where: {
        profileId: { [Op.in]: followingIds },
        parentId: null // Only get original posts, not replies
      },
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
    
    // Check which posts the user has liked
    const postIds = posts.rows.map(post => post.id);
    const likes = await Like.findAll({
      where: {
        postId: { [Op.in]: postIds },
        profileId
      }
    });
    
    const likedPostIds = likes.map(like => like.postId);
    
    // Add isLiked flag to posts
    const postsWithLikes = posts.rows.map(post => ({
      ...post.toJSON(),
      isLiked: likedPostIds.includes(post.id)
    }));
    
    return res.status(200).json({
      status: 'success',
      data: {
        posts: postsWithLikes,
        pagination: {
          total: posts.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(posts.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting feed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get feed'
    });
  }
};

/**
 * Get replies to a post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getReplies = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const currentUser = req.user;
    
    // Ensure post exists
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Get replies to post
    const replies = await Post.findAndCountAll({
      where: { parentId: id },
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset
    });
    
    // Check which posts the user has liked
    let likedPostIds = [];
    
    if (currentUser) {
      const postIds = replies.rows.map(reply => reply.id);
      const likes = await Like.findAll({
        where: {
          postId: { [Op.in]: postIds },
          profileId: currentUser.profileId
        }
      });
      
      likedPostIds = likes.map(like => like.postId);
    }
    
    // Add isLiked flag to replies
    const repliesWithLikes = replies.rows.map(reply => ({
      ...reply.toJSON(),
      isLiked: likedPostIds.includes(reply.id)
    }));
    
    return res.status(200).json({
      status: 'success',
      data: {
        replies: repliesWithLikes,
        pagination: {
          total: replies.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(replies.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting replies:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get replies'
    });
  }
};

/**
 * Get posts from a specific profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfilePosts = async (req, res) => {
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
    
    // Get posts by the profile
    const posts = await Post.findAndCountAll({
      where: {
        profileId: profile.id,
        parentId: null // Only get original posts, not replies
      },
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
    
    // Check which posts the user has liked
    let likedPostIds = [];
    
    if (currentUser) {
      const postIds = posts.rows.map(post => post.id);
      const likes = await Like.findAll({
        where: {
          postId: { [Op.in]: postIds },
          profileId: currentUser.profileId
        }
      });
      
      likedPostIds = likes.map(like => like.postId);
    }
    
    // Add isLiked flag to posts
    const postsWithLikes = posts.rows.map(post => ({
      ...post.toJSON(),
      isLiked: likedPostIds.includes(post.id)
    }));
    
    return res.status(200).json({
      status: 'success',
      data: {
        profile: {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          profilePicture: profile.profilePicture,
          isVerified: profile.isVerified
        },
        posts: postsWithLikes,
        pagination: {
          total: posts.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(posts.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting profile posts:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get profile posts'
    });
  }
}; 