import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create ENUM types for campaigns
  await queryInterface.sequelize.query(`
    CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sent', 'failed');
    CREATE TYPE campaign_schedule AS ENUM ('now', 'scheduled');
    CREATE TYPE campaign_recipients AS ENUM ('all', 'active', 'at-risk', 'dormant', 'recent');
  `);

  await queryInterface.createTable('campaigns', {
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
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    template: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    recipients: {
      type: 'campaign_recipients',
      allowNull: false,
    },
    schedule: {
      type: 'campaign_schedule',
      allowNull: false,
    },
    schedule_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: 'campaign_status',
      allowNull: false,
      defaultValue: 'draft',
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    stats: {
      type: DataTypes.JSONB,
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
  await queryInterface.addIndex('campaigns', ['user_id'], {
    name: 'idx_campaigns_user_id',
  });

  await queryInterface.addIndex('campaigns', ['status'], {
    name: 'idx_campaigns_status',
  });

  await queryInterface.addIndex('campaigns', ['schedule_date'], {
    name: 'idx_campaigns_schedule_date',
  });

  await queryInterface.addIndex('campaigns', ['sent_at'], {
    name: 'idx_campaigns_sent_at',
  });

  // Composite indexes for common queries
  await queryInterface.addIndex('campaigns', ['status', 'schedule_date'], {
    name: 'idx_campaigns_status_date',
  });

  await queryInterface.addIndex('campaigns', ['user_id', 'status'], {
    name: 'idx_campaigns_user_status',
  });

  await queryInterface.addIndex('campaigns', ['created_at'], {
    name: 'idx_campaigns_created_at',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('campaigns');
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS campaign_status;
    DROP TYPE IF EXISTS campaign_schedule;
    DROP TYPE IF EXISTS campaign_recipients;
  `);
}
