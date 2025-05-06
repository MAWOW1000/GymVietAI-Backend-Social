'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('User', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      gender: {
        type: Sequelize.STRING
      },
      dateOfBirth: {
        type: Sequelize.DATE
      },
      roleId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Role',
          key: 'id'
        }
      },
      picture: {
        type: Sequelize.STRING,
        defaultValue: 'https://imgcdn.stablediffusionweb.com/2024/5/17/f5fb790b-36d9-4504-9ad0-d1142269fe98.jpg'
      },
      refreshToken: {
        type: Sequelize.STRING
      },
      refreshTokenExpiresAt: {
        type: Sequelize.DATE
      },
      codeResetPassword: {
        type: Sequelize.STRING
      },
      otpExpiresAt: {  // Thêm trường mới
        type: Sequelize.DATE,
        allowNull: true
      },
      createdWorkoutPlans: {
        type: Sequelize.TEXT,
        defaultValue: '[]',
        allowNull: true,
        get() {
          const value = this.getDataValue('createdWorkoutPlans');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('createdWorkoutPlans', JSON.stringify(value));
        }
      },
      createdNutritionPlans: {
        type: Sequelize.TEXT,
        defaultValue: '[]',
        allowNull: true,
        get() {
          const value = this.getDataValue('createdNutritionPlans');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('createdNutritionPlans', JSON.stringify(value));
        }
      },
      workoutPlanCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      nutritionPlanCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      chatCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      subscription_plan_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      subscription_expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('User');
  }
};