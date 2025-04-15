import { DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { z } from 'zod';

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'User ID from Authentication service'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  displayName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  bio: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  profilePicture: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  coverPicture: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  followerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  postCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_profiles',
  timestamps: true,
  paranoid: true, // Adds deletedAt column for soft deletes
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['userId']
    }
  ]
});

// Zod schema for validation
export const ProfileSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  profilePicture: z.string().url().optional(),
  coverPicture: z.string().url().optional(),
});

export default Profile; 