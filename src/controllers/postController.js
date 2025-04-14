const { Post, User, Like } = require('../models');
const { Op } = require('sequelize');

// Create a new post
const createPost = async (req, res) => {
  try {
    const { content, media } = req.body;
    const userId = req.user.id;

    const post = await Post.create({
      content,
      media,
      userId
    });

    // Get post with author data
    const postWithAuthor = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'avatar']
        }
      ]
    });

    res.status(201).json({
      message: 'Post created successfully',
      post: postWithAuthor
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all posts (with pagination)
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const posts = await Post.findAndCountAll({
      where: { status: 'active' },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'avatar']
        }
      ]
    });

    res.json({
      posts: posts.rows,
      totalPosts: posts.count,
      totalPages: Math.ceil(posts.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific post
const getPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findOne({
      where: { id, status: 'active' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'avatar']
        },
        {
          model: Comment,
          as: 'comments',
          where: { status: 'active' },
          required: false,
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'fullName', 'avatar']
          }]
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if current user liked this post
    if (req.user) {
      const userLike = await Like.findOne({
        where: {
          userId: req.user.id,
          targetType: 'post',
          targetId: post.id
        }
      });
      post.dataValues.isLiked = !!userLike;
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, media } = req.body;
    const userId = req.user.id;

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Update post
    await post.update({
      content,
      media
    });

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Soft delete post by changing status
    await post.update({ status: 'deleted' });

    res.json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Like/unlike a post
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findOne({
      where: { id, status: 'active' }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already liked the post
    const existingLike = await Like.findOne({
      where: {
        userId,
        targetType: 'post',
        targetId: id
      }
    });

    let message;

    if (existingLike) {
      // Unlike: remove the like
      await existingLike.destroy();
      message = 'Post unliked successfully';

      // Decrement likes count
      await post.update({
        likesCount: Math.max(0, post.likesCount - 1)
      });
    } else {
      // Like: add a new like
      await Like.create({
        userId,
        targetType: 'post',
        targetId: id
      });
      message = 'Post liked successfully';

      // Increment likes count
      await post.update({
        likesCount: post.likesCount + 1
      });
    }

    res.json({
      message,
      likesCount: post.likesCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//search post
// const searchPosts = async (req, res) => {
//   const { query } = req.query;

//   if (!query) {
//     return res.status(400).json({ message: 'Missing search query' });
//   }
//   console.log('User is model:', User === Post.associations.author.target); // true?

//   try {
//     const posts = await Post.findAll({
//       where: {
//         status: 'active',
//         content: {
//           [Op.like]: `%${query}%`
//         }
//       },
//       include: [
//         {
//           model: User,
//           as: 'author',
//           attributes: ['id', 'username', 'fullName', 'avatar']
//         }
//       ],
//       order: [['createdAt', 'DESC']]
//     });

//     res.json(posts);
//   } catch (error) {
//     console.error('Error searching posts:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };
const searchPosts = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Missing search query' });
  }

  try {
    const posts = await Post.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          {
            content: {
              [Op.like]: `%${query}%`
            }
          },
          // Điều kiện nằm ở bảng liên kết User
          {
            '$author.username$': {
              [Op.like]: `%${query}%`
            }
          },
          {
            '$author.fullName$': {
              [Op.like]: `%${query}%`
            }
          }
        ]
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(posts);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  searchPosts
}; 