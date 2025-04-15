import { DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Profile from './profile.model';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Profile,
      key: 'id'
    },
    comment: 'Profile ID of the notification recipient'
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Profile,
      key: 'id'
    },
    comment: 'Profile ID of the user who triggered the notification (if applicable)'
  },
  type: {
    type: DataTypes.ENUM(
      'LIKE', 
      'COMMENT', 
      'FOLLOW', 
      'MENTION', 
      'REPLY', 
      'REPOST', 
      'FOLLOW_REQUEST',
      'SYSTEM'
    ),
    allowNull: false
  },
  entityType: {
    type: DataTypes.ENUM('POST', 'COMMENT', 'PROFILE', 'SYSTEM'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID of the related entity (post ID, comment ID, etc.)'
  },
  message: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data related to the notification'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['recipientId']
    },
    {
      fields: ['isRead']
    },
    {
      fields: ['type']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Relationships
Notification.belongsTo(Profile, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(Profile, { foreignKey: 'senderId', as: 'sender' });

// A profile has many notifications
Profile.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications' });

export default Notification; 