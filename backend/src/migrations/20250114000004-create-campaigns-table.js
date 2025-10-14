'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('campaigns', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'scheduled', 'paused', 'completed'),
        allowNull: false,
        defaultValue: 'scheduled'
      },
      target_audience: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      scheduled_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      completed_date: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      metrics: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          sent: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          bounces: 0,
          unsubscribes: 0
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('campaigns', ['user_id'], {
      name: 'campaigns_user_id_idx'
    });

    await queryInterface.addIndex('campaigns', ['status'], {
      name: 'campaigns_status_idx'
    });

    await queryInterface.addIndex('campaigns', ['scheduled_date'], {
      name: 'campaigns_scheduled_date_idx'
    });

    await queryInterface.addIndex('campaigns', ['completed_date'], {
      name: 'campaigns_completed_date_idx'
    });

    await queryInterface.addIndex('campaigns', ['created_at'], {
      name: 'campaigns_created_at_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('campaigns');
  }
};
