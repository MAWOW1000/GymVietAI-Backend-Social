// controllers/dashboardController.js
const User = require('../models/User');
const { Sequelize } = require('sequelize');


exports.getUserStatusStats = async (req, res) => {
    try {
        const total = await User.count();
        const counts = await Promise.all([
            User.count({ where: { status: 'active' } }),
            User.count({ where: { status: 'inactive' } }),
            User.count({ where: { status: 'banned' } })
        ]);

        res.json({
            active: (counts[0] / total) * 100,
            inactive: (counts[1] / total) * 100,
            banned: (counts[2] / total) * 100
        });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
};

exports.getMonthlyUserStats = async (req, res) => {
    try {
        const stats = await User.findAll({
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'month'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')],
            order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
            raw: true
        });

        res.json(stats);
    } catch (err) {
        console.error('Lỗi trong getMonthlyUserStats:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};
// controllers/dashboardController.js
exports.getTotalUsersOverTime = async (req, res) => {
    try {
        const results = await User.findAll({
            attributes: [
                [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'month'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalUsers']
            ],
            group: ['month'],
            raw: true
        });

        // Khởi tạo mảng cho tất cả 12 tháng
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const response = months.map((m) => ({
            month: m,
            totalUsers: 0
        }));

        // Dữ liệu số lượng người dùng theo tháng
        for (const row of results) {
            const monthIndex = row.month - 1;
            if (response[monthIndex]) {
                response[monthIndex].totalUsers = parseInt(row.totalUsers);
            }
        }

        res.json(response);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
};

