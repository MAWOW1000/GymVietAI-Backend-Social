'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.belongsTo(models.Role, {
        foreignKey: 'roleId',  // Chỉ định rõ tên cột foreign key
        as: 'Role'  // Đặt alias để tránh conflict
      });
    }
  };
  //object relational mapping
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    gender: DataTypes.STRING,
    dateOfBirth: DataTypes.DATE,
    roleId: DataTypes.INTEGER,
    refreshToken: DataTypes.STRING,
    refreshTokenExpiresAt: DataTypes.DATE,
    picture: {
      type: DataTypes.STRING,
      defaultValue: 'https://imgcdn.stablediffusionweb.com/2024/5/17/f5fb790b-36d9-4504-9ad0-d1142269fe98.jpg'
    },
    codeResetPassword: DataTypes.STRING,
    otpExpiresAt: DataTypes.DATE,  // Thêm trường mới
    createdWorkoutPlans: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const value = this.getDataValue('createdWorkoutPlans');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('createdWorkoutPlans', JSON.stringify(value));
      }
    },
    createdNutritionPlans: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const value = this.getDataValue('createdNutritionPlans');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('createdNutritionPlans', JSON.stringify(value));
      }
    },
    workoutPlanCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    nutritionPlanCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    chatCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    subscription_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    subscription_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};