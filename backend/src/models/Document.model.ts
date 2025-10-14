import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface DocumentAttributes {
  id: string;
  userId: string;
  clientId: string;
  title: string;
  type: string;
  status: 'pending' | 'active' | 'expiring' | 'expired';
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  expiryDate?: Date;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DocumentCreationAttributes extends Optional<DocumentAttributes, 'id' | 'status' | 'uploadDate' | 'createdAt' | 'updatedAt'> {}

export class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
  public id!: string;
  public userId!: string;
  public clientId!: string;
  public title!: string;
  public type!: string;
  public status!: 'pending' | 'active' | 'expiring' | 'expired';
  public fileUrl!: string;
  public fileSize!: number;
  public mimeType!: string;
  public uploadDate!: Date;
  public expiryDate?: Date;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'client_id',
      references: {
        model: 'clients',
        key: 'id',
      },
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
      type: DataTypes.ENUM('pending', 'active', 'expiring', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_url',
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'file_size',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type',
    },
    uploadDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'upload_date',
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expiry_date',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'documents',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_documents_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_documents_client_id',
        fields: ['client_id'],
      },
      {
        name: 'idx_documents_status',
        fields: ['status'],
      },
      {
        name: 'idx_documents_upload_date',
        fields: ['upload_date'],
      },
      {
        name: 'idx_documents_expiry_date',
        fields: ['expiry_date'],
        where: {
          expiry_date: {
            [DataTypes.Op.ne]: null,
          },
        },
      },
      {
        name: 'idx_documents_client_status',
        fields: ['client_id', 'status'],
      },
      {
        name: 'idx_documents_user_status_date',
        fields: ['user_id', 'status', 'upload_date'],
      },
    ],
  }
);

export default Document;
