/**
 * Mock Webhook Payloads
 * Test fixtures for SoftPro 360 webhook events
 */

import { WebhookEventType } from '../../../services/softpro-webhook.service';

// ============================================================================
// WEBHOOK EVENT PAYLOADS
// ============================================================================

export const webhookTransactionCreated = {
  event: {
    id: 'evt_trans_created_001',
    type: WebhookEventType.TRANSACTION_CREATED,
    timestamp: '2024-01-15T10:30:00Z',
    data: {
      id: 'SP-12345',
      file_number: '2024-001234',
      type: 'PURCHASE',
      status: 'OPENED',
      property: {
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
      },
      purchase_price: 850000,
      closing_date: '2024-03-15',
      opened_date: '2024-01-15',
      buyer: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      },
      seller: {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
      },
    },
  },
  delivery_id: 'delivery_001',
  signature: 'sha256=mock_signature_1234567890abcdef',
};

export const webhookTransactionUpdated = {
  event: {
    id: 'evt_trans_updated_001',
    type: WebhookEventType.TRANSACTION_UPDATED,
    timestamp: '2024-01-20T15:00:00Z',
    data: {
      id: 'SP-12345',
      file_number: '2024-001234',
      type: 'PURCHASE',
      status: 'IN_PROGRESS',
      property: {
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
      },
      purchase_price: 850000,
      closing_date: '2024-03-20', // Updated closing date
      updated_fields: ['closing_date', 'status'],
    },
  },
  delivery_id: 'delivery_002',
  signature: 'sha256=mock_signature_abcdef1234567890',
};

export const webhookTransactionStatusChanged = {
  event: {
    id: 'evt_status_changed_001',
    type: WebhookEventType.TRANSACTION_STATUS_CHANGED,
    timestamp: '2024-02-15T14:00:00Z',
    data: {
      transaction_id: 'SP-12345',
      old_status: 'IN_PROGRESS',
      new_status: 'PENDING_CLOSING',
      changed_by: 'user@softpro.com',
      changed_at: '2024-02-15T14:00:00Z',
      reason: 'All contingencies cleared',
    },
  },
  delivery_id: 'delivery_003',
  signature: 'sha256=mock_signature_0987654321fedcba',
};

export const webhookDocumentUploaded = {
  event: {
    id: 'evt_doc_uploaded_001',
    type: WebhookEventType.DOCUMENT_UPLOADED,
    timestamp: '2024-01-20T16:30:00Z',
    data: {
      id: 'D-001',
      transaction_id: 'SP-12345',
      name: 'Purchase Agreement',
      filename: 'purchase-agreement-2024-001234.pdf',
      type: 'application/pdf',
      size: 1024000,
      document_type: 'PURCHASE_AGREEMENT',
      category: 'Contracts',
      uploaded_at: '2024-01-20T16:30:00Z',
      uploaded_by: 'john.doe@example.com',
      url: 'https://softpro-docs.example.com/docs/D-001',
    },
  },
  delivery_id: 'delivery_004',
  signature: 'sha256=mock_signature_fedcba0987654321',
};

export const webhookDocumentUpdated = {
  event: {
    id: 'evt_doc_updated_001',
    type: WebhookEventType.DOCUMENT_UPDATED,
    timestamp: '2024-01-21T10:00:00Z',
    data: {
      id: 'D-001',
      transaction_id: 'SP-12345',
      name: 'Purchase Agreement',
      status: 'APPROVED',
      version: 2,
      updated_at: '2024-01-21T10:00:00Z',
      updated_by: 'escrow@titlecompany.com',
      changes: {
        status: 'APPROVED',
        approval_date: '2024-01-21',
      },
    },
  },
  delivery_id: 'delivery_005',
  signature: 'sha256=mock_signature_1a2b3c4d5e6f7890',
};

export const webhookDocumentDeleted = {
  event: {
    id: 'evt_doc_deleted_001',
    type: WebhookEventType.DOCUMENT_DELETED,
    timestamp: '2024-01-22T09:00:00Z',
    data: {
      id: 'D-999',
      transaction_id: 'SP-12345',
      name: 'Duplicate Document',
      deleted_at: '2024-01-22T09:00:00Z',
      deleted_by: 'admin@softpro.com',
      reason: 'Duplicate upload',
    },
  },
  delivery_id: 'delivery_006',
  signature: 'sha256=mock_signature_9f8e7d6c5b4a3210',
};

export const webhookContactCreated = {
  event: {
    id: 'evt_contact_created_001',
    type: WebhookEventType.CONTACT_CREATED,
    timestamp: '2024-01-10T09:00:00Z',
    data: {
      id: 'C-001',
      type: 'INDIVIDUAL',
      first_name: 'John',
      middle_name: 'Michael',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      mobile: '555-987-6543',
      address: {
        street: '456 Oak Ave',
        street2: 'Apt 2B',
        city: 'San Francisco',
        state: 'CA',
        zip: '94103',
      },
      company: 'Doe Enterprises',
      job_title: 'CEO',
      created_at: '2024-01-10T09:00:00Z',
    },
  },
  delivery_id: 'delivery_007',
  signature: 'sha256=mock_signature_abc123def456',
};

export const webhookContactUpdated = {
  event: {
    id: 'evt_contact_updated_001',
    type: WebhookEventType.CONTACT_UPDATED,
    timestamp: '2024-01-20T11:00:00Z',
    data: {
      id: 'C-001',
      type: 'INDIVIDUAL',
      first_name: 'John',
      middle_name: 'Michael',
      last_name: 'Doe',
      email: 'john.doe.updated@example.com', // Updated email
      phone: '555-123-4567',
      mobile: '555-987-6543',
      updated_at: '2024-01-20T11:00:00Z',
      updated_fields: ['email'],
    },
  },
  delivery_id: 'delivery_008',
  signature: 'sha256=mock_signature_def456abc123',
};

export const webhookContactDeleted = {
  event: {
    id: 'evt_contact_deleted_001',
    type: WebhookEventType.CONTACT_DELETED,
    timestamp: '2024-01-25T14:00:00Z',
    data: {
      id: 'C-999',
      deleted_at: '2024-01-25T14:00:00Z',
      deleted_by: 'admin@softpro.com',
      reason: 'Duplicate contact',
    },
  },
  delivery_id: 'delivery_009',
  signature: 'sha256=mock_signature_789xyz456abc',
};

export const webhookTaskCreated = {
  event: {
    id: 'evt_task_created_001',
    type: WebhookEventType.TASK_CREATED,
    timestamp: '2024-01-18T10:00:00Z',
    data: {
      id: 'TASK-001',
      transaction_id: 'SP-12345',
      title: 'Order Title Search',
      description: 'Complete title search for property',
      assigned_to: 'title@company.com',
      due_date: '2024-01-25',
      priority: 'HIGH',
      status: 'PENDING',
      created_at: '2024-01-18T10:00:00Z',
    },
  },
  delivery_id: 'delivery_010',
  signature: 'sha256=mock_signature_task001abc',
};

export const webhookTaskCompleted = {
  event: {
    id: 'evt_task_completed_001',
    type: WebhookEventType.TASK_COMPLETED,
    timestamp: '2024-01-24T15:30:00Z',
    data: {
      id: 'TASK-001',
      transaction_id: 'SP-12345',
      title: 'Order Title Search',
      status: 'COMPLETED',
      completed_at: '2024-01-24T15:30:00Z',
      completed_by: 'title@company.com',
      completion_notes: 'Title search completed successfully',
    },
  },
  delivery_id: 'delivery_011',
  signature: 'sha256=mock_signature_task001xyz',
};

export const webhookClosingScheduled = {
  event: {
    id: 'evt_closing_scheduled_001',
    type: WebhookEventType.CLOSING_SCHEDULED,
    timestamp: '2024-03-01T10:00:00Z',
    data: {
      transaction_id: 'SP-12345',
      closing_date: '2024-03-15',
      closing_time: '14:00:00',
      location: 'Title Company Office',
      address: {
        street: '789 Title Street',
        city: 'San Francisco',
        state: 'CA',
        zip: '94104',
      },
      attendees: [
        {
          name: 'John Doe',
          role: 'Buyer',
          email: 'john.doe@example.com',
        },
        {
          name: 'Jane Smith',
          role: 'Seller',
          email: 'jane.smith@example.com',
        },
        {
          name: 'Escrow Officer',
          role: 'Officer',
          email: 'escrow@titlecompany.com',
        },
      ],
      scheduled_by: 'escrow@titlecompany.com',
      scheduled_at: '2024-03-01T10:00:00Z',
    },
  },
  delivery_id: 'delivery_012',
  signature: 'sha256=mock_signature_closing001',
};

export const webhookClosingCompleted = {
  event: {
    id: 'evt_closing_completed_001',
    type: WebhookEventType.CLOSING_COMPLETED,
    timestamp: '2024-03-15T16:00:00Z',
    data: {
      transaction_id: 'SP-12345',
      closing_date: '2024-03-15',
      closing_time: '14:00:00',
      actual_completion_time: '16:00:00',
      final_purchase_price: 850000,
      final_loan_amount: 680000,
      cash_to_close: 170000,
      documents_recorded: true,
      funds_disbursed: true,
      completed_by: 'escrow@titlecompany.com',
      notes: 'Closing completed successfully. All documents recorded.',
    },
  },
  delivery_id: 'delivery_013',
  signature: 'sha256=mock_signature_closing002',
};

// ============================================================================
// MALFORMED/INVALID PAYLOADS FOR ERROR TESTING
// ============================================================================

export const webhookInvalidSignature = {
  event: {
    id: 'evt_invalid_001',
    type: WebhookEventType.TRANSACTION_CREATED,
    timestamp: '2024-01-15T10:30:00Z',
    data: {
      id: 'SP-99999',
    },
  },
  delivery_id: 'delivery_invalid_001',
  signature: 'sha256=invalid_signature_wrong',
};

export const webhookExpiredTimestamp = {
  event: {
    id: 'evt_expired_001',
    type: WebhookEventType.TRANSACTION_CREATED,
    timestamp: '2020-01-01T00:00:00Z', // Old timestamp
    data: {
      id: 'SP-99999',
    },
  },
  delivery_id: 'delivery_expired_001',
  signature: 'sha256=mock_signature_expired',
};

export const webhookMissingData = {
  event: {
    id: 'evt_missing_data_001',
    type: WebhookEventType.TRANSACTION_CREATED,
    timestamp: '2024-01-15T10:30:00Z',
    data: null, // Missing data
  },
  delivery_id: 'delivery_missing_001',
  signature: 'sha256=mock_signature_missing',
};

export const webhookDuplicateEvent = {
  event: {
    id: 'evt_duplicate_001', // Same ID as existing event
    type: WebhookEventType.TRANSACTION_UPDATED,
    timestamp: '2024-01-16T10:30:00Z',
    data: {
      id: 'SP-12345',
      status: 'IN_PROGRESS',
    },
  },
  delivery_id: 'delivery_duplicate_001',
  signature: 'sha256=mock_signature_duplicate',
};

// ============================================================================
// EXPORT ALL WEBHOOK PAYLOADS
// ============================================================================

export const webhookPayloads = {
  transactionCreated: webhookTransactionCreated,
  transactionUpdated: webhookTransactionUpdated,
  transactionStatusChanged: webhookTransactionStatusChanged,
  documentUploaded: webhookDocumentUploaded,
  documentUpdated: webhookDocumentUpdated,
  documentDeleted: webhookDocumentDeleted,
  contactCreated: webhookContactCreated,
  contactUpdated: webhookContactUpdated,
  contactDeleted: webhookContactDeleted,
  taskCreated: webhookTaskCreated,
  taskCompleted: webhookTaskCompleted,
  closingScheduled: webhookClosingScheduled,
  closingCompleted: webhookClosingCompleted,
  invalid: {
    invalidSignature: webhookInvalidSignature,
    expiredTimestamp: webhookExpiredTimestamp,
    missingData: webhookMissingData,
    duplicateEvent: webhookDuplicateEvent,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a valid HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload: any, secret: string): string {
  const crypto = require('crypto');
  const payloadString = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}

/**
 * Create a webhook payload with valid signature
 */
export function createSignedWebhookPayload(
  eventType: WebhookEventType,
  data: any,
  secret: string
): any {
  const event = {
    id: `evt_${Date.now()}`,
    type: eventType,
    timestamp: new Date().toISOString(),
    data,
  };

  const payload = {
    event,
    delivery_id: `delivery_${Date.now()}`,
    signature: '',
  };

  payload.signature = `sha256=${generateWebhookSignature(payload, secret)}`;

  return payload;
}
