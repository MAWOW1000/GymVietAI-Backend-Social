'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Permission_Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Permission_Role.belongsTo(models.Permission, {
        foreignKey: 'permissionId'
      });
      Permission_Role.belongsTo(models.Role, {
        foreignKey: 'roleId'
      });
    }
  };
  //object relational mapping
  Permission_Role.init({
    permissionId: DataTypes.INTEGER,
    roleId: DataTypes.INTEGER,
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
    modelName: 'Permission_Role',
  });
  return Permission_Role;
};