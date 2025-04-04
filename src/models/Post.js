const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  media: {
    type: DataTypes.JSON,
    allowNull: true
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sharesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'deleted', 'reported'),
    defaultValue: 'active'
  }
});

// Define relationship
Post.belongsTo(User, {
  foreignKey: {
    name: 'userId',
    allowNull: false
  },
  as: 'author'
});

module.exports = Post; 