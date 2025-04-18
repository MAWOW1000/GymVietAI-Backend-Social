// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Định nghĩa các route cho dashboard
router.get('/getUserStatusStats', dashboardController.getUserStatusStats);  // Pie chart
router.get('/getMonthlyUserStats', dashboardController.getMonthlyUserStats);  // Bar chart
router.get('/getTotalUsersOverTime', dashboardController.getTotalUsersOverTime);  // Area chart

module.exports = router;
