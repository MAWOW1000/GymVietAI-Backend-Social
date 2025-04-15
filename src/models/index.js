import sequelize from '../config/database';
import Profile from './profile.model';
import Post from './post.model';
import Like from './like.model';
import Comment from './comment.model';
import Follow from './follow.model';
import Notification from './notification.model';
import Hashtag from './hashtag.model';
import User from './User';

// Initialize models
const models = {
  Profile,
  Post,
  Like,
  Comment,
  Follow,
  Notification,
  Hashtag,
  User
};

// Define relationships
// Additional relationships can be defined here if needed
// Most are already defined in individual model files

// User - Post relationship
User.hasMany(Post, {
  foreignKey: 'userId',
  as: 'posts'
});

// Function to sync all models with the database
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('Database synced successfully');
    return true;
  } catch (error) {
    console.error('Error syncing database:', error);
    return false;
  }
};

export {
  sequelize,
  models,
  syncDatabase,
  Profile,
  Post,
  Like,
  Comment,
  Follow,
  Notification,
  Hashtag,
  User
}; 