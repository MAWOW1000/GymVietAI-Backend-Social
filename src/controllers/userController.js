import { Op } from 'sequelize';
import User from '../models/User.js';

//search users by fullname
export const searchUsers = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Missing search query' });
    }

    try {
        const users = await User.findAll({
            where: {
                fullName: {
                    [Op.like]: `%${query}%`
                },
                status: 'active'
            },
            attributes: ['id', 'username', 'fullName', 'avatar', 'bio']
        });

        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
