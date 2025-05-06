require("dotenv").config();
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import db from '../models/index';
import authService from '../service/authService';
import cacheUtils from '../utils/cacheUtils';

const nonSecurePaths = ['/login', '/loginGoogle', '/register', '/sendOTP', '/resetPassword', '/logout', '/user/update-subscription', '/refresh-token']

const checkUserJWT = async (req, res, next) => {
    try {
        if (nonSecurePaths.includes(req.path)) return next();
        const cookies = req.cookies;
        
        if (!cookies || !cookies['access-token'] || !cookies['refresh-token']) {
            return res.status(401).json({
                EC: -1,
                DT: '',
                EM: 'No authentication tokens found'
            });
        }

        // Initialize req.user
        req.user = {};

        const access_token = cookies['access-token'];
        const refresh_token = cookies['refresh-token'];
        
        // Check cache first
        const cacheKey = cacheUtils.generateKey('token', access_token);
        const cachedUser = await cacheUtils.get(cacheKey);
        
        if (cachedUser) {
            req.user = cachedUser;
            return next();
        }

        const verifyResult = await authService.verifyToken(access_token, refresh_token);
        if (verifyResult.EC === 0) {
            // Token còn hạn
            req.user.email = verifyResult.DT.email;
            // Cache the user data
            await cacheUtils.set(cacheKey, { email: verifyResult.DT.email }, 3600); // Cache for 1 hour
            return next();
        }

        if (verifyResult.EC === 1) {
            // Access token hết hạn nhưng refresh token còn hạn
            const newTokens = await authService.updateCookies(refresh_token);
            if (newTokens.EC === 0) {
                // Set cookie mới với access token mới
                res.cookie('access-token', newTokens.DT.access_token, {
                    maxAge: 3600000, // 1 hour
                    httpOnly: true
                });
                req.user.email = newTokens.DT.email;
                // Cache the user data with new token
                const newCacheKey = cacheUtils.generateKey('token', newTokens.DT.access_token);
                await cacheUtils.set(newCacheKey, { email: newTokens.DT.email }, 3600);
                return next();
            }
        }

        // Chỉ xóa cookies khi cả access và refresh đều hết hạn
        if (verifyResult.EC === 3) {
            res.clearCookie('access-token');
            res.clearCookie('refresh-token');
            return res.status(401).json({
                EC: 3,
                DT: '',
                EM: 'Session expired. Please login again.'
            });
        }

        // Các trường hợp lỗi khác không xóa cookie
        return res.status(401).json({
            EC: -1,
            DT: '',
            EM: verifyResult.EM || 'Authentication failed'
        });

    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            EC: -1,
            DT: '',
            EM: 'Internal server error during authentication'
        });
    }
};

const checkUserPermission = async (req, res, next) => {
    if (nonSecurePaths.includes(req.path)) return next();
    if (req.user) {
        try {
            // Get user with role and permissions
            const user = await db.User.findOne({
                where: { email: req.user.email },
                include: {
                    model: db.Role,
                    as: 'Role',
                    include: {
                        model: db.Permission,
                        as: 'Permissions',
                        attributes: ['id', 'url']
                    }
                }
            });

            if (!user) {
                return res.status(403).json({
                    EM: 'User not found',
                    EC: -1,
                    DT: []
                });
            }

            // Check if user has a role assigned
            if (!user.Role) {
                return res.status(403).json({
                    EM: 'User role not assigned',
                    EC: -1,
                    DT: []
                });
            }

            const currentUrl = req?.body?.path || req?.path;
            console.log('Current URL:', currentUrl);

            // Check if current URL matches permission for exercises or meal plans
            const isWorkoutPlanCreation = user.Role.Permissions && user.Role.Permissions.some(
                permission => permission.id === 8 && permission.url === currentUrl
            );

            const isNutritionPlanCreation = user.Role.Permissions && user.Role.Permissions.some(
                permission => permission.id === 9 && permission.url === currentUrl
            );

            const isChatUsage = user.Role.Permissions && user.Role.Permissions.some(
                permission => permission.id === 10 && permission.url === currentUrl
            );

            if (isWorkoutPlanCreation) {
                if (user.roleId === 2 && user.workoutPlanCount >= 3) {
                    return res.status(403).json({
                        EM: 'Free users can only create up to 3 exercises plan, Please upgrade to premium to create more',
                        EC: -1,
                        DT: []
                    });
                }
                await user.increment('workoutPlanCount', { by: 1 });
            }

            if (isNutritionPlanCreation) {
                if (user.roleId === 2 && user.nutritionPlanCount >= 3) {
                    return res.status(403).json({
                        EM: 'Free users can only create up to 3 meal plans, Please upgrade to premium to create more',
                        EC: -1,
                        DT: []
                    });
                }
                await user.increment('nutritionPlanCount', { by: 1 });
            }

            if (isChatUsage) {
                if (user.roleId === 2 && user.chatCount >= 10) {
                    console.log('Chat count:', user.chatCount);
                    console.log('User:', user);
                    return res.status(403).json({
                        EM: 'Free users can only use chat up to 10 times, Please upgrade to premium to chat more',
                        EC: -10,
                        DT: []
                    });
                }
                await user.increment('chatCount', { by: 1 });
            }

            // Check general permission - add null check for Permissions
            if (!user.Role.Permissions) {
                return res.status(403).json({
                    EM: 'User has no permissions assigned',
                    EC: -1,
                    DT: []
                });
            }

            const hasPermission = user.Role.Permissions.some(
                permission => permission.url === currentUrl
            );

            if (!hasPermission) {
                return res.status(403).json({
                    EM: 'You do not have permission to access this resource',
                    EC: -1,
                    DT: []
                });
            }

            return next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                EM: 'Error checking permissions',
                EC: -1,
                DT: []
            });
        }
    } else {
        return res.status(401).json({
            EM: 'User not authenticated',
            EC: -1,
            DT: []
        });
    }
}

const verifyJWT = async (req, res, next) => {
    try {
        // Get token from header or cookie
        const token = req.headers.authorization?.split(' ')[1] ||
            req.cookies['access-token']

        if (!token) {
            return res.status(401).json({
                EM: 'No token provided',
                EC: 1,
                DT: null
            });
        }

        // Verify token
        const verified = authService.verifyToken(token);
        if (verified.EC !== 0) {
            return res.status(401).json({
                EM: verified.EM,
                EC: verified.EC,
                DT: null
            });
        }

        // Add user data to request
        req.user = verified.DT;
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error);
        return res.status(500).json({
            EM: 'Internal server error',
            EC: -1,
            DT: null
        });
    }
};

module.exports = {
    checkUserJWT, checkUserPermission, verifyJWT
}