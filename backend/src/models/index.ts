import sequelize from '../config/sequelize';
import User, { initUserModel } from './User';
import Client, { initClientModel } from './Client';
import Document, { initDocumentModel } from './Document';
import Campaign, { initCampaignModel } from './Campaign';

// Initialize all models
export const initializeModels = () => {
  initUserModel();
  initClientModel();
  initDocumentModel();
  initCampaignModel();
};

// Define associations
export const initializeAssociations = () => {
  // User associations
  User.hasMany(Client, {
    foreignKey: 'userId',
    as: 'clients',
    onDelete: 'CASCADE'
  });

  User.hasMany(Document, {
    foreignKey: 'userId',
    as: 'documents',
    onDelete: 'CASCADE'
  });

  User.hasMany(Campaign, {
    foreignKey: 'userId',
    as: 'campaigns',
    onDelete: 'CASCADE'
  });

  // Client associations
  Client.belongsTo(User, {
    foreignKey: 'userId',
    as: 'agent'
  });

  Client.hasMany(Document, {
    foreignKey: 'clientId',
    as: 'documents',
    onDelete: 'CASCADE'
  });

  // Document associations
  Document.belongsTo(Client, {
    foreignKey: 'clientId',
    as: 'client'
  });

  Document.belongsTo(User, {
    foreignKey: 'userId',
    as: 'uploader'
  });

  // Campaign associations
  Campaign.belongsTo(User, {
    foreignKey: 'userId',
    as: 'creator'
  });
};

// Sync database (only in development)
export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

export {
  sequelize,
  User,
  Client,
  Document,
  Campaign
};

export default {
  sequelize,
  User,
  Client,
  Document,
  Campaign,
  initializeModels,
  initializeAssociations,
  syncDatabase
};
