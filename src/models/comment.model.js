import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { z } from 'zod';
import Profile from './profile.model.js';
import Post from './post.model.js';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Profile,
      key: 'id'
    }
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Post,
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of parent comment (for nested comments)'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  replyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  mediaUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'URL to attached media (if any)'
  },
  mentions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of user mentions in the comment'
  }
}, {
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['postId']
    },
    {
      fields: ['profileId']
    },
    {
      fields: ['parentId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Relationships
Comment.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Self-referential relationship for nested comments
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

Profile.hasMany(Comment, { foreignKey: 'profileId', as: 'comments' });
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });

// Zod schema for validation
export const CommentSchema = z.object({
  content: z.string().min(1).max(500),
  parentId: z.string().uuid().optional(),
  mediaUrl: z.string().url().optional(),
  mentions: z.array(z.string()).optional()
});

export default Comment; 