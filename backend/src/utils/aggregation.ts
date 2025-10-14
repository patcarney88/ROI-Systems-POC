import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { Client } from '../models/Client';
import { Document } from '../models/Document';
import { Campaign } from '../models/Campaign';

/**
 * Calculate engagement scores efficiently using SQL
 * Prevents N+1 queries by using a single SQL query with CASE statement
 *
 * @param userId - User ID to calculate scores for
 * @returns Array of clients with calculated engagement scores
 */
export async function calculateEngagementScores(userId: string) {
  const query = `
    SELECT
      id,
      name,
      email,
      (
        CASE
          WHEN last_contact > NOW() - INTERVAL '7 days' THEN 100
          WHEN last_contact > NOW() - INTERVAL '14 days' THEN 75
          WHEN last_contact > NOW() - INTERVAL '30 days' THEN 50
          WHEN last_contact > NOW() - INTERVAL '60 days' THEN 25
          ELSE 0
        END
      ) as calculated_engagement_score,
      engagement_score as current_score,
      last_contact
    FROM clients
    WHERE user_id = :userId
    ORDER BY calculated_engagement_score DESC;
  `;

  return await sequelize.query(query, {
    replacements: { userId },
    type: QueryTypes.SELECT,
  });
}

/**
 * Get document statistics by status for a user
 * Single optimized query instead of multiple queries
 */
export async function getDocumentStatsByUser(userId: string) {
  const query = `
    SELECT
      status,
      COUNT(*) as count,
      SUM(file_size) as total_size,
      AVG(file_size) as avg_size
    FROM documents
    WHERE user_id = :userId
    GROUP BY status;
  `;

  return await sequelize.query(query, {
    replacements: { userId },
    type: QueryTypes.SELECT,
  });
}

/**
 * Get client activity summary with document counts
 * Efficient JOIN query to get all data in one go
 */
export async function getClientActivitySummary(userId: string) {
  const query = `
    SELECT
      c.id,
      c.name,
      c.email,
      c.status,
      c.engagement_score,
      c.last_contact,
      COUNT(d.id) as document_count,
      MAX(d.upload_date) as last_document_upload,
      SUM(d.file_size) as total_storage
    FROM clients c
    LEFT JOIN documents d ON c.id = d.client_id
    WHERE c.user_id = :userId
    GROUP BY c.id, c.name, c.email, c.status, c.engagement_score, c.last_contact
    ORDER BY c.engagement_score DESC;
  `;

  return await sequelize.query(query, {
    replacements: { userId },
    type: QueryTypes.SELECT,
  });
}

/**
 * Get campaign performance metrics
 * Aggregates all campaign stats in a single query
 */
export async function getCampaignPerformanceMetrics(userId: string) {
  const query = `
    SELECT
      COUNT(*) as total_campaigns,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_campaigns,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_campaigns,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_campaigns,
      SUM((stats->>'sent')::int) as total_sent,
      SUM((stats->>'opened')::int) as total_opened,
      SUM((stats->>'clicked')::int) as total_clicked,
      AVG(
        CASE
          WHEN (stats->>'sent')::int > 0
          THEN ((stats->>'opened')::int * 100.0 / (stats->>'sent')::int)
          ELSE 0
        END
      ) as avg_open_rate,
      AVG(
        CASE
          WHEN (stats->>'sent')::int > 0
          THEN ((stats->>'clicked')::int * 100.0 / (stats->>'sent')::int)
          ELSE 0
        END
      ) as avg_click_rate
    FROM campaigns
    WHERE user_id = :userId;
  `;

  const results = await sequelize.query(query, {
    replacements: { userId },
    type: QueryTypes.SELECT,
  });

  return results[0] || {};
}

/**
 * Get document expiry summary
 * Finds documents expiring soon in a single query
 */
export async function getDocumentExpirySummary(userId: string) {
  const query = `
    SELECT
      COUNT(*) FILTER (WHERE expiry_date < NOW()) as expired,
      COUNT(*) FILTER (WHERE expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') as expiring_soon,
      COUNT(*) FILTER (WHERE expiry_date BETWEEN NOW() AND NOW() + INTERVAL '7 days') as expiring_week,
      COUNT(*) FILTER (WHERE expiry_date > NOW() + INTERVAL '30 days') as valid
    FROM documents
    WHERE user_id = :userId AND expiry_date IS NOT NULL;
  `;

  const results = await sequelize.query(query, {
    replacements: { userId },
    type: QueryTypes.SELECT,
  });

  return results[0] || { expired: 0, expiring_soon: 0, expiring_week: 0, valid: 0 };
}

/**
 * Get top clients by document count
 * Efficient aggregation with LIMIT
 */
export async function getTopClientsByDocuments(userId: string, limit: number = 10) {
  const query = `
    SELECT
      c.id,
      c.name,
      c.email,
      c.engagement_score,
      COUNT(d.id) as document_count,
      MAX(d.upload_date) as last_upload
    FROM clients c
    LEFT JOIN documents d ON c.id = d.client_id
    WHERE c.user_id = :userId
    GROUP BY c.id, c.name, c.email, c.engagement_score
    ORDER BY document_count DESC
    LIMIT :limit;
  `;

  return await sequelize.query(query, {
    replacements: { userId, limit },
    type: QueryTypes.SELECT,
  });
}

/**
 * Get dashboard overview statistics
 * Single query to get all overview metrics
 */
export async function getDashboardOverview(userId: string) {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM clients WHERE user_id = :userId) as total_clients,
      (SELECT COUNT(*) FROM clients WHERE user_id = :userId AND status = 'active') as active_clients,
      (SELECT COUNT(*) FROM clients WHERE user_id = :userId AND status = 'at-risk') as at_risk_clients,
      (SELECT COUNT(*) FROM documents WHERE user_id = :userId) as total_documents,
      (SELECT COUNT(*) FROM documents WHERE user_id = :userId AND status = 'active') as active_documents,
      (SELECT COUNT(*) FROM documents WHERE user_id = :userId AND status = 'expiring') as expiring_documents,
      (SELECT COUNT(*) FROM campaigns WHERE user_id = :userId) as total_campaigns,
      (SELECT COUNT(*) FROM campaigns WHERE user_id = :userId AND status = 'sent') as sent_campaigns,
      (SELECT AVG(engagement_score)::int FROM clients WHERE user_id = :userId) as avg_engagement_score,
      (SELECT SUM(file_size) FROM documents WHERE user_id = :userId) as total_storage;
  `;

  const results = await sequelize.query(query, {
    replacements: { userId },
    type: QueryTypes.SELECT,
  });

  return results[0] || {};
}

/**
 * Batch update engagement scores
 * Updates all client engagement scores based on last contact
 */
export async function batchUpdateEngagementScores() {
  const query = `
    UPDATE clients
    SET
      engagement_score = (
        CASE
          WHEN last_contact > NOW() - INTERVAL '7 days' THEN 100
          WHEN last_contact > NOW() - INTERVAL '14 days' THEN 75
          WHEN last_contact > NOW() - INTERVAL '30 days' THEN 50
          WHEN last_contact > NOW() - INTERVAL '60 days' THEN 25
          ELSE 0
        END
      ),
      status = (
        CASE
          WHEN last_contact > NOW() - INTERVAL '30 days' THEN 'active'::client_status
          WHEN last_contact > NOW() - INTERVAL '60 days' THEN 'at-risk'::client_status
          ELSE 'dormant'::client_status
        END
      ),
      updated_at = NOW()
    WHERE last_contact IS NOT NULL;
  `;

  return await sequelize.query(query, {
    type: QueryTypes.UPDATE,
  });
}
