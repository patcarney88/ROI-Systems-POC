/**
 * Authorization Service
 *
 * Features:
 * - Permission checking for users
 * - Role validation
 * - Organization-level permissions
 * - Document-level access control
 * - Permission caching with Redis
 */

import { PrismaClient, PermissionScope } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { redis } from './session.service';

const logger = createLogger('authorization-service');
const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION
// ============================================================================

const PERMISSION_CACHE_TTL = 300; // 5 minutes

// ============================================================================
// TYPES
// ============================================================================

export interface PermissionCheck {
  resource: string;
  action: string;
  organizationId?: string;
  resourceId?: string;
}

export interface Permission {
  name: string;
  resource: string;
  action: string;
  scope: PermissionScope;
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if user has permission
 * @param userId - User ID
 * @param check - Permission check
 * @returns Boolean indicating if user has permission
 */
export async function hasPermission(
  userId: string,
  check: PermissionCheck
): Promise<boolean> {
  try {
    // Try cache first
    const cacheKey = `perm:${userId}:${check.resource}:${check.action}:${check.organizationId || 'none'}`;
    const cached = await redis.get(cacheKey);

    if (cached !== null) {
      return cached === 'true';
    }

    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Check if user is system admin (has all permissions)
    if (user.role === 'ADMIN') {
      await redis.setex(cacheKey, PERMISSION_CACHE_TTL, 'true');
      return true;
    }

    // Build permission list from roles
    const permissionsFromRoles = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission)
    );

    // Build permission list from direct grants
    const directPermissions = user.userPermissions
      .filter((up) => {
        // Check if permission has expired
        if (up.expiresAt && up.expiresAt < new Date()) {
          return false;
        }
        return true;
      })
      .map((up) => up.permission);

    // Combine all permissions
    const allPermissions = [...permissionsFromRoles, ...directPermissions];

    // Check for specific permission
    const permissionName = `${check.resource}.${check.action}`;
    const hasSpecificPermission = allPermissions.some(
      (p) =>
        p.name === permissionName &&
        (p.scope === PermissionScope.SYSTEM ||
          p.organizationId === check.organizationId ||
          p.organizationId === null)
    );

    // Check for wildcard permissions
    const hasWildcardResource = allPermissions.some(
      (p) =>
        p.name === `${check.resource}.*` ||
        (p.resource === check.resource && p.action === '*')
    );

    const hasWildcardAll = allPermissions.some(
      (p) => p.name === '*.*' || (p.resource === '*' && p.action === '*')
    );

    const result =
      hasSpecificPermission || hasWildcardResource || hasWildcardAll;

    // Cache result
    await redis.setex(cacheKey, PERMISSION_CACHE_TTL, result ? 'true' : 'false');

    return result;
  } catch (error) {
    logger.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Get all permissions for user
 * @param userId - User ID
 * @returns List of permissions
 */
export async function getUserPermissions(
  userId: string
): Promise<Permission[]> {
  try {
    // Try cache first
    const cacheKey = `user:${userId}:permissions`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
          where: {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    // System admins have all permissions
    if (user.role === 'ADMIN') {
      const allPermissions: Permission[] = [
        {
          name: '*.*',
          resource: '*',
          action: '*',
          scope: PermissionScope.SYSTEM,
        },
      ];
      await redis.setex(
        cacheKey,
        PERMISSION_CACHE_TTL,
        JSON.stringify(allPermissions)
      );
      return allPermissions;
    }

    // Collect permissions from roles
    const permissionsFromRoles = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => ({
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        scope: rp.permission.scope,
      }))
    );

    // Collect direct permissions
    const directPermissions = user.userPermissions.map((up) => ({
      name: up.permission.name,
      resource: up.permission.resource,
      action: up.permission.action,
      scope: up.permission.scope,
    }));

    // Combine and deduplicate
    const allPermissions = [...permissionsFromRoles, ...directPermissions];
    const uniquePermissions = Array.from(
      new Map(allPermissions.map((p) => [p.name, p])).values()
    );

    // Cache result
    await redis.setex(
      cacheKey,
      PERMISSION_CACHE_TTL,
      JSON.stringify(uniquePermissions)
    );

    return uniquePermissions;
  } catch (error) {
    logger.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check multiple permissions at once
 * @param userId - User ID
 * @param checks - Array of permission checks
 * @returns Object with permission results
 */
export async function hasPermissions(
  userId: string,
  checks: PermissionCheck[]
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  await Promise.all(
    checks.map(async (check) => {
      const key = `${check.resource}.${check.action}`;
      results[key] = await hasPermission(userId, check);
    })
  );

  return results;
}

/**
 * Invalidate permission cache for user
 * @param userId - User ID
 */
export async function invalidatePermissionCache(userId: string): Promise<void> {
  try {
    // Delete all permission cache keys for user
    const pattern = `perm:${userId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // Delete user permissions cache
    await redis.del(`user:${userId}:permissions`);

    logger.info(`Permission cache invalidated for user: ${userId}`);
  } catch (error) {
    logger.error('Error invalidating permission cache:', error);
  }
}

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

/**
 * Assign role to user
 * @param userId - User ID
 * @param roleId - Role ID
 * @param assignedBy - User ID who assigned the role
 * @param expiresAt - Optional expiry date
 */
export async function assignRole(
  userId: string,
  roleId: string,
  assignedBy: string,
  expiresAt?: Date
): Promise<void> {
  try {
    // Check if assignment already exists
    const existing = await prisma.userRole_User.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existing) {
      throw new Error('Role already assigned to user');
    }

    // Create assignment
    await prisma.userRole_User.create({
      data: {
        userId,
        roleId,
        assignedBy,
        expiresAt,
      },
    });

    // Invalidate cache
    await invalidatePermissionCache(userId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: assignedBy,
        action: 'ROLE_ASSIGN',
        resource: 'user',
        resourceId: userId,
        success: true,
        metadata: {
          roleId,
          targetUserId: userId,
        },
      },
    });

    logger.info(`Role ${roleId} assigned to user ${userId}`);
  } catch (error) {
    logger.error('Error assigning role:', error);
    throw error;
  }
}

/**
 * Unassign role from user
 * @param userId - User ID
 * @param roleId - Role ID
 * @param unassignedBy - User ID who unassigned the role
 */
export async function unassignRole(
  userId: string,
  roleId: string,
  unassignedBy: string
): Promise<void> {
  try {
    await prisma.userRole_User.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    // Invalidate cache
    await invalidatePermissionCache(userId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: unassignedBy,
        action: 'ROLE_UNASSIGN',
        resource: 'user',
        resourceId: userId,
        success: true,
        metadata: {
          roleId,
          targetUserId: userId,
        },
      },
    });

    logger.info(`Role ${roleId} unassigned from user ${userId}`);
  } catch (error) {
    logger.error('Error unassigning role:', error);
    throw error;
  }
}

/**
 * Get user roles
 * @param userId - User ID
 * @returns List of roles
 */
export async function getUserRoles(userId: string): Promise<any[]> {
  try {
    const userRoles = await prisma.userRole_User.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        role: true,
      },
    });

    return userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
      isSystem: ur.role.isSystem,
      assignedAt: ur.assignedAt,
      expiresAt: ur.expiresAt,
    }));
  } catch (error) {
    logger.error('Error getting user roles:', error);
    return [];
  }
}

// ============================================================================
// DOCUMENT ACCESS CONTROL
// ============================================================================

/**
 * Check if user can access document
 * @param userId - User ID
 * @param documentId - Document ID
 * @param action - Action (read, write, delete)
 * @returns Boolean indicating access
 */
export async function canAccessDocument(
  userId: string,
  documentId: string,
  action: 'read' | 'write' | 'delete'
): Promise<boolean> {
  try {
    // Get document with user
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        user: true,
      },
    });

    if (!document) {
      return false;
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // System admins can access all documents
    if (user.role === 'ADMIN') {
      return true;
    }

    // Document owner can perform all actions
    if (document.userId === userId) {
      return true;
    }

    // Company admins can access documents in their organization
    if (
      user.role === 'COMPANY_ADMIN' &&
      user.organizationId === document.user.organizationId
    ) {
      return true;
    }

    // Check specific permission
    const permissionMap = {
      read: 'documents.read',
      write: 'documents.write',
      delete: 'documents.delete',
    };

    return await hasPermission(userId, {
      resource: 'documents',
      action: permissionMap[action].split('.')[1],
      organizationId: document.user.organizationId || undefined,
    });
  } catch (error) {
    logger.error('Error checking document access:', error);
    return false;
  }
}

/**
 * Check if user can access client
 * @param userId - User ID
 * @param clientId - Client ID
 * @param action - Action (read, write, delete)
 * @returns Boolean indicating access
 */
export async function canAccessClient(
  userId: string,
  clientId: string,
  action: 'read' | 'write' | 'delete'
): Promise<boolean> {
  try {
    // Get client with user
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: true,
      },
    });

    if (!client) {
      return false;
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // System admins can access all clients
    if (user.role === 'ADMIN') {
      return true;
    }

    // Client owner can perform all actions
    if (client.userId === userId) {
      return true;
    }

    // Company admins can access clients in their organization
    if (
      user.role === 'COMPANY_ADMIN' &&
      user.organizationId === client.user.organizationId
    ) {
      return true;
    }

    // Check specific permission
    const permissionMap = {
      read: 'clients.read',
      write: 'clients.write',
      delete: 'clients.delete',
    };

    return await hasPermission(userId, {
      resource: 'clients',
      action: permissionMap[action].split('.')[1],
      organizationId: client.user.organizationId || undefined,
    });
  } catch (error) {
    logger.error('Error checking client access:', error);
    return false;
  }
}

// ============================================================================
// PERMISSION GRANTS
// ============================================================================

/**
 * Grant permission to user
 * @param userId - User ID
 * @param permissionId - Permission ID
 * @param grantedBy - User ID who granted permission
 * @param expiresAt - Optional expiry date
 */
export async function grantPermission(
  userId: string,
  permissionId: string,
  grantedBy: string,
  expiresAt?: Date
): Promise<void> {
  try {
    // Check if grant already exists
    const existing = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
    });

    if (existing) {
      throw new Error('Permission already granted to user');
    }

    // Create grant
    await prisma.userPermission.create({
      data: {
        userId,
        permissionId,
        grantedBy,
        expiresAt,
      },
    });

    // Invalidate cache
    await invalidatePermissionCache(userId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: grantedBy,
        action: 'PERMISSION_GRANT',
        resource: 'user',
        resourceId: userId,
        success: true,
        metadata: {
          permissionId,
          targetUserId: userId,
        },
      },
    });

    logger.info(`Permission ${permissionId} granted to user ${userId}`);
  } catch (error) {
    logger.error('Error granting permission:', error);
    throw error;
  }
}

/**
 * Revoke permission from user
 * @param userId - User ID
 * @param permissionId - Permission ID
 * @param revokedBy - User ID who revoked permission
 */
export async function revokePermission(
  userId: string,
  permissionId: string,
  revokedBy: string
): Promise<void> {
  try {
    await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
    });

    // Invalidate cache
    await invalidatePermissionCache(userId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: revokedBy,
        action: 'PERMISSION_REVOKE',
        resource: 'user',
        resourceId: userId,
        success: true,
        metadata: {
          permissionId,
          targetUserId: userId,
        },
      },
    });

    logger.info(`Permission ${permissionId} revoked from user ${userId}`);
  } catch (error) {
    logger.error('Error revoking permission:', error);
    throw error;
  }
}
