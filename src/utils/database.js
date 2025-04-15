import sequelize from '../config/database';
import { syncDatabase } from '../models';

/**
 * Initialize database connection and sync models
 * @returns {Promise<boolean>} True if initialization was successful
 */
export const initializeDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Sync models with database
    await syncDatabase({ alter: process.env.NODE_ENV === 'development' });
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = {
  initializeDatabase
}; 