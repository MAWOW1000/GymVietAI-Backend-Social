import jwt from 'jsonwebtoken';
import { Profile } from '../models/index.js';
import axios from 'axios';

// Cấu hình API Authen_service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8080';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Utility để tránh cập nhật lastActive quá thường xuyên
const shouldUpdateLastActive = (lastActiveTime) => {
  if (!lastActiveTime) return true;
  
  const now = new Date();
  const lastActive = new Date(lastActiveTime);
  
  // Chỉ cập nhật nếu đã qua ít nhất 5 phút
  const diffInMinutes = (now - lastActive) / (1000 * 60);
  return diffInMinutes >= 5;
};

// Hàm trích xuất thông tin quan trọng từ token, tách biệt xử lý cấu trúc token
const extractUserDataFromToken = (decoded) => {
  // Hỗ trợ nhiều cấu trúc token khác nhau
  const userId = decoded.userId || decoded.id || decoded.sub;
  
  // Thông tin tùy chọn
  const email = decoded.email;
  const username = decoded.username;
  const fullName = decoded.fullName || decoded.name;
  const roleId = decoded.roleId || decoded.role;
  
  return {
    userId,
    email,
    username,
    fullName, 
    roleId
  };
};

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
    const userData = extractUserDataFromToken(decoded);
    
    if (!userData.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token: missing user identifier'
      });
    }

    // Tìm profile của user trong Social_service
    let profile = await Profile.findOne({ where: { userId: userData.userId } });

    // Nếu chưa có profile, tự động tạo mới từ thông tin Authen_service
    if (!profile) {
      try {
        console.log('Decoded token:', JSON.stringify(decoded));
        
        // Tạo username duy nhất từ email hoặc ID
        const email = userData.email || `user_${userData.userId}@example.com`;
        let username = email.includes('@') ? email.split('@')[0] : `user_${userData.userId}`;
        
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
          userId: userData.userId,
          username: uniqueUsername,
          displayName: userData.fullName || `User ${uniqueUsername}`,
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
      userId: userData.userId,
      profileId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      isVerified: profile.isVerified,
      roleId: userData.roleId
    };

    // Cập nhật lastActive nếu cần
    if (shouldUpdateLastActive(profile.lastActive)) {
      await profile.update({ lastActive: new Date() });
    }

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
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // Thêm timeout để tránh chờ quá lâu
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
        
        // Nếu lỗi do không kết nối được đến Auth service
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          console.error('Auth service unavailable. Falling back to local permission check.');
          
          // Fallback: Kiểm tra permission cơ bản dựa vào roleId
          // Đây chỉ là giải pháp tạm thời, thực tế nên có caching hoặc logic phức tạp hơn
          const roleId = req.user.roleId;
          
          // Admin có tất cả quyền
          if (roleId === 'admin') {
            return next();
          }
          
          // Role manager có một số quyền nhất định
          if (roleId === 'manager' && 
              !permissionsToCheck.some(p => p.startsWith('admin.'))) {
            return next();
          }
          
          // Mặc định từ chối quyền nếu không thể xác minh với Auth service
          return res.status(403).json({
            status: 'error',
            message: 'Permission denied - Auth service unavailable'
          });
        }
        
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
      
      const userId = decoded.userId || decoded.id;
      if (userId) {
        // Tìm profile của user trong Social_service
        const profile = await Profile.findOne({ where: { userId } });
        
        if (profile) {
          req.user = {
            userId: userId,
            profileId: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            isVerified: profile.isVerified,
            roleId: decoded.roleId
          };
          
          // Cập nhật lastActive nếu cần
          if (shouldUpdateLastActive(profile.lastActive)) {
            await profile.update({ lastActive: new Date() });
          }
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