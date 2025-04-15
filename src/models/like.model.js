import { DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Profile from './profile.model';
import Post from './post.model';

const Like = sequelize.define('Like', {
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
  }
}, {
  tableName: 'likes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['profileId', 'postId']
    }
  ]
});

// Relationships
Like.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });
Like.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

Profile.hasMany(Like, { foreignKey: 'profileId', as: 'likes' });
Post.hasMany(Like, { foreignKey: 'postId', as: 'likes' });

export default Like; 