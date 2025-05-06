import express from 'express';
import authController from '../controller/authController';
import userController from '../controller/userController';
import roleController from '../controller/roleController';
import permissionController from '../controller/permissionController';
import permissionRoleController from '../controller/permissionRoleController';
import merliveController from '../controller/merliveController';
import { checkUserJWT, checkUserPermission } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * Initialize API routes for the application
 * @param {Express} app - Express application instance
 * @returns {void}
 */
const initApiRoutes = (app) => {
    // Apply JWT and Permission middleware to all routes
    router.all('*', checkUserJWT, checkUserPermission);

    // Authentication routes
    router.post('/register', authController.handleRegister);
    router.post('/login', authController.handleLogin);
    router.post('/verify-mfa', authController.handleVerifyMfa);
    router.post('/loginGoogle', authController.handleGoogleLogin);
    router.post('/logout', authController.handleLogout);
    router.post('/sendOTP', authController.hanleResendCode);
    router.post('/resetPassword', authController.handleResetPassword);
    router.post('/refresh-token', authController.handleRefreshToken);

    //Other service call to validate user
    router.post('/validateUser', authController.handleValidateUser);

    // User routes
    router.get('/user/read', userController.readFunc);  // Get all users
    router.post('/user/get-by-email', userController.getUserByEmailFunc);  // Changed from GET /user/:email
    router.post('/user/create', userController.createFunc);  // Create new user
    router.put('/user/update', userController.updateFunc);  // Update user
    router.put('/user/update-subscription', userController.updateSubscriptionFunc); // Add new route
    router.delete('/user/delete', userController.deleteFunc);  // Delete user
    router.post('/user/add-workout-plan', userController.addWorkoutPlanFunc); // Add new route
    router.post('/user/add-nutrition-plan', userController.addNutritionPlanFunc); // Add new route

    // Role routes
    router.get('/role/read', roleController.readFunc);
    router.post('/role/create', roleController.createFunc);
    router.put('/role/update', roleController.updateFunc);
    router.delete('/role/delete', roleController.deleteFunc);

    // Permission routes
    router.get('/permission/read', permissionController.readFunc);
    router.post('/permission/create', permissionController.createFunc);
    router.put('/permission/update', permissionController.updateFunc);
    router.delete('/permission/delete', permissionController.deleteFunc);

    // Permission-Role routes
    router.get('/permission-role/read', permissionRoleController.readFunc);
    router.post('/permission-role/create', permissionRoleController.createFunc);
    router.put('/permission-role/update', permissionRoleController.updateFunc);  // Add this line
    router.delete('/permission-role/delete', permissionRoleController.deleteFunc);

    // Merlive routes for allocation visualization
    router.get('/merlive/allocation-data', merliveController.getAllocationData);
    router.get('/merlive/allocation-stats', merliveController.getAllocationStats);
    router.post('/merlive/assign-role', merliveController.assignRoleToUser);
    router.post('/merlive/update-permissions', merliveController.updatePermissionsForRole);

    return app.use('/api/v1/', router);
};

export default initApiRoutes;