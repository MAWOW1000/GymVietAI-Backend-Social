const express = require('express');
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  searchPosts
} = require('../controllers/postController');
const { authenticate } = require('../middlewares/auth');
console.log('searchPosts type:', typeof searchPosts); // ⬅️ thêm dòng này

const router = express.Router();

// Apply authentication middleware to all post routes
router.use(authenticate);

// Routes
router.post('/', createPost);
// router.get('/', getPosts);
// router.get('/:id', getPost);
// router.put('/:id', updatePost);
// router.delete('/:id', deletePost);
// router.post('/:id/like', toggleLike);

//search posts by content
router.get('/search', searchPosts);

module.exports = router; 