import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

export enum ClientStatus {
  ACTIVE = 'active',
  AT_RISK = 'at-risk',
  DORMANT = 'dormant'
}

export interface ClientAttributes {
  id: string;
  name: string;
  email: string;
  phone: string;
  properties: number;
  engagementScore: number;
  status: ClientStatus;
  notes: string | null;
  userId: string;
  lastContact: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'properties' | 'engagementScore' | 'status' | 'notes' | 'lastContact' | 'createdAt' | 'updatedAt'> {}

export class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public phone!: string;
  public properties!: number;
  public engagementScore!: number;
  public status!: ClientStatus;
  public notes!: string | null;
  public userId!: string;
  public lastContact!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public calculateEngagementScore(): ClientStatus {
    if (this.engagementScore >= 70) {
      return ClientStatus.ACTIVE;
    } else if (this.engagementScore >= 40) {
      return ClientStatus.AT_RISK;
    } else {
      return ClientStatus.DORMANT;
    }
  }

  public updateEngagement(score: number): void {
    this.engagementScore = Math.max(0, Math.min(100, score));
    this.status = this.calculateEngagementScore();
  }
}

// Export initialization function instead of calling .init() immediately
export const initClientModel = () => {
  Client.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Client name cannot be empty'
        },
        len: {
          args: [1, 200],
          msg: 'Client name must be between 1 and 200 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Must be a valid email address'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Phone number cannot be empty'
        }
      }
    },
    properties: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Properties count cannot be negative'
        }
      }
    },
    engagementScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: {
          args: [0],
          msg: 'Engagement score cannot be less than 0'
        },
        max: {
          args: [100],
          msg: 'Engagement score cannot be greater than 100'
        }
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ClientStatus)),
      allowNull: false,
      defaultValue: ClientStatus.ACTIVE,
      validate: {
        isIn: {
          args: [Object.values(ClientStatus)],
          msg: `Status must be one of: ${Object.values(ClientStatus).join(', ')}`
        }
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
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
    lastContact: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
    },
    {
      sequelize,
      tableName: 'clients',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['email']
        },
        {
          fields: ['user_id']
        },
        {
          fields: ['status']
        },
        {
          fields: ['engagement_score']
        },
        {
          fields: ['last_contact']
        },
        {
          fields: ['created_at']
        }
      ],
      hooks: {
        beforeSave: (client: Client) => {
          client.status = client.calculateEngagementScore();
        }
      }
    }
  );
};

export default Client;
