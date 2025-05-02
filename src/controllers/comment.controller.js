import { Comment, Post, Profile, Notification } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { extractMentions } from '../utils/content.utils.js';

/**
 * Create a new comment on a post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createComment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId, profileId } = req.user; // Từ JWT auth middleware
    const { postId, content, parentId, mediaUrl } = req.body;
    
    // Kiểm tra post có tồn tại không
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Kiểm tra comment cha nếu có
    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        return res.status(404).json({
          status: 'error',
          message: 'Parent comment not found'
        });
      }
      
      // Đảm bảo parentId thuộc về post này
      if (parentComment.postId !== postId) {
        return res.status(400).json({
          status: 'error',
          message: 'Parent comment does not belong to this post'
        });
      }
    }
    
    // Trích xuất mentions
    const mentions = content ? extractMentions(content) : [];
    
    // Tạo comment mới
    const newComment = await Comment.create({
      content,
      profileId,
      postId,
      parentId,
      mediaUrl,
      mentions
    }, { transaction });
    
    // Tăng số lượt comment của post
    await post.increment('commentCount', { transaction });
    
    // Tăng số lượt reply cho comment cha (nếu có)
    if (parentComment) {
      await parentComment.increment('replyCount', { transaction });
    }
    
    // Tạo thông báo cho chủ bài đăng (nếu không phải chính họ comment)
    if (post.profileId !== profileId) {
      await Notification.create({
        recipientId: post.profileId,
        senderId: profileId,
        type: 'COMMENT',
        entityType: 'COMMENT',
        entityId: newComment.id,
        message: `@${req.user.username} commented on your post`,
        metadata: {
          postId: post.id
        }
      }, { transaction });
    }
    
    // Xử lý thông báo cho người được mention
    if (mentions.length > 0) {
      const mentionedProfiles = await Profile.findAll({
        where: { username: { [Op.in]: mentions } },
        transaction
      });
      
      for (const mentionedProfile of mentionedProfiles) {
        // Không thông báo cho chính mình
        if (mentionedProfile.id === profileId) continue;
        
        await Notification.create({
          recipientId: mentionedProfile.id,
          senderId: profileId,
          type: 'MENTION',
          entityType: 'COMMENT',
          entityId: newComment.id,
          message: `@${req.user.username} mentioned you in a comment`,
          metadata: {
            postId: post.id
          }
        }, { transaction });
      }
    }
    
    // Commit transaction
    await transaction.commit();
    
    // Lấy comment với thông tin profile
    const commentWithProfile = await Comment.findByPk(newComment.id, {
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified']
        }
      ]
    });
    
    // Gửi thông báo realtime qua socket.io
    const io = req.app.get('io');
    if (io) {
      // Thông báo cho chủ bài đăng
      if (post.profileId !== profileId) {
        io.to(`user:${post.profileId}`).emit('new_notification', {
          type: 'COMMENT',
          message: `@${req.user.username} commented on your post`,
          data: {
            postId: post.id,
            commentId: newComment.id
          }
        });
      }
      
      // Thông báo cho người được mention
      if (mentions.length > 0) {
        const mentionedProfiles = await Profile.findAll({
          where: { username: { [Op.in]: mentions } }
        });
        
        for (const profile of mentionedProfiles) {
          if (profile.id !== profileId) {
            io.to(`user:${profile.id}`).emit('new_notification', {
              type: 'MENTION',
              message: `@${req.user.username} mentioned you in a comment`,
              data: {
                postId: post.id,
                commentId: newComment.id
              }
            });
          }
        }
      }
    }
    
    return res.status(201).json({
      status: 'success',
      data: {
        comment: commentWithProfile
      }
    });
  } catch (error) {
    // Rollback transaction khi có lỗi
    await transaction.rollback();
    
    console.error('Error creating comment:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create comment'
    });
  }
};

/**
 * Get comments for a post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Kiểm tra post có tồn tại không
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Lấy comments cấp cao nhất (không có parentId)
    const comments = await Comment.findAndCountAll({
      where: { 
        postId,
        parentId: null
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
    
    return res.status(200).json({
      status: 'success',
      data: {
        comments: comments.rows,
        pagination: {
          total: comments.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(comments.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting post comments:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get post comments'
    });
  }
};

/**
 * Get replies for a comment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Kiểm tra comment có tồn tại không
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }
    
    // Lấy các replies
    const replies = await Comment.findAndCountAll({
      where: { parentId: commentId },
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
    
    return res.status(200).json({
      status: 'success',
      data: {
        replies: replies.rows,
        pagination: {
          total: replies.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(replies.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting comment replies:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get comment replies'
    });
  }
};

/**
 * Update a comment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { profileId } = req.user;
    const { content, mediaUrl } = req.body;
    
    // Kiểm tra comment có tồn tại không
    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }
    
    // Kiểm tra quyền sửa comment
    if (comment.profileId !== profileId) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update this comment'
      });
    }
    
    // Trích xuất mentions mới
    const mentions = content ? extractMentions(content) : [];
    
    // Cập nhật comment
    await comment.update({
      content,
      mediaUrl,
      mentions,
      isEdited: true
    });
    
    // Lấy comment đã cập nhật với thông tin profile
    const updatedComment = await Comment.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified']
        }
      ]
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        comment: updatedComment
      }
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update comment'
    });
  }
};

/**
 * Delete a comment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteComment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { profileId } = req.user;
    
    // Kiểm tra comment có tồn tại không
    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }
    
    // Kiểm tra quyền xóa comment
    if (comment.profileId !== profileId) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to delete this comment'
      });
    }
    
    // Giảm số lượt comment của post
    await Post.increment('commentCount', {
      by: -1,
      where: { id: comment.postId },
      transaction
    });
    
    // Giảm số lượt reply cho comment cha (nếu có)
    if (comment.parentId) {
      await Comment.increment('replyCount', {
        by: -1,
        where: { id: comment.parentId },
        transaction
      });
    }
    
    // Xóa comment
    await comment.destroy({ transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    // Rollback transaction khi có lỗi
    await transaction.rollback();
    
    console.error('Error deleting comment:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete comment'
    });
  }
};

export default {
  createComment,
  getPostComments,
  getCommentReplies,
  updateComment,
  deleteComment
}; 