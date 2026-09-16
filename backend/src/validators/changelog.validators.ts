import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { ValidatorFn } from '../middleware/validation.middleware';
import { ChangelogCategory } from '../models/changelog.model';
import { ReactionType } from '../models/reaction.model';

const VALID_CATEGORIES: ChangelogCategory[] = ['new', 'improved', 'fixed'];
const VALID_REACTION_TYPES: ReactionType[] = ['heart', 'celebrate', 'rocket'];
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates create changelog request body.
 */
export const validateCreateChangelogInput: ValidatorFn = (data: unknown) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const { title, contentMarkdown, category, coverImage } = data as Record<
    string,
    unknown
  >;

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Title is required and must be at least 3 characters long');
  } else if (title.trim().length > 200) {
    errors.push('Title cannot exceed 200 characters');
  }

  if (
    !contentMarkdown ||
    typeof contentMarkdown !== 'string' ||
    contentMarkdown.trim().length === 0
  ) {
    errors.push('Content markdown is required');
  }

  if (
    !category ||
    typeof category !== 'string' ||
    !VALID_CATEGORIES.includes(category as ChangelogCategory)
  ) {
    errors.push(
      `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
    );
  }

  if (coverImage !== undefined && typeof coverImage !== 'string') {
    errors.push('Cover image must be a string URL if provided');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

/**
 * Validates update changelog request body.
 */
export const validateUpdateChangelogInput: ValidatorFn = (data: unknown) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const { title, contentMarkdown, category, coverImage } = data as Record<
    string,
    unknown
  >;

  const hasAllowedField =
    title !== undefined ||
    contentMarkdown !== undefined ||
    category !== undefined ||
    coverImage !== undefined;

  if (!hasAllowedField) {
    errors.push('At least one field to update must be provided');
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    } else if (title.trim().length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }
  }

  if (contentMarkdown !== undefined) {
    if (typeof contentMarkdown !== 'string' || contentMarkdown.trim().length === 0) {
      errors.push('Content markdown cannot be empty');
    }
  }

  if (category !== undefined) {
    if (
      typeof category !== 'string' ||
      !VALID_CATEGORIES.includes(category as ChangelogCategory)
    ) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
  }

  if (coverImage !== undefined && typeof coverImage !== 'string') {
    errors.push('Cover image must be a string URL');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

/**
 * Validates reaction request body.
 */
export const validateReactionInput: ValidatorFn = (data: unknown) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const { type } = data as Record<string, unknown>;

  if (
    !type ||
    typeof type !== 'string' ||
    !VALID_REACTION_TYPES.includes(type as ReactionType)
  ) {
    errors.push(
      `Reaction type must be one of: ${VALID_REACTION_TYPES.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

/**
 * Middleware validating that an Express request parameter is a valid MongoDB ObjectId.
 */
export const validateObjectId = (paramName = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    if (!id || !OBJECT_ID_REGEX.test(id)) {
      ApiResponse.error(
        res,
        'INVALID_IDENTIFIER',
        `Invalid identifier format for '${paramName}'`,
        400
      );
      return;
    }
    next();
  };
};

/**
 * Validates reaction type parameter in URL params.
 */
export const validateReactionTypeParam = (paramName = 'type') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const type = req.params[paramName];
    if (!type || !VALID_REACTION_TYPES.includes(type as ReactionType)) {
      ApiResponse.error(
        res,
        'INVALID_REACTION_TYPE',
        `Reaction type must be one of: ${VALID_REACTION_TYPES.join(', ')}`,
        400
      );
      return;
    }
    next();
  };
};

/**
 * Validates public/admin changelog query parameters.
 */
export const validateChangelogQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { category, status } = req.query;

  if (
    category &&
    !VALID_CATEGORIES.includes(String(category) as ChangelogCategory)
  ) {
    ApiResponse.error(
      res,
      'INVALID_CATEGORY',
      `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      400
    );
    return;
  }

  if (status && !['draft', 'published'].includes(String(status))) {
    ApiResponse.error(
      res,
      'INVALID_STATUS',
      "Status must be either 'draft' or 'published'",
      400
    );
    return;
  }

  next();
};
