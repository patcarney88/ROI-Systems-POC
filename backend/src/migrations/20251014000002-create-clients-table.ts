import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create ENUM type for client status
  await queryInterface.sequelize.query(`
    CREATE TYPE client_status AS ENUM ('active', 'at-risk', 'dormant');
  `);

  await queryInterface.createTable('clients', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    properties: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    engagement_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
    },
    status: {
      type: 'client_status',
      allowNull: false,
      defaultValue: 'active',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_contact: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create performance indexes
  await queryInterface.addIndex('clients', ['user_id'], {
    name: 'idx_clients_user_id',
  });

  await queryInterface.addIndex('clients', ['status'], {
    name: 'idx_clients_status',
  });

  await queryInterface.addIndex('clients', ['email'], {
    name: 'idx_clients_email',
    unique: true,
  });

  await queryInterface.addIndex('clients', ['engagement_score'], {
    name: 'idx_clients_engagement_score',
  });

  await queryInterface.addIndex('clients', ['last_contact'], {
    name: 'idx_clients_last_contact',
  });

  // Composite indexes for common queries
  await queryInterface.addIndex('clients', ['user_id', 'status'], {
    name: 'idx_clients_user_status',
  });

  await queryInterface.addIndex('clients', ['user_id', 'status', 'engagement_score'], {
    name: 'idx_clients_user_status_score',
  });

  await queryInterface.addIndex('clients', ['created_at'], {
    name: 'idx_clients_created_at',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('clients');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS client_status;');
}
