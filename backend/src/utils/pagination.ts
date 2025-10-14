import { Model, FindOptions, CountOptions } from 'sequelize';

export interface PaginationOptions {
  page: number;
  limit: number;
  where?: any;
  include?: any[];
  order?: any;
  attributes?: any;
  group?: any;
  distinct?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Efficient pagination utility to prevent N+1 queries
 * Uses parallel COUNT and SELECT queries with same WHERE clause
 *
 * @param model - Sequelize model
 * @param options - Pagination options with where, include, order, etc.
 * @returns Paginated result with data and pagination metadata
 */
export async function paginateQuery<T extends Model>(
  model: typeof Model,
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const {
    page = 1,
    limit = 20,
    where = {},
    include = [],
    order = [['created_at', 'DESC']],
    attributes,
    group,
    distinct = false
  } = options;

  // Validate pagination parameters
  const pageNum = Math.max(1, page);
  const limitNum = Math.max(1, Math.min(100, limit)); // Max 100 items per page
  const offset = (pageNum - 1) * limitNum;

  // Build query options
  const findOptions: FindOptions = {
    where,
    include,
    order,
    limit: limitNum,
    offset,
    subQuery: false, // Important for performance with includes
  };

  if (attributes) {
    findOptions.attributes = attributes;
  }

  if (group) {
    findOptions.group = group;
  }

  if (distinct) {
    findOptions.distinct = true;
  }

  // Build count options (same WHERE clause)
  const countOptions: CountOptions = {
    where,
    distinct: distinct || include.length > 0, // Use distinct count with includes
  };

  // If we have includes, we need to count distinct rows
  if (include.length > 0) {
    countOptions.include = include.map((inc: any) => ({
      ...inc,
      attributes: [], // Don't include attributes in count query
    }));
  }

  try {
    // Execute COUNT and SELECT in parallel (no N+1 queries!)
    const [data, total] = await Promise.all([
      model.findAll(findOptions) as Promise<T[]>,
      model.count(countOptions),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  } catch (error) {
    console.error('Pagination error:', error);
    throw new Error(`Failed to paginate query: ${error}`);
  }
}

/**
 * Simple pagination for cases without complex includes
 * Uses findAndCountAll for simplicity
 */
export async function simplePaginate<T extends Model>(
  model: typeof Model,
  options: Omit<PaginationOptions, 'distinct'>
): Promise<PaginatedResult<T>> {
  const {
    page = 1,
    limit = 20,
    where = {},
    include = [],
    order = [['created_at', 'DESC']],
    attributes,
  } = options;

  const pageNum = Math.max(1, page);
  const limitNum = Math.max(1, Math.min(100, limit));
  const offset = (pageNum - 1) * limitNum;

  try {
    const { rows, count } = await model.findAndCountAll({
      where,
      include,
      order,
      limit: limitNum,
      offset,
      attributes,
      distinct: include.length > 0,
      subQuery: false,
    });

    const totalPages = Math.ceil(count / limitNum);

    return {
      data: rows as T[],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  } catch (error) {
    console.error('Simple pagination error:', error);
    throw new Error(`Failed to paginate query: ${error}`);
  }
}

/**
 * Calculate offset for manual pagination
 */
export function calculateOffset(page: number, limit: number): number {
  const pageNum = Math.max(1, page);
  const limitNum = Math.max(1, limit);
  return (pageNum - 1) * limitNum;
}

/**
 * Validate and normalize pagination parameters
 */
export function normalizePaginationParams(page?: any, limit?: any): { page: number; limit: number } {
  const pageNum = Math.max(1, parseInt(String(page)) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 20));

  return { page: pageNum, limit: limitNum };
}
