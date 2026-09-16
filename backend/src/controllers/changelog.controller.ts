import { Request, Response, NextFunction } from 'express';
import {
  ChangelogService,
  ChangelogError,
} from '../services/changelog.service';
import { ApiResponse } from '../utils/apiResponse';
import { ReactionType } from '../models/reaction.model';

export class ChangelogController {
  /**
   * POST /api/v1/changelog
   */
  static async createChangelog(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authorId = req.user!.id;
      const changelog = await ChangelogService.createChangelog(
        authorId,
        req.body
      );
      ApiResponse.success(res, changelog, 201);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/changelog/admin
   */
  static async listAdminChangelogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await ChangelogService.listAdminChangelogs(req.query);
      ApiResponse.success(res, result);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/changelog/admin/:id
   */
  static async getAdminChangelogById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const changelog = await ChangelogService.getAdminChangelogById(
        req.params.id as string
      );
      ApiResponse.success(res, changelog);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * PATCH /api/v1/changelog/:id
   */
  static async updateChangelog(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const changelog = await ChangelogService.updateChangelog(
        req.params.id as string,
        req.body
      );
      ApiResponse.success(res, changelog);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/changelog/:id
   */
  static async deleteChangelog(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await ChangelogService.deleteChangelog(
        req.params.id as string
      );
      ApiResponse.success(res, result);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/changelog/:id/publish
   */
  static async publishChangelog(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const changelog = await ChangelogService.publishChangelog(
        req.params.id as string
      );
      ApiResponse.success(res, changelog);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/changelog/:id/unpublish
   */
  static async unpublishChangelog(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const changelog = await ChangelogService.unpublishChangelog(
        req.params.id as string
      );
      ApiResponse.success(res, changelog);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/changelog
   */
  static async listPublicChangelogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await ChangelogService.listPublicChangelogs(req.query);
      ApiResponse.success(res, result);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/changelog/feed
   */
  static async getPublicFeed(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await ChangelogService.getPublicFeed(req.query);
      ApiResponse.success(res, result);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/changelog/:slug/related
   */
  static async getRelatedChangelogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const items = await ChangelogService.getRelatedChangelogs(
        req.params.slug as string
      );
      ApiResponse.success(res, { items });
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/changelog/:slug
   */
  static async getPublicChangelogBySlug(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const changelog = await ChangelogService.getPublicChangelogBySlug(
        req.params.slug as string,
        userId
      );
      ApiResponse.success(res, changelog);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/changelog/:id/reactions
   */
  static async addReaction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const changelogId = req.params.id as string;
      const { type } = req.body;

      const result = await ChangelogService.addReaction(
        userId,
        changelogId,
        type as ReactionType
      );
      ApiResponse.success(res, result);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/changelog/:id/reactions/:type
   */
  static async removeReaction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const changelogId = req.params.id as string;
      const type = req.params.type as ReactionType;

      const result = await ChangelogService.removeReaction(
        userId,
        changelogId,
        type
      );
      ApiResponse.success(res, result);
    } catch (error) {
      if (error instanceof ChangelogError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }
}
