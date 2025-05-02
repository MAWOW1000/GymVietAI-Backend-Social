import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { z } from 'zod';
import Profile from './profile.model.js';

const Post = sequelize.define('Post', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'If this is a thread reply, this points to the parent post'
  },
  rootThreadId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the original post that started the thread'
  },
  threadPosition: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Position in the thread chain, 0 for original posts'
  },
  mediaUrls: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of media URLs (images, videos)'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  repostCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isRepost: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  originalPostId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'If this is a repost, reference to the original post'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of hashtags in the post'
  },
  mentions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of user mentions in the post'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the post is public or only visible to followers'
  }
}, {
  tableName: 'posts',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['profileId']
    },
    {
      fields: ['parentId']
    },
    {
      fields: ['rootThreadId']
    },
    {
      fields: ['isRepost', 'originalPostId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Relationships
Post.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });
Profile.hasMany(Post, { foreignKey: 'profileId', as: 'posts' });

// Self-referential relationship for threads
Post.belongsTo(Post, { foreignKey: 'parentId', as: 'parent' });
Post.hasMany(Post, { foreignKey: 'parentId', as: 'replies' });

// Self-referential relationship for reposts
Post.belongsTo(Post, { foreignKey: 'originalPostId', as: 'originalPost' });
Post.hasMany(Post, { foreignKey: 'originalPostId', as: 'reposts' });

// Zod schema for validation
export const PostSchema = z.object({
  content: z.string().max(500, {
    message: "Nội dung không được vượt quá 500 ký tự"
  }).optional(),
  
  mediaUrls: z.union([
    z.array(z.string().url({
      message: "URL hình ảnh/video không hợp lệ"
    })).optional(),
    z.string().url({
      message: "URL hình ảnh/video không hợp lệ"
    }).optional().transform(val => val ? [val] : undefined)
  ]),
  
  parentId: z.string().uuid({
    message: "Parent ID phải là UUID hợp lệ"
  }).optional(),
  
  isPublic: z.boolean().optional(),
  
  tags: z.array(z.string()).optional(),
  
  mentions: z.array(z.string()).optional(),
  
  isRepost: z.boolean().optional(),
  
  originalPostId: z.string().uuid({
    message: "Original post ID phải là UUID hợp lệ"
  }).optional()
}).refine(
  data => !(data.isRepost === true && !data.originalPostId),
  {
    message: "Original post ID là bắt buộc khi tạo repost",
    path: ["originalPostId"]
  }
).refine(
  data => !(data.isRepost !== true && !data.content && (!data.mediaUrls || data.mediaUrls.length === 0)),
  {
    message: "Phải có nội dung hoặc hình ảnh/video cho bài đăng",
    path: ["content"]
  }
);

export default Post; 