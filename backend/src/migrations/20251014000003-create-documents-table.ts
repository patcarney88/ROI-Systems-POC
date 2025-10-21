import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create ENUM type for document status
  await queryInterface.sequelize.query(`
    CREATE TYPE document_status AS ENUM ('pending', 'active', 'expiring', 'expired');
  `);

  await queryInterface.createTable('documents', {
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
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    status: {
      type: 'document_status',
      allowNull: false,
      defaultValue: 'pending',
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    upload_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
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
  await queryInterface.addIndex('documents', ['user_id'], {
    name: 'idx_documents_user_id',
  });

  await queryInterface.addIndex('documents', ['client_id'], {
    name: 'idx_documents_client_id',
  });

  await queryInterface.addIndex('documents', ['status'], {
    name: 'idx_documents_status',
  });

  await queryInterface.addIndex('documents', ['upload_date'], {
    name: 'idx_documents_upload_date',
  });

  await queryInterface.addIndex('documents', ['expiry_date'], {
    name: 'idx_documents_expiry_date',
    where: Sequelize.literal('expiry_date IS NOT NULL'),
  });

  await queryInterface.addIndex('documents', ['type'], {
    name: 'idx_documents_type',
  });

  // Composite indexes for common queries
  await queryInterface.addIndex('documents', ['client_id', 'status'], {
    name: 'idx_documents_client_status',
  });

  await queryInterface.addIndex('documents', ['user_id', 'status', 'upload_date'], {
    name: 'idx_documents_user_status_date',
  });

  await queryInterface.addIndex('documents', ['user_id', 'client_id'], {
    name: 'idx_documents_user_client',
  });

  await queryInterface.addIndex('documents', ['created_at'], {
    name: 'idx_documents_created_at',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('documents');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS document_status;');
}
