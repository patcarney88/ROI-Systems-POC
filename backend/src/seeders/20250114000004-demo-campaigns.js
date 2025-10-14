'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get agent and admin user IDs
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role IN ('admin', 'agent') LIMIT 2`
    );

    if (users.length === 0) {
      console.log('No agents or admins found. Please run user seeder first.');
      return;
    }

    const userId1 = users[0].id;
    const userId2 = users.length > 1 ? users[1].id : users[0].id;

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const campaigns = [
      {
        id: uuidv4(),
        name: 'Spring Property Showcase 2025',
        description: 'Email campaign promoting new spring property listings to active clients. Highlighting residential properties in prime locations.',
        status: 'active',
        target_audience: 'Active Clients (Engagement Score > 70)',
        scheduled_date: threeDaysAgo,
        completed_date: null,
        user_id: userId1,
        metrics: {
          sent: 245,
          opens: 189,
          clicks: 87,
          conversions: 12,
          bounces: 5,
          unsubscribes: 2
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Commercial Real Estate Investment Opportunities',
        description: 'Targeted campaign for high-value clients interested in commercial properties. Features investment opportunities with high ROI potential.',
        status: 'completed',
        target_audience: 'High-Value Clients (Properties >= 3)',
        scheduled_date: oneWeekAgo,
        completed_date: threeDaysAgo,
        user_id: userId1,
        metrics: {
          sent: 87,
          opens: 72,
          clicks: 41,
          conversions: 8,
          bounces: 2,
          unsubscribes: 1
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Re-engagement Campaign for At-Risk Clients',
        description: 'Special outreach to clients who have shown decreased engagement. Personalized messages with exclusive offers and property updates.',
        status: 'scheduled',
        target_audience: 'At-Risk Clients (Engagement Score 40-69)',
        scheduled_date: tomorrow,
        completed_date: null,
        user_id: userId2,
        metrics: {
          sent: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          bounces: 0,
          unsubscribes: 0
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'New Listing Alert - Downtown Condos',
        description: 'Immediate notification campaign for new downtown condo listings. Time-sensitive offers for early buyers.',
        status: 'active',
        target_audience: 'All Active Clients',
        scheduled_date: yesterday,
        completed_date: null,
        user_id: userId2,
        metrics: {
          sent: 312,
          opens: 267,
          clicks: 124,
          conversions: 18,
          bounces: 8,
          unsubscribes: 3
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'First-Time Homebuyer Workshop Series',
        description: 'Educational email series for first-time buyers. Covers financing, inspection, and closing process.',
        status: 'scheduled',
        target_audience: 'New Clients (Properties = 0)',
        scheduled_date: nextWeek,
        completed_date: null,
        user_id: userId1,
        metrics: {
          sent: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          bounces: 0,
          unsubscribes: 0
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Q1 Market Update Newsletter',
        description: 'Quarterly market analysis and trends for all clients. Includes property value insights and investment recommendations.',
        status: 'completed',
        target_audience: 'All Clients',
        scheduled_date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        completed_date: oneWeekAgo,
        user_id: userId2,
        metrics: {
          sent: 487,
          opens: 356,
          clicks: 178,
          conversions: 23,
          bounces: 12,
          unsubscribes: 5
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Luxury Property Showcase',
        description: 'Exclusive campaign featuring high-end luxury properties. Invitation to private viewing events.',
        status: 'paused',
        target_audience: 'Premium Clients (Engagement Score > 80)',
        scheduled_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        completed_date: null,
        user_id: userId1,
        metrics: {
          sent: 45,
          opens: 38,
          clicks: 22,
          conversions: 3,
          bounces: 1,
          unsubscribes: 0
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('campaigns', campaigns, {});

    console.log(`Created ${campaigns.length} campaigns`);

    return campaigns;
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('campaigns', null, {});
  }
};
