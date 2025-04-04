const express = require('express');
const {
  addComment,
  getComments,
  toggleLike,
  deleteComment
} = require('../controllers/commentController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Apply authentication middleware to all comment routes
router.use(authenticate);

// Routes
router.post('/', addComment);
router.get('/post/:postId', getComments);
router.post('/:id/like', toggleLike);
router.delete('/:id', deleteComment);

module.exports = router; 