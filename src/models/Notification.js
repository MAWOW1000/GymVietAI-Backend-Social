const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('like', 'comment', 'follow', 'message', 'system'),
    allowNull: false
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  targetType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

// Define relationships
Notification.belongsTo(User, {
  foreignKey: {
    name: 'userId',
    allowNull: false
  },
  as: 'user'
});

Notification.belongsTo(User, {
  foreignKey: {
    name: 'senderId',
    allowNull: true
  },
  as: 'sender'
});

module.exports = Notification; 