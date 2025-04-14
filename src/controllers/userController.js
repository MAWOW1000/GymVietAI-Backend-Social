const { Op } = require('sequelize');
const User = require('../models/User');

//search users by fullname
exports.searchUsers = async (req, res) => {
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
