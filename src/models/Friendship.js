const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Friendship = sequelize.define('Friendship', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined', 'blocked'),
    defaultValue: 'pending'
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  addresseeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  indexes: [
    {
      fields: ['requesterId', 'addresseeId'],
      unique: true
    }
  ]
});

module.exports = Friendship; 