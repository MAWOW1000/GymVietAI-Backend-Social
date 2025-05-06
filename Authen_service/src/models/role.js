'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Role.hasMany(models.User, {
        foreignKey: 'roleId',
        as: 'Users'
      });
      Role.belongsToMany(models.Permission, {
        through: 'Permission_Role',
        foreignKey: 'roleId',
        otherKey: 'permissionId',
        as: 'Permissions'
      });
    }
  };
  //object relational mapping
  Role.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
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
    modelName: 'Role',
  });
  return Role;
};