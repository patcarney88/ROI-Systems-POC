import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum DocumentType {
  PURCHASE_AGREEMENT = 'Purchase Agreement',
  TITLE_DEED = 'Title Deed',
  INSPECTION = 'Inspection',
  LEASE = 'Lease',
  OTHER = 'Other'
}

export enum DocumentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRING = 'expiring',
  EXPIRED = 'expired'
}

export interface DocumentMetadata {
  originalName?: string;
  mimeType?: string;
  tags?: string[];
  [key: string]: any;
}

export interface DocumentAttributes {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  clientId: string;
  userId: string;
  uploadDate: Date;
  expiryDate: Date | null;
  size: number;
  fileUrl: string;
  metadata: DocumentMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocumentCreationAttributes extends Optional<DocumentAttributes, 'id' | 'status' | 'uploadDate' | 'expiryDate' | 'metadata' | 'createdAt' | 'updatedAt'> {}

export class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
  public id!: string;
  public title!: string;
  public type!: DocumentType;
  public status!: DocumentStatus;
  public clientId!: string;
  public userId!: string;
  public uploadDate!: Date;
  public expiryDate!: Date | null;
  public size!: number;
  public fileUrl!: string;
  public metadata!: DocumentMetadata;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  public isExpiring(daysThreshold: number = 30): boolean {
    if (!this.expiryDate) return false;
    const now = new Date();
    const daysUntilExpiry = Math.floor((this.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold;
  }

  public updateStatus(): DocumentStatus {
    if (this.isExpired()) {
      return DocumentStatus.EXPIRED;
    } else if (this.isExpiring()) {
      return DocumentStatus.EXPIRING;
    } else if (this.status === DocumentStatus.PENDING) {
      return DocumentStatus.PENDING;
    } else {
      return DocumentStatus.ACTIVE;
    }
  }

  public formatSize(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Document title cannot be empty'
        },
        len: {
          args: [1, 255],
          msg: 'Document title must be between 1 and 255 characters'
        }
      }
    },
    type: {
      type: DataTypes.ENUM(...Object.values(DocumentType)),
      allowNull: false,
      validate: {
        isIn: {
          args: [Object.values(DocumentType)],
          msg: `Type must be one of: ${Object.values(DocumentType).join(', ')}`
        }
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DocumentStatus)),
      allowNull: false,
      defaultValue: DocumentStatus.PENDING,
      validate: {
        isIn: {
          args: [Object.values(DocumentStatus)],
          msg: `Status must be one of: ${Object.values(DocumentStatus).join(', ')}`
        }
      }
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
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
    uploadDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      validate: {
        isAfterUpload(value: any) {
          if (value && this.uploadDate && new Date(value) <= this.uploadDate) {
            throw new Error('Expiry date must be after upload date');
          }
        }
      }
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'File size cannot be negative'
        }
      }
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'File URL cannot be empty'
        },
        isUrl: {
          msg: 'Must be a valid URL'
        }
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    tableName: 'documents',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['client_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['upload_date']
      },
      {
        fields: ['expiry_date']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeSave: (document: Document) => {
        document.status = document.updateStatus();
      }
    }
  }
);

export default Document;
