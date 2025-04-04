const User = require('./User');
const Post = require('./Post');
const Comment = require('./Comment');
const Like = require('./Like');
const Friendship = require('./Friendship');
const Message = require('./Message');
const Notification = require('./Notification');

// Additional relationships not defined in individual model files

// User - Post relationship (already defined in Post.js)
User.hasMany(Post, {
  foreignKey: 'userId',
  as: 'posts'
});

// User - Comment relationship (already defined in Comment.js)
User.hasMany(Comment, {
  foreignKey: 'userId',
  as: 'comments'
});

// User - Like relationship (already defined in Like.js)
User.hasMany(Like, {
  foreignKey: 'userId',
  as: 'likes'
});

// User - Notification relationship (already defined in Notification.js)
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications'
});

// Post - Comment relationship (already defined in Comment.js)
Post.hasMany(Comment, {
  foreignKey: 'postId',
  as: 'comments'
});

// Export all models
module.exports = {
  User,
  Post,
  Comment,
  Like,
  Friendship,
  Message,
  Notification
}; 