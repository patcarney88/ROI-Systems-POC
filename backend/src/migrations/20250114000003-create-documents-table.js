'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('Purchase Agreement', 'Title Deed', 'Inspection', 'Lease', 'Other'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'expiring', 'expired'),
        allowNull: false,
        defaultValue: 'pending'
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
      upload_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
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
    await queryInterface.addIndex('documents', ['client_id'], {
      name: 'documents_client_id_idx'
    });

    await queryInterface.addIndex('documents', ['user_id'], {
      name: 'documents_user_id_idx'
    });

    await queryInterface.addIndex('documents', ['type'], {
      name: 'documents_type_idx'
    });

    await queryInterface.addIndex('documents', ['status'], {
      name: 'documents_status_idx'
    });

    await queryInterface.addIndex('documents', ['upload_date'], {
      name: 'documents_upload_date_idx'
    });

    await queryInterface.addIndex('documents', ['expiry_date'], {
      name: 'documents_expiry_date_idx'
    });

    await queryInterface.addIndex('documents', ['created_at'], {
      name: 'documents_created_at_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('documents');
  }
};
