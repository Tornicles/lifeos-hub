/**
 * Pagination utilities for LifeOS API
 * Provides consistent pagination across all list endpoints
 */

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Normalize pagination parameters
 */
export function normalizePaginationParams(params: PaginationParams): {
  limit: number;
  offset: number;
} {
  let { limit = DEFAULT_LIMIT, offset = 0, page } = params;

  // If page is provided, convert to offset
  if (page !== undefined && page > 0) {
    offset = (page - 1) * limit;
  }

  // Enforce limits
  limit = Math.min(Math.max(1, limit), MAX_LIMIT);
  offset = Math.max(0, offset);

  return { limit, offset };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
): PaginatedResponse<T> {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasMore = offset + data.length < total;

  return {
    data,
    total,
    page,
    limit,
    hasMore,
    totalPages
  };
}

/**
 * Supabase pagination helper
 */
export function applySupabasePagination<T>(
  query: any,
  params: PaginationParams
): any {
  const { limit, offset } = normalizePaginationParams(params);
  return query.range(offset, offset + limit - 1);
}

/**
 * Get pagination info for UI display
 */
export function getPaginationInfo(
  total: number,
  page: number,
  limit: number
): {
  start: number;
  end: number;
  total: number;
} {
  const start = Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);
  
  return { start, end, total };
}

/**
 * Calculate page numbers for pagination UI
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | '...')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  if (currentPage <= halfVisible) {
    // Near start
    for (let i = 1; i <= maxVisible - 2; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - halfVisible) {
    // Near end
    pages.push(1);
    pages.push('...');
    for (let i = totalPages - (maxVisible - 3); i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Middle
    pages.push(1);
    pages.push('...');
    for (let i = currentPage - halfVisible + 2; i <= currentPage + halfVisible - 2; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(totalPages);
  }

  return pages;
}
