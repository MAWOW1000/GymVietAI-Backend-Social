const User = require('./User');
const Post = require('./Post');


// Additional relationships not defined in individual model files

// User - Post relationship (already defined in Post.js)
User.hasMany(Post, {
  foreignKey: 'userId',
  as: 'posts'
});

// User - Comment relationship (already defined in Comment.js)


// Export all models
module.exports = {
  User,
  Post
}; 