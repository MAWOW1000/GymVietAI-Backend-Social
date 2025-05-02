import { Comment, Post, Profile, Notification, Follow } from '../../models/index.js';
import { z } from 'zod';
import sequelize from '../../config/database.js';

// Schema cho comment validation
const commentSchema = z.object({
  postId: z.string().uuid({
    message: "Post ID phải là UUID hợp lệ"
  }),
  content: z.string().min(1, {
    message: "Nội dung comment không được trống"
  }).max(1000, {
    message: "Nội dung comment không được quá 1000 ký tự"
  }),
  parentId: z.string().uuid({
    message: "Parent ID phải là UUID hợp lệ"
  }).optional(),
  mediaUrl: z.string().url({
    message: "Media URL không hợp lệ"
  }).optional()
});

/**
 * Socket handler for real-time comment functionality
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Client socket connection
 */
export const setupCommentHandlers = (io, socket) => {
  const user = socket.user;

  // Handler for new comment creation
  socket.on('create_comment', async (data) => {
    // Bắt đầu transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Validate input data with Zod
      const validationResult = commentSchema.safeParse(data);
      
      if (!validationResult.success) {
        await transaction.rollback();
        return socket.emit('error', { 
          type: 'COMMENT_ERROR', 
          message: 'Invalid comment data',
          errors: validationResult.error.format()
        });
      }
      
      const { postId, content, parentId, mediaUrl } = validationResult.data;
      
      // Check if post exists
      const post = await Post.findByPk(postId, { transaction });
      if (!post) {
        await transaction.rollback();
        return socket.emit('error', { 
          type: 'COMMENT_ERROR', 
          message: 'Post not found' 
        });
      }
      
      // Check if user has permission to comment (if post is not public)
      if (!post.isPublic) {
        // Check if user follows the post owner
        const isFollowing = await Follow.findOne({
          where: {
            followerId: user.id,
            followingId: post.profileId,
            isApproved: true
          }
        });
        
        // If not following and not the owner, deny access
        if (!isFollowing && post.profileId !== user.id) {
          await transaction.rollback();
          return socket.emit('error', {
            type: 'COMMENT_ERROR',
            message: 'You do not have permission to comment on this post'
          });
        }
      }
      
      // If this is a reply, check if parent comment exists
      if (parentId) {
        const parentComment = await Comment.findByPk(parentId, { transaction });
        if (!parentComment) {
          await transaction.rollback();
          return socket.emit('error', {
            type: 'COMMENT_ERROR',
            message: 'Parent comment not found'
          });
        }
        
        // Make sure parent comment is from same post
        if (parentComment.postId !== postId) {
          await transaction.rollback();
          return socket.emit('error', {
            type: 'COMMENT_ERROR',
            message: 'Parent comment does not belong to this post'
          });
        }
      }
      
      // Create comment in database
      const newComment = await Comment.create({
        content,
        profileId: user.id,
        postId,
        parentId,
        mediaUrl
      }, { transaction });
      
      // Increment post comment count
      await post.increment('commentCount', { transaction });
      
      // If this is a reply to another comment, increment reply count
      if (parentId) {
        const parentComment = await Comment.findByPk(parentId, { transaction });
        if (parentComment) {
          await parentComment.increment('replyCount', { transaction });
        }
      }
      
      // Create notification in database
      if (post.profileId !== user.id) {
        await Notification.create({
          recipientId: post.profileId,
          senderId: user.id,
          type: 'COMMENT',
          entityType: 'COMMENT',
          entityId: newComment.id,
          message: `@${user.username} commented on your post`
        }, { transaction });
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Get comment with profile info to send back - sau khi transaction hoàn tất
      const commentWithProfile = await Comment.findByPk(newComment.id, {
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified']
          }
        ]
      });
      
      // Send comment to all clients listening to this post
      io.to(`post:${postId}`).emit('new_comment', commentWithProfile);
      
      // Send real-time notification
      if (post.profileId !== user.id) {
        io.to(`user:${post.profileId}`).emit('notification', {
          type: 'COMMENT',
          message: `@${user.username} commented on your post`,
          data: {
            postId,
            commentId: newComment.id
          }
        });
      }
      
      // Send confirmation to sender
      socket.emit('comment_created', commentWithProfile);
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      
      console.error('Error in create_comment socket handler:', error);
      socket.emit('error', { 
        type: 'COMMENT_ERROR', 
        message: 'Failed to create comment' 
      });
    }
  });
  
  // Handler for typing indicator
  socket.on('comment_typing', (data) => {
    const { postId } = data;
    
    // Broadcast typing status to everyone in the post room except sender
    socket.to(`post:${postId}`).emit('user_typing_comment', {
      postId,
      user: {
        id: user.id,
        username: user.username
      }
    });
  });
  
  // Handler to join a post's comment room
  socket.on('join_post', (data) => {
    const { postId } = data;
    
    if (postId) {
      socket.join(`post:${postId}`);
      console.log(`User ${user.id} joined post:${postId} room`);
    }
  });
  
  // Handler to leave a post's comment room
  socket.on('leave_post', (data) => {
    const { postId } = data;
    
    if (postId) {
      socket.leave(`post:${postId}`);
      console.log(`User ${user.id} left post:${postId} room`);
    }
  });
};

export default setupCommentHandlers; 