const { Comment, User, Post, Like } = require('../models');
const { Op } = require('sequelize');

// Add a comment to a post
const addComment = async (req, res) => {
  try {
    const { postId, content, parentId } = req.body;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findOne({
      where: { id: postId, status: 'active' }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // If it's a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await Comment.findOne({
        where: { id: parentId, postId, status: 'active' }
      });

      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    // Create comment
    const comment = await Comment.create({
      postId,
      userId,
      content,
      parentId
    });

    // Increment comment count on post
    await post.update({
      commentsCount: post.commentsCount + 1
    });

    // Get comment with author
    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'avatar']
        }
      ]
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: commentWithAuthor
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get comments for a post
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check if post exists
    const post = await Post.findOne({
      where: { id: postId, status: 'active' }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get top-level comments
    const comments = await Comment.findAndCountAll({
      where: { 
        postId, 
        status: 'active',
        parentId: null
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'avatar']
        },
        {
          model: Comment,
          as: 'replies',
          where: { status: 'active' },
          required: false,
          limit: 5,
          order: [['createdAt', 'ASC']],
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'fullName', 'avatar']
          }]
        }
      ]
    });

    res.json({
      comments: comments.rows,
      totalComments: comments.count,
      totalPages: Math.ceil(comments.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Like/unlike a comment
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comment exists
    const comment = await Comment.findOne({
      where: { id, status: 'active' }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user already liked the comment
    const existingLike = await Like.findOne({
      where: {
        userId,
        targetType: 'comment',
        targetId: id
      }
    });

    let message;
    
    if (existingLike) {
      // Unlike: remove the like
      await existingLike.destroy();
      message = 'Comment unliked successfully';
      
      // Decrement likes count
      await comment.update({
        likesCount: Math.max(0, comment.likesCount - 1)
      });
    } else {
      // Like: add a new like
      await Like.create({
        userId,
        targetType: 'comment',
        targetId: id
      });
      message = 'Comment liked successfully';
      
      // Increment likes count
      await comment.update({
        likesCount: comment.likesCount + 1
      });
    }

    res.json({
      message,
      likesCount: comment.likesCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author of the comment
    if (comment.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Soft delete by changing status
    await comment.update({ status: 'deleted' });

    // Update post comment count
    const post = await Post.findByPk(comment.postId);
    if (post) {
      await post.update({
        commentsCount: Math.max(0, post.commentsCount - 1)
      });
    }

    res.json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addComment,
  getComments,
  toggleLike,
  deleteComment
}; 