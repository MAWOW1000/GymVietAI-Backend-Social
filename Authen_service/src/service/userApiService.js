import db from '../models/index';
import { Op, Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
const salt = bcrypt.genSaltSync(10);

const hashUserPassword = (userPassword) => {
    let hashPassword = bcrypt.hashSync(userPassword, salt);
    return hashPassword;
}

const getAllUsers = async () => {
    try {
        let users = await db.User.findAll({
            attributes: [
                'id',
                'email',
                'firstName',
                'lastName',
                'gender',
                'dateOfBirth',
                'createdWorkoutPlans',
                'createdNutritionPlans',
                'subscription_plan_id',
                'subscription_expires_at',
                [Sequelize.literal(`CONCAT(firstName, ' ', lastName)`), 'fullName'],
                [
                    Sequelize.fn(
                        'COALESCE',
                        Sequelize.fn('JSON_LENGTH', Sequelize.col('createdWorkoutPlans')),
                        0
                    ),
                    'workoutPlanCount'
                ],
                [
                    Sequelize.fn(
                        'COALESCE',
                        Sequelize.fn('JSON_LENGTH', Sequelize.col('createdNutritionPlans')),
                        0
                    ),
                    'nutritionPlanCount'
                ]
            ],
            include: {
                model: db.Role,
                as: 'Role',
                attributes: ['id', 'name']
            },
            order: [['createdAt', 'DESC']]
        });

        if (users) {
            // Transform data for frontend
            const transformedUsers = users.map(user => {
                const userData = user.get({ plain: true });
                return {
                    id: userData.id,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    gender: userData.gender,
                    dateOfBirth: userData.dateOfBirth,
                    role: userData.Role.name,
                    workoutPlanCount: userData.workoutPlanCount || 0,
                    nutritionPlanCount: userData.nutritionPlanCount || 0,
                    subscription_plan_id: userData.subscription_plan_id,
                    subscription_expires_at: userData.subscription_expires_at
                };
            });

            return {
                EM: 'Get users successfully',
                EC: 0,
                DT: transformedUsers
            }
        }
    } catch (error) {
        console.log('Error getting all users:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: []
        }
    }
}

const getUsersWithPagination = async (page, limit) => {
    try {
        let offset = (page - 1) * limit;
        const { count, rows } = await db.User.findAndCountAll({
            attributes: [
                'id',
                'email',
                'firstName',
                'lastName',
                'gender',
                'dateOfBirth',
                'createdWorkoutPlans',
                'createdNutritionPlans',
                'subscription_plan_id',
                'subscription_expires_at',
                [Sequelize.literal(`CONCAT(firstName, ' ', lastName)`), 'fullName'],
                [
                    Sequelize.fn(
                        'COALESCE',
                        Sequelize.fn('JSON_LENGTH', Sequelize.col('createdWorkoutPlans')),
                        0
                    ),
                    'workoutPlanCount'
                ],
                [
                    Sequelize.fn(
                        'COALESCE',
                        Sequelize.fn('JSON_LENGTH', Sequelize.col('createdNutritionPlans')),
                        0
                    ),
                    'nutritionPlanCount'
                ]
            ],
            include: {
                model: db.Role,
                as: 'Role',
                attributes: ['id', 'name']
            },
            order: [['createdAt', 'DESC']],
            offset: offset,
            limit: limit
        });

        // Transform data for frontend
        const transformedUsers = rows.map(user => {
            const userData = user.get({ plain: true });
            return {
                id: userData.id,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                gender: userData.gender,
                dateOfBirth: userData.dateOfBirth,
                role: userData.Role.name,
                workoutPlanCount: userData.workoutPlanCount || 0,
                nutritionPlanCount: userData.nutritionPlanCount || 0,
                subscription_plan_id: userData.subscription_plan_id,
                subscription_expires_at: userData.subscription_expires_at
            };
        });

        let totalPages = Math.ceil(count / limit);
        let data = {
            totalRows: count,
            totalPages: totalPages,
            users: transformedUsers
        }

        return {
            EM: 'Get users successfully',
            EC: 0,
            DT: data
        }
    } catch (error) {
        console.log('Error getting users with pagination:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: []
        }
    }
}

const createNewUser = async (data) => {
    try {
        // Check if email exists
        let existingUser = await db.User.findOne({
            where: { email: data.email }
        });

        if (existingUser) {
            return {
                EM: 'Email already exists',
                EC: 1,
                DT: ''
            }
        }

        // Hash password if provided
        let hashPassword = data.password ? hashUserPassword(data.password) : null;

        // Create user
        let user = await db.User.create({
            email: data.email,
            password: hashPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            roleId: data.roleId || 2, // Default to regular user if not specified
            picture: data.picture
        });

        return {
            EM: 'Create user successfully',
            EC: 0,
            DT: user
        }
    } catch (error) {
        console.log('Error creating user:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: ''
        }
    }
}

const updateUser = async (data) => {
    try {
        if (!data.id) {
            return {
                EM: 'Missing required parameters',
                EC: 1,
                DT: null
            }
        }

        let user = await db.User.findOne({
            where: { id: data.id }
        });

        if (!user) {
            return {
                EM: 'User not found',
                EC: 2,
                DT: null
            }
        }

        // Update user fields
        if (data.email) user.email = data.email;
        if (data.firstName) user.firstName = data.firstName;
        if (data.lastName) user.lastName = data.lastName;
        if (data.gender) user.gender = data.gender;
        if (data.dateOfBirth) user.dateOfBirth = data.dateOfBirth;
        if (data.password) user.password = hashUserPassword(data.password);
        if (data.roleId) user.roleId = data.roleId;

        await user.save();

        return {
            EM: 'Update user successfully',
            EC: 0,
            DT: user
        }
    } catch (error) {
        console.log('Error updating user:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: null
        }
    }
}

const deleteUser = async (userId) => {
    try {
        let user = await db.User.findOne({
            where: { id: userId }
        });

        if (!user) {
            return {
                EM: 'User not found',
                EC: 2,
                DT: null
            }
        }

        await user.destroy();

        return {
            EM: 'Delete user successfully',
            EC: 0,
            DT: null
        }
    } catch (error) {
        console.log('Error deleting user:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: null
        }
    }
}

const addWorkoutPlan = async (email, workoutPlanId) => {
    try {
        const user = await db.User.findOne({
            where: { email: email }
        });

        if (!user) {
            return {
                EM: 'User not found',
                EC: 1,
                DT: null
            };
        }

        // Get current exercises array or initialize if null
        const currentExercises = user.createdWorkoutPlans || [];

        // Add new workout plan ID to array
        currentExercises.push(workoutPlanId);

        // Update user
        await user.update({
            createdWorkoutPlans: currentExercises,
        });

        return {
            EM: 'Workout plan added successfully',
            EC: 0,
            DT: workoutPlanId
        };
    } catch (error) {
        console.error('Add exercise error:', error);
        return {
            EM: 'Error adding workout plan',
            EC: -1,
            DT: null
        };
    }
};

const addNutritionPlan = async (email, nutritionPlanId) => {
    try {
        const user = await db.User.findOne({
            where: { email: email }
        });

        if (!user) {
            return {
                EM: 'User not found',
                EC: 1,
                DT: null
            };
        }

        // Get current meal plans array or initialize if null
        const currentMealPlans = user.createdNutritionPlans || [];

        // Add new meal plan ID to array
        currentMealPlans.push(nutritionPlanId);

        // Update user
        await user.update({
            createdNutritionPlans: currentMealPlans,
        });

        return {
            EM: 'Meal plan added successfully',
            EC: 0,
            DT: nutritionPlanId
        };
    } catch (error) {
        console.error('Add meal plan error:', error);
        return {
            EM: 'Error adding meal plan',
            EC: -1,
            DT: null
        };
    }
};

const getUserByEmail = async (email) => {
    try {
        let user = await db.User.findOne({
            where: { email: email },
            attributes: [
                'id',
                'email',
                'firstName',
                'lastName',
                'gender',
                'dateOfBirth',
                'picture',
                'createdWorkoutPlans',
                'createdNutritionPlans',
                'subscription_plan_id',
                'subscription_expires_at'
                [
                Sequelize.fn('COALESCE',
                    Sequelize.fn('JSON_LENGTH', Sequelize.col('createdWorkoutPlans')),
                    0
                ),
                'workoutPlanCount'
                ],
                [
                    Sequelize.fn('COALESCE',
                        Sequelize.fn('JSON_LENGTH', Sequelize.col('createdNutritionPlans')),
                        0
                    ),
                    'nutritionPlanCount'
                ]
            ],
            include: {
                model: db.Role,
                as: 'Role',
                attributes: ['id', 'name']
            }
        });

        if (!user) {
            return {
                EM: 'User not found',
                EC: 1,
                DT: null
            }
        }

        // Transform user data
        const userData = user.get({ plain: true });
        const transformedUser = {
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            gender: userData.gender,
            dateOfBirth: userData.dateOfBirth,
            picture: userData.picture,
            role: userData.Role.name,
            workoutPlanCount: userData.workoutPlanCount || 0,
            nutritionPlanCount: userData.nutritionPlanCount || 0,
            subscription_plan_id: userData.subscription_plan_id,
            subscription_expires_at: userData.subscription_expires_at
        };

        return {
            EM: 'Get user successfully',
            EC: 0,
            DT: transformedUser
        }

    } catch (error) {
        console.log('Error getting user by email:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: null
        }
    }
}

const updateUserSubscription = async (userId, data) => {
    try {
        const user = await db.User.findOne({
            where: { id: userId }
        });

        if (!user) {
            return {
                EM: 'User not found',
                EC: 1,
                DT: null
            };
        }

        await user.update({
            subscription_plan_id: data.subscription_plan_id,
            subscription_expires_at: data.subscription_expires_at,
            roleId: 3 // Luôn set roleId là 3
        });

        return {
            EM: 'User subscription and role updated successfully',
            EC: 0,
            DT: {
                id: user.id,
                subscription_plan_id: user.subscription_plan_id,
                subscription_expires_at: user.subscription_expires_at,
                roleId: user.roleId
            }
        };
    } catch (error) {
        console.error('Update subscription error:', error);
        return {
            EM: 'Error updating subscription',
            EC: -1,
            DT: null
        };
    }
};

module.exports = {
    getAllUsers,
    getUsersWithPagination,
    createNewUser,
    updateUser,
    deleteUser,
    addWorkoutPlan,
    addNutritionPlan,
    getUserByEmail,
    updateUserSubscription
}