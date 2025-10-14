import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum CampaignStatus {
  ACTIVE = 'active',
  SCHEDULED = 'scheduled',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export interface CampaignMetrics {
  sent: number;
  opens: number;
  clicks: number;
  conversions?: number;
  bounces?: number;
  unsubscribes?: number;
}

export interface CampaignAttributes {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  targetAudience: string;
  scheduledDate: Date;
  completedDate: Date | null;
  userId: string;
  metrics: CampaignMetrics;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'status' | 'completedDate' | 'metrics' | 'createdAt' | 'updatedAt'> {}

export class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  public id!: string;
  public name!: string;
  public description!: string;
  public status!: CampaignStatus;
  public targetAudience!: string;
  public scheduledDate!: Date;
  public completedDate!: Date | null;
  public userId!: string;
  public metrics!: CampaignMetrics;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getOpenRate(): number {
    if (!this.metrics.sent || this.metrics.sent === 0) return 0;
    return (this.metrics.opens / this.metrics.sent) * 100;
  }

  public getClickRate(): number {
    if (!this.metrics.sent || this.metrics.sent === 0) return 0;
    return (this.metrics.clicks / this.metrics.sent) * 100;
  }

  public getConversionRate(): number {
    if (!this.metrics.sent || this.metrics.sent === 0) return 0;
    const conversions = this.metrics.conversions || 0;
    return (conversions / this.metrics.sent) * 100;
  }

  public updateMetrics(metrics: Partial<CampaignMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...metrics
    };
  }

  public isActive(): boolean {
    return this.status === CampaignStatus.ACTIVE;
  }

  public isCompleted(): boolean {
    return this.status === CampaignStatus.COMPLETED;
  }

  public canStart(): boolean {
    const now = new Date();
    return (
      (this.status === CampaignStatus.SCHEDULED || this.status === CampaignStatus.PAUSED) &&
      this.scheduledDate <= now
    );
  }

  public complete(): void {
    this.status = CampaignStatus.COMPLETED;
    this.completedDate = new Date();
  }
}

Campaign.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Campaign name cannot be empty'
        },
        len: {
          args: [1, 255],
          msg: 'Campaign name must be between 1 and 255 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Campaign description cannot be empty'
        }
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CampaignStatus)),
      allowNull: false,
      defaultValue: CampaignStatus.SCHEDULED,
      validate: {
        isIn: {
          args: [Object.values(CampaignStatus)],
          msg: `Status must be one of: ${Object.values(CampaignStatus).join(', ')}`
        }
      }
    },
    targetAudience: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Target audience cannot be empty'
        }
      }
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'Scheduled date must be a valid date'
        }
      }
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      validate: {
        isAfterScheduled(value: any) {
          if (value && this.scheduledDate && new Date(value) < this.scheduledDate) {
            throw new Error('Completed date must be after scheduled date');
          }
        }
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        sent: 0,
        opens: 0,
        clicks: 0,
        conversions: 0,
        bounces: 0,
        unsubscribes: 0
      },
      validate: {
        isValidMetrics(value: any) {
          if (typeof value !== 'object') {
            throw new Error('Metrics must be an object');
          }
          if (typeof value.sent !== 'number' || value.sent < 0) {
            throw new Error('Metrics.sent must be a non-negative number');
          }
          if (typeof value.opens !== 'number' || value.opens < 0) {
            throw new Error('Metrics.opens must be a non-negative number');
          }
          if (typeof value.clicks !== 'number' || value.clicks < 0) {
            throw new Error('Metrics.clicks must be a non-negative number');
          }
        }
      }
    }
  },
  {
    sequelize,
    tableName: 'campaigns',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['scheduled_date']
      },
      {
        fields: ['completed_date']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

export default Campaign;
