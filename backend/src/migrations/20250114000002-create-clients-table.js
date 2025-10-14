'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      properties: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      engagement_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50
      },
      status: {
        type: Sequelize.ENUM('active', 'at-risk', 'dormant'),
        allowNull: false,
        defaultValue: 'active'
      },
      notes: {
        type: Sequelize.TEXT,
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
      last_contact: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
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
    await queryInterface.addIndex('clients', ['email'], {
      unique: true,
      name: 'clients_email_unique'
    });

    await queryInterface.addIndex('clients', ['user_id'], {
      name: 'clients_user_id_idx'
    });

    await queryInterface.addIndex('clients', ['status'], {
      name: 'clients_status_idx'
    });

    await queryInterface.addIndex('clients', ['engagement_score'], {
      name: 'clients_engagement_score_idx'
    });

    await queryInterface.addIndex('clients', ['last_contact'], {
      name: 'clients_last_contact_idx'
    });

    await queryInterface.addIndex('clients', ['created_at'], {
      name: 'clients_created_at_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('clients');
  }
};
