import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Hashtag = sequelize.define('Hashtag', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  postCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of posts using this hashtag'
  },
  trendScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Score determining how trending the tag is'
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'hashtags',
  timestamps: true,
  indexes: [
    {
      unique: true, 
      fields: ['name']
    },
    {
      fields: ['trendScore']
    },
    {
      fields: ['postCount']
    }
  ]
});

export default Hashtag; 