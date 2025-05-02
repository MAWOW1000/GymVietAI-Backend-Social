import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import {
  createComment,
  getPostComments,
  getCommentReplies,
  updateComment,
  deleteComment
} from '../controllers/comment.controller.js';

const router = express.Router();

/**
 * @route   POST /api/v1/comments
 * @desc    Create a new comment
 * @access  Private
 */
router.post('/', authenticate, createComment);

/**
 * @route   GET /api/v1/comments/post/:postId
 * @desc    Get comments for a post
 * @access  Public
 */
router.get('/post/:postId', optionalAuth, getPostComments);

/**
 * @route   GET /api/v1/comments/replies/:commentId
 * @desc    Get replies for a comment
 * @access  Public
 */
router.get('/replies/:commentId', optionalAuth, getCommentReplies);

/**
 * @route   PUT /api/v1/comments/:id
 * @desc    Update a comment
 * @access  Private
 */
router.put('/:id', authenticate, updateComment);

/**
 * @route   DELETE /api/v1/comments/:id
 * @desc    Delete a comment
 * @access  Private
 */
router.delete('/:id', authenticate, deleteComment);

export default router; 