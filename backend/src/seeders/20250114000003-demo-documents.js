'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get user and client IDs
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role IN ('admin', 'agent') LIMIT 2`
    );

    const [clients] = await queryInterface.sequelize.query(
      `SELECT id FROM clients LIMIT 5`
    );

    if (users.length === 0 || clients.length === 0) {
      console.log('No users or clients found. Please run previous seeders first.');
      return;
    }

    const userId1 = users[0].id;
    const userId2 = users.length > 1 ? users[1].id : users[0].id;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const documents = [
      {
        id: uuidv4(),
        title: 'Purchase Agreement - 123 Main St',
        type: 'Purchase Agreement',
        status: 'active',
        client_id: clients[0].id,
        user_id: userId1,
        upload_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        expiry_date: oneYearFromNow,
        size: 2456789,
        file_url: 'https://storage.roisystems.com/documents/purchase-agreement-123-main.pdf',
        metadata: {
          originalName: 'Purchase_Agreement_123_Main_St.pdf',
          mimeType: 'application/pdf',
          tags: ['purchase', 'residential', 'active']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Title Deed - 456 Oak Avenue',
        type: 'Title Deed',
        status: 'active',
        client_id: clients[1].id,
        user_id: userId1,
        upload_date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        expiry_date: null,
        size: 1234567,
        file_url: 'https://storage.roisystems.com/documents/title-deed-456-oak.pdf',
        metadata: {
          originalName: 'Title_Deed_456_Oak.pdf',
          mimeType: 'application/pdf',
          tags: ['title', 'property', 'ownership']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Home Inspection Report - 789 Elm St',
        type: 'Inspection',
        status: 'active',
        client_id: clients[0].id,
        user_id: userId2,
        upload_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        expiry_date: ninetyDaysFromNow,
        size: 5678901,
        file_url: 'https://storage.roisystems.com/documents/inspection-789-elm.pdf',
        metadata: {
          originalName: 'Inspection_Report_789_Elm.pdf',
          mimeType: 'application/pdf',
          tags: ['inspection', 'report', 'residential']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Commercial Lease - 321 Business Blvd',
        type: 'Lease',
        status: 'expiring',
        client_id: clients[2].id,
        user_id: userId1,
        upload_date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        expiry_date: thirtyDaysFromNow,
        size: 3456789,
        file_url: 'https://storage.roisystems.com/documents/lease-321-business.pdf',
        metadata: {
          originalName: 'Commercial_Lease_321_Business.pdf',
          mimeType: 'application/pdf',
          tags: ['lease', 'commercial', 'expiring']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Property Appraisal - 654 Pine Lane',
        type: 'Other',
        status: 'active',
        client_id: clients[3].id,
        user_id: userId2,
        upload_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        expiry_date: sixtyDaysFromNow,
        size: 987654,
        file_url: 'https://storage.roisystems.com/documents/appraisal-654-pine.pdf',
        metadata: {
          originalName: 'Appraisal_654_Pine.pdf',
          mimeType: 'application/pdf',
          tags: ['appraisal', 'valuation']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Residential Lease - 987 Maple Dr',
        type: 'Lease',
        status: 'expired',
        client_id: clients[4].id,
        user_id: userId1,
        upload_date: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000),
        expiry_date: tenDaysAgo,
        size: 2345678,
        file_url: 'https://storage.roisystems.com/documents/lease-987-maple.pdf',
        metadata: {
          originalName: 'Lease_987_Maple.pdf',
          mimeType: 'application/pdf',
          tags: ['lease', 'residential', 'expired']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Purchase Agreement - 147 Cedar St',
        type: 'Purchase Agreement',
        status: 'pending',
        client_id: clients[1].id,
        user_id: userId2,
        upload_date: now,
        expiry_date: oneYearFromNow,
        size: 2789012,
        file_url: 'https://storage.roisystems.com/documents/purchase-147-cedar.pdf',
        metadata: {
          originalName: 'Purchase_Agreement_147_Cedar.pdf',
          mimeType: 'application/pdf',
          tags: ['purchase', 'pending', 'new']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Title Insurance - 258 Birch Ave',
        type: 'Other',
        status: 'active',
        client_id: clients[2].id,
        user_id: userId1,
        upload_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        expiry_date: oneYearFromNow,
        size: 1567890,
        file_url: 'https://storage.roisystems.com/documents/title-insurance-258-birch.pdf',
        metadata: {
          originalName: 'Title_Insurance_258_Birch.pdf',
          mimeType: 'application/pdf',
          tags: ['insurance', 'title', 'protection']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Property Inspection - 369 Willow Way',
        type: 'Inspection',
        status: 'active',
        client_id: clients[3].id,
        user_id: userId2,
        upload_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        expiry_date: sixtyDaysFromNow,
        size: 4567890,
        file_url: 'https://storage.roisystems.com/documents/inspection-369-willow.pdf',
        metadata: {
          originalName: 'Inspection_369_Willow.pdf',
          mimeType: 'application/pdf',
          tags: ['inspection', 'property', 'commercial']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Title Deed - 741 Spruce Circle',
        type: 'Title Deed',
        status: 'active',
        client_id: clients[4].id,
        user_id: userId1,
        upload_date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        expiry_date: null,
        size: 1890123,
        file_url: 'https://storage.roisystems.com/documents/title-deed-741-spruce.pdf',
        metadata: {
          originalName: 'Title_Deed_741_Spruce.pdf',
          mimeType: 'application/pdf',
          tags: ['title', 'deed', 'ownership']
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('documents', documents, {});

    console.log(`Created ${documents.length} documents`);

    return documents;
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('documents', null, {});
  }
};
