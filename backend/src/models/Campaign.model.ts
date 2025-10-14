import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface CampaignAttributes {
  id: string;
  userId: string;
  name: string;
  subject: string;
  template: string;
  recipients: 'all' | 'active' | 'at-risk' | 'dormant' | 'recent';
  schedule: 'now' | 'scheduled';
  scheduleDate?: Date;
  message?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  sentAt?: Date;
  stats?: CampaignStats;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  public id!: string;
  public userId!: string;
  public name!: string;
  public subject!: string;
  public template!: string;
  public recipients!: 'all' | 'active' | 'at-risk' | 'dormant' | 'recent';
  public schedule!: 'now' | 'scheduled';
  public scheduleDate?: Date;
  public message?: string;
  public status!: 'draft' | 'scheduled' | 'sent' | 'failed';
  public sentAt?: Date;
  public stats?: CampaignStats;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Campaign.init(
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
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    template: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    recipients: {
      type: DataTypes.ENUM('all', 'active', 'at-risk', 'dormant', 'recent'),
      allowNull: false,
    },
    schedule: {
      type: DataTypes.ENUM('now', 'scheduled'),
      allowNull: false,
    },
    scheduleDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'schedule_date',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'draft',
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at',
    },
    stats: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'campaigns',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_campaigns_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_campaigns_status',
        fields: ['status'],
      },
      {
        name: 'idx_campaigns_schedule_date',
        fields: ['schedule_date'],
      },
      {
        name: 'idx_campaigns_status_date',
        fields: ['status', 'schedule_date'],
      },
      {
        name: 'idx_campaigns_user_status',
        fields: ['user_id', 'status'],
      },
    ],
  }
);

export default Campaign;
