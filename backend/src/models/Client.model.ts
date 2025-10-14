import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ClientAttributes {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  propertyCount: number;
  lastContact: Date;
  engagementScore: number;
  status: 'active' | 'at-risk' | 'dormant';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'propertyCount' | 'engagementScore' | 'status' | 'lastContact' | 'createdAt' | 'updatedAt'> {}

export class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
  public id!: string;
  public userId!: string;
  public name!: string;
  public email!: string;
  public phone?: string;
  public propertyCount!: number;
  public lastContact!: Date;
  public engagementScore!: number;
  public status!: 'active' | 'at-risk' | 'dormant';
  public notes?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual fields
  public readonly documentCount?: number;
}

Client.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    propertyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'property_count',
    },
    lastContact: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_contact',
    },
    engagementScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      field: 'engagement_score',
      validate: {
        min: 0,
        max: 100,
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'at-risk', 'dormant'),
      allowNull: false,
      defaultValue: 'active',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'clients',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_clients_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_clients_status',
        fields: ['status'],
      },
      {
        name: 'idx_clients_email',
        fields: ['email'],
      },
      {
        name: 'idx_clients_engagement_score',
        fields: ['engagement_score'],
      },
      {
        name: 'idx_clients_last_contact',
        fields: ['last_contact'],
      },
      {
        name: 'idx_clients_user_status',
        fields: ['user_id', 'status'],
      },
      {
        name: 'idx_clients_user_status_score',
        fields: ['user_id', 'status', 'engagement_score'],
      },
    ],
  }
);

export default Client;
