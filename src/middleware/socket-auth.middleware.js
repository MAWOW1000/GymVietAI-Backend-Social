import jwt from 'jsonwebtoken';
import { Profile } from '../models/index.js';

/**
 * Socket.io authentication middleware
 * Authenticates users connecting to websocket using JWT tokens
 * @param {Object} socket - Socket connection
 * @param {Function} next - Next function
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from handshake auth or query params
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId || !decoded.profileId) {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    // Find the profile
    const profile = await Profile.findByPk(decoded.profileId);
    
    if (!profile) {
      return next(new Error('Authentication error: Profile not found'));
    }
    
    // Add user data to socket
    socket.user = {
      id: profile.id,
      userId: decoded.userId,
      username: profile.username,
      displayName: profile.displayName,
      isVerified: profile.isVerified
    };
    
    // Log connection
    console.log(`Socket authenticated: ${socket.id} (User: ${profile.username})`);
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    return next(new Error(`Authentication error: ${error.message}`));
  }
};

export default socketAuthMiddleware; 