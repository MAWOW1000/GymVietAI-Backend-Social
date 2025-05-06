'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Role', [
      {
        name: 'Admin',
        description: 'Administrator role with full access',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'User',
        description: 'Regular user role with limited access',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'User Premium',
        description: 'Premium user role with additional benefits',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Role', null, {});
  }
};
