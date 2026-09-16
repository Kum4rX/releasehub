export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMetadata;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

/**
 * Builds standard pagination metadata object.
 */
export const buildPaginationMetadata = (
  page: number,
  limit: number,
  totalItems: number
): PaginationMetadata => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);

  return {
    page: safePage,
    limit,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
};

/**
 * Parses and sanitizes pagination query parameters.
 */
export const sanitizePaginationParams = (
  rawPage?: unknown,
  rawLimit?: unknown
): { page: number; limit: number; skip: number } => {
  let page = parseInt(String(rawPage), 10);
  let limit = parseInt(String(rawLimit), 10);

  if (isNaN(page) || page < 1) {
    page = DEFAULT_PAGE;
  }

  if (isNaN(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  } else if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};
