const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Post = require('./Post');
const Comment = require('./Comment');

const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  targetType: {
    type: DataTypes.ENUM('post', 'comment'),
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  indexes: [
    {
      fields: ['userId', 'targetType', 'targetId'],
      unique: true
    }
  ]
});

// Define relationships
Like.belongsTo(User, {
  foreignKey: {
    name: 'userId',
    allowNull: false
  }
});

module.exports = Like; 