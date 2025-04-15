import jwt from 'jsonwebtoken';
import { Profile } from '../models/index.js';
import axios from 'axios';

// Cấu hình API Authen_service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8080';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware xác thực JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    // Tìm profile của user trong Social_service
    let profile = await Profile.findOne({ where: { userId: decoded.id } });

    // Nếu chưa có profile, tự động tạo mới từ thông tin Authen_service
    if (!profile) {
      try {
        console.log('Decoded token:', JSON.stringify(decoded));
        
        // Tạo username duy nhất từ email hoặc ID
        const email = decoded.email || `user_${decoded.id}@example.com`;
        let username = email.includes('@') ? email.split('@')[0] : `user_${decoded.id}`;
        
        // Đảm bảo username là duy nhất bằng cách thêm số random nếu cần
        let usernameExists = true;
        let attemptCount = 0;
        let uniqueUsername = username;
        
        while (usernameExists && attemptCount < 5) {
          const existingProfile = await Profile.findOne({ where: { username: uniqueUsername } });
          if (!existingProfile) {
            usernameExists = false;
          } else {
            uniqueUsername = `${username}_${Math.floor(Math.random() * 10000)}`;
            attemptCount++;
          }
        }
        
        // Tạo profile mới trong Social_service
        profile = await Profile.create({
          userId: decoded.id,
          username: uniqueUsername,
          displayName: `User ${uniqueUsername}`,
          profilePicture: null,
          isVerified: false
        });
      } catch (error) {
        console.error('Error creating profile:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to create profile'
        });
      }
    }

    // Lưu thông tin user vào request
    req.user = {
      userId: decoded.id,
      profileId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      isVerified: profile.isVerified,
      roleId: decoded.roleId
    };

    // Cập nhật lastActive
    await profile.update({ lastActive: new Date() });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware kiểm tra permission
 * @param {String|Array} requiredPermissions - Permission(s) cần kiểm tra
 */
export const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const token = req.headers.authorization.split(' ')[1];
      
      // Kiểm tra permission với Authen_service
      try {
        const permissionsToCheck = Array.isArray(requiredPermissions) 
          ? requiredPermissions 
          : [requiredPermissions];
        
        const response = await axios.post(`${AUTH_SERVICE_URL}/api/permission/check`, {
          permissions: permissionsToCheck
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.hasPermission) {
          return next();
        }
        
        return res.status(403).json({
          status: 'error',
          message: 'Permission denied'
        });
      } catch (error) {
        console.error('Permission check error:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Error checking permissions'
        });
      }
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Server error'
      });
    }
  };
};

/**
 * Middleware cho phép người dùng không đăng nhập truy cập
 * Nếu có token, lấy thông tin user
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Không có token, cho phép tiếp tục nhưng không có thông tin user
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.id) {
        // Tìm profile của user trong Social_service
        const profile = await Profile.findOne({ where: { userId: decoded.id } });
        
        if (profile) {
          req.user = {
            userId: decoded.id,
            profileId: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            isVerified: profile.isVerified,
            roleId: decoded.roleId
          };
          
          // Cập nhật lastActive
          await profile.update({ lastActive: new Date() });
        } else {
          req.user = null;
        }
      } else {
        req.user = null;
      }
    } catch (error) {
      // Token không hợp lệ hoặc hết hạn
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
}; 