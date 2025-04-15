import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Profile from './profile.model.js';

const Follow = sequelize.define('Follow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  followerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Profile,
      key: 'id'
    },
    comment: 'ID of the profile that is following'
  },
  followingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Profile,
      key: 'id'
    },
    comment: 'ID of the profile being followed'
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'For private profiles, approval is required'
  }
}, {
  tableName: 'follows',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['followerId', 'followingId']
    }
  ]
});

// Relationships
Follow.belongsTo(Profile, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(Profile, { foreignKey: 'followingId', as: 'following' });

// A profile has many followers
Profile.hasMany(Follow, { foreignKey: 'followingId', as: 'followers' });

// A profile follows many other profiles
Profile.hasMany(Follow, { foreignKey: 'followerId', as: 'followings' });

export default Follow; 