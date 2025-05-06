import userApiService from '../service/userApiService';
import userService from '../service/userApiService';

const readFunc = async (req, res) => {
    try {
        if (req.query.page && req.query.limit) {
            let page = parseInt(req.query.page);
            let limit = parseInt(req.query.limit);

            if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
                return res.status(400).json({
                    EM: 'Invalid pagination parameters',
                    EC: 1,
                    DT: null
                });
            }

            let data = await userApiService.getUsersWithPagination(page, limit);
            return res.status(200).json({
                EM: data.EM,
                EC: data.EC,
                DT: data.DT
            });
        } else {
            let data = await userApiService.getAllUsers();
            return res.status(200).json({
                EM: data.EM,
                EC: data.EC,
                DT: data.DT
            });
        }
    } catch (error) {
        console.log('Error in readFunc:', error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
}

const createFunc = async (req, res) => {
    try {
        let data = req.body;

        if (!data.email || !data.password) {
            return res.status(400).json({
                EM: 'Missing required fields',
                EC: 1,
                DT: null
            });
        }

        let result = await userApiService.createNewUser(data);
        return res.status(200).json({
            EM: result.EM,
            EC: result.EC,
            DT: result.DT
        });
    } catch (error) {
        console.log('Error in createFunc:', error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
}

const updateFunc = async (req, res) => {
    try {
        let data = req.body;

        if (!data.id) {
            return res.status(400).json({
                EM: 'Missing user ID',
                EC: 1,
                DT: null
            });
        }

        let result = await userApiService.updateUser(data);
        return res.status(200).json({
            EM: result.EM,
            EC: result.EC,
            DT: result.DT
        });
    } catch (error) {
        console.log('Error in updateFunc:', error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
}

const deleteFunc = async (req, res) => {
    try {
        let { id } = req.body;

        if (!id) {
            return res.status(400).json({
                EM: 'Missing user ID',
                EC: 1,
                DT: null
            });
        }

        let result = await userApiService.deleteUser(id);
        return res.status(200).json({
            EM: result.EM,
            EC: result.EC,
            DT: result.DT
        });
    } catch (error) {
        console.log('Error in deleteFunc:', error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
}

const addWorkoutPlanFunc = async (req, res) => {
    try {
        const email = req.user.email;
        const workoutPlanId = req.body.workout_plan_id;

        if (!email || !workoutPlanId) {
            return res.status(400).json({
                EM: 'Missing email or workout plan ID',
                EC: 1,
                DT: null
            });
        }

        const data = await userService.addWorkoutPlan(email, workoutPlanId);

        return res.status(data.EC === 0 ? 200 : 400).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT
        });
    } catch (error) {
        console.error('Add exercise error:', error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
};

const addNutritionPlanFunc = async (req, res) => {
    try {
        const email = req.user.email;
        const nutritionPlanId = req.body.nutrition_plan_id;

        if (!email || !nutritionPlanId) {
            return res.status(400).json({
                EM: 'Missing email or nutrition plan ID',
                EC: 1,
                DT: null
            });
        }

        const data = await userService.addNutritionPlan(email, nutritionPlanId);

        return res.status(data.EC === 0 ? 200 : 400).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT
        });
    } catch (error) {
        console.error('Add meal plan error:', error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
};

const getUserByEmailFunc = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                EM: 'Missing email in request body',
                EC: 1,
                DT: null
            });
        }

        let result = await userApiService.getUserByEmail(email);
        return res.status(200).json({
            EM: result.EM,
            EC: result.EC,
            DT: result.DT
        });
    } catch (error) {
        console.log('Error in getUserByEmailFunc:', error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
}

const updateSubscriptionFunc = async (req, res) => {
    try {
        const { id, subscription_plan_id, subscription_expires_at } = req.body;
        console.log('updateSubscriptionFunc', req.body);
        // Validation
        if (!id || !subscription_plan_id || !subscription_expires_at) {
            return res.status(400).json({
                EM: 'Missing required fields (id, subscription_plan_id, subscription_expires_at)',
                EC: 1,
                DT: null
            });
        }

        // Validate id is UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({
                EM: 'Invalid user ID format',
                EC: 1,
                DT: null
            });
        }

        // Validate subscription_plan_id is a number
        if (!Number.isInteger(subscription_plan_id)) {
            return res.status(400).json({
                EM: 'subscription_plan_id must be a number',
                EC: 1,
                DT: null
            });
        }

        // Validate subscription_expires_at is a valid date
        const expiryDate = new Date(subscription_expires_at);
        if (isNaN(expiryDate.getTime())) {
            return res.status(400).json({
                EM: 'Invalid subscription_expires_at date format',
                EC: 1,
                DT: null
            });
        }

        const result = await userApiService.updateUserSubscription(id, {
            subscription_plan_id,
            subscription_expires_at,
            roleId: 3 // Thêm roleId cố định là 3
        });

        return res.status(result.EC === 0 ? 200 : 400).json({
            EM: result.EM,
            EC: result.EC,
            DT: result.DT
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
};

module.exports = {
    readFunc,
    createFunc,
    updateFunc,
    deleteFunc,
    addWorkoutPlanFunc,
    addNutritionPlanFunc,
    getUserByEmailFunc,
    updateSubscriptionFunc
}