const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Post = require('./Post');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'deleted', 'reported'),
    defaultValue: 'active'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Comments',
      key: 'id'
    }
  }
});

// Define relationships
Comment.belongsTo(User, {
  foreignKey: {
    name: 'userId',
    allowNull: false
  },
  as: 'author'
});

Comment.belongsTo(Post, {
  foreignKey: {
    name: 'postId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

// Self-referencing relationship for replies
Comment.hasMany(Comment, {
  foreignKey: 'parentId',
  as: 'replies'
});

module.exports = Comment; 