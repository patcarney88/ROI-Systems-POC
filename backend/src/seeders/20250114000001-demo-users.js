'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(12);

    const users = [
      {
        id: uuidv4(),
        email: 'admin@roisystems.com',
        password: await bcrypt.hash('Admin123!', salt),
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        status: 'active',
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'agent@roisystems.com',
        password: await bcrypt.hash('Agent123!', salt),
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'agent',
        status: 'active',
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'agent2@roisystems.com',
        password: await bcrypt.hash('Agent123!', salt),
        first_name: 'Michael',
        last_name: 'Chen',
        role: 'agent',
        status: 'active',
        last_login: new Date(Date.now() - 86400000), // 1 day ago
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'client@roisystems.com',
        password: await bcrypt.hash('Client123!', salt),
        first_name: 'John',
        last_name: 'Doe',
        role: 'client',
        status: 'active',
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users, {});

    // Store user IDs for use in other seeders
    console.log('Created users with IDs:', users.map(u => ({ email: u.email, id: u.id })));

    return users;
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
