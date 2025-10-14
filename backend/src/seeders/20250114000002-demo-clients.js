'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get agent user IDs
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'agent' LIMIT 2`
    );

    if (users.length === 0) {
      console.log('No agents found. Please run user seeder first.');
      return;
    }

    const agentId1 = users[0].id;
    const agentId2 = users.length > 1 ? users[1].id : users[0].id;

    const clients = [
      {
        id: uuidv4(),
        name: 'Robert Smith',
        email: 'robert.smith@example.com',
        phone: '+1-555-0101',
        properties: 3,
        engagement_score: 85,
        status: 'active',
        notes: 'High-value client interested in commercial properties',
        user_id: agentId1,
        last_contact: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        phone: '+1-555-0102',
        properties: 1,
        engagement_score: 92,
        status: 'active',
        notes: 'Looking for residential properties in downtown area',
        user_id: agentId1,
        last_contact: new Date(Date.now() - 172800000), // 2 days ago
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'James Wilson',
        email: 'james.wilson@example.com',
        phone: '+1-555-0103',
        properties: 2,
        engagement_score: 55,
        status: 'at-risk',
        notes: 'Has been less responsive lately, needs follow-up',
        user_id: agentId2,
        last_contact: new Date(Date.now() - 604800000), // 7 days ago
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Maria Garcia',
        email: 'maria.garcia@example.com',
        phone: '+1-555-0104',
        properties: 0,
        engagement_score: 78,
        status: 'active',
        notes: 'First-time buyer, very engaged',
        user_id: agentId2,
        last_contact: new Date(Date.now() - 86400000), // 1 day ago
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'David Thompson',
        email: 'david.thompson@example.com',
        phone: '+1-555-0105',
        properties: 5,
        engagement_score: 25,
        status: 'dormant',
        notes: 'Has not responded to recent outreach attempts',
        user_id: agentId1,
        last_contact: new Date(Date.now() - 2592000000), // 30 days ago
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Jennifer Martinez',
        email: 'jennifer.martinez@example.com',
        phone: '+1-555-0106',
        properties: 1,
        engagement_score: 68,
        status: 'active',
        notes: 'Interested in investment properties',
        user_id: agentId2,
        last_contact: new Date(Date.now() - 259200000), // 3 days ago
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'William Brown',
        email: 'william.brown@example.com',
        phone: '+1-555-0107',
        properties: 4,
        engagement_score: 45,
        status: 'at-risk',
        notes: 'Mentioned possibly working with another agent',
        user_id: agentId1,
        last_contact: new Date(Date.now() - 1209600000), // 14 days ago
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('clients', clients, {});

    console.log(`Created ${clients.length} clients`);

    return clients;
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('clients', null, {});
  }
};
