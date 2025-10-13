import { Router } from 'express';
import { body, query, param } from 'express-validator';
import * as documentController from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/documents
 * @desc    Upload a new document
 * @access  Private
 */
router.post(
  '/',
  uploadSingle,
  [
    body('clientId').optional().isString().withMessage('Client ID must be a string'),
    body('title').optional().isString().withMessage('Title must be a string'),
    body('type').optional().isIn([
      'Purchase Agreement',
      'Title Deed',
      'Inspection Report',
      'Mortgage Document',
      'Disclosure Form',
      'Listing Agreement',
      'Rental Agreement',
      'Escrow Document'
    ]).withMessage('Invalid document type'),
    body('metadata').optional().isJSON().withMessage('Metadata must be valid JSON'),
    validate
  ],
  documentController.uploadDocument
);

/**
 * @route   GET /api/v1/documents
 * @desc    Get all documents for authenticated user
 * @access  Private
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['pending', 'active', 'expiring', 'expired']),
    query('type').optional().isString(),
    query('clientId').optional().isString(),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validate
  ],
  documentController.getDocuments
);

/**
 * @route   GET /api/v1/documents/stats
 * @desc    Get document statistics
 * @access  Private
 */
router.get('/stats', documentController.getDocumentStats);

/**
 * @route   GET /api/v1/documents/:id
 * @desc    Get a single document
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isString().withMessage('Document ID is required'),
    validate
  ],
  documentController.getDocument
);

/**
 * @route   PUT /api/v1/documents/:id
 * @desc    Update document metadata
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isString().withMessage('Document ID is required'),
    body('title').optional().isString().withMessage('Title must be a string'),
    body('type').optional().isIn([
      'Purchase Agreement',
      'Title Deed',
      'Inspection Report',
      'Mortgage Document',
      'Disclosure Form',
      'Listing Agreement',
      'Rental Agreement',
      'Escrow Document'
    ]).withMessage('Invalid document type'),
    body('status').optional().isIn(['pending', 'active', 'expiring', 'expired']),
    body('clientId').optional().isString(),
    validate
  ],
  documentController.updateDocument
);

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Delete a document (soft delete)
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id').isString().withMessage('Document ID is required'),
    validate
  ],
  documentController.deleteDocument
);

export default router;
