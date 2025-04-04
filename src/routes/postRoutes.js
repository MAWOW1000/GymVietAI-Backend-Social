const express = require('express');
const { 
  createPost, 
  getPosts, 
  getPost, 
  updatePost, 
  deletePost, 
  toggleLike 
} = require('../controllers/postController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Apply authentication middleware to all post routes
router.use(authenticate);

// Routes
router.post('/', createPost);
router.get('/', getPosts);
router.get('/:id', getPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/like', toggleLike);

module.exports = router; 