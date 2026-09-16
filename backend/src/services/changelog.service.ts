import { Types } from 'mongoose';
import { Changelog, IChangelog, ChangelogCategory, ChangelogStatus } from '../models/changelog.model';
import { Reaction, ReactionType } from '../models/reaction.model';
import { generateUniqueSlug } from '../utils/slug.util';
import {
  buildPaginationMetadata,
  sanitizePaginationParams,
  PaginatedResult,
} from '../utils/pagination.util';

export interface CreateChangelogDTO {
  title: string;
  contentMarkdown: string;
  category: ChangelogCategory;
  coverImage?: string;
}

export interface UpdateChangelogDTO {
  title?: string;
  contentMarkdown?: string;
  category?: ChangelogCategory;
  coverImage?: string;
}

export interface ChangelogQueryOptions {
  page?: unknown;
  limit?: unknown;
  status?: ChangelogStatus;
  category?: ChangelogCategory;
  search?: string;
}

export interface ReactionCounts {
  heart: number;
  celebrate: number;
  rocket: number;
}

export interface UserReactions {
  heart: boolean;
  celebrate: boolean;
  rocket: boolean;
}

export class ChangelogError extends Error {
  statusCode: number;
  code: string;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'ChangelogError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ChangelogService {
  /**
   * Aggregates reaction counts for a changelog.
   */
  static async getReactionCounts(
    changelogId: Types.ObjectId | string
  ): Promise<ReactionCounts> {
    const objectId =
      typeof changelogId === 'string'
        ? new Types.ObjectId(changelogId)
        : changelogId;

    const results = await Reaction.aggregate([
      { $match: { changelog: objectId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const counts: ReactionCounts = {
      heart: 0,
      celebrate: 0,
      rocket: 0,
    };

    for (const r of results) {
      if (r._id in counts) {
        counts[r._id as keyof ReactionCounts] = r.count;
      }
    }

    return counts;
  }

  /**
   * Retrieves the current user's reaction states for a changelog.
   */
  static async getUserReactions(
    changelogId: Types.ObjectId | string,
    userId?: string
  ): Promise<UserReactions | undefined> {
    if (!userId) return undefined;

    const userReactions = await Reaction.find({
      changelog: changelogId,
      user: userId,
    }).select('type');

    const state: UserReactions = {
      heart: false,
      celebrate: false,
      rocket: false,
    };

    for (const r of userReactions) {
      if (r.type in state) {
        state[r.type as keyof UserReactions] = true;
      }
    }

    return state;
  }

  // ==========================================
  // ADMIN CHANGELOG OPERATIONS
  // ==========================================

  /**
   * Creates a new draft changelog update.
   */
  static async createChangelog(
    authorId: string,
    data: CreateChangelogDTO
  ): Promise<IChangelog> {
    const slug = await generateUniqueSlug(data.title);

    const changelog = await Changelog.create({
      title: data.title.trim(),
      slug,
      contentMarkdown: data.contentMarkdown,
      category: data.category,
      coverImage: data.coverImage?.trim(),
      status: 'draft',
      author: new Types.ObjectId(authorId),
    });

    await changelog.populate('author', 'name email role');
    return changelog;
  }

  /**
   * Lists all changelogs for admins with status, category, and keyword filters.
   */
  static async listAdminChangelogs(
    options: ChangelogQueryOptions
  ): Promise<PaginatedResult<IChangelog>> {
    const { page, limit, skip } = sanitizePaginationParams(
      options.page,
      options.limit
    );

    const filter: Record<string, unknown> = {};

    if (options.status) {
      filter.status = options.status;
    }

    if (options.category) {
      filter.category = options.category;
    }

    if (options.search && typeof options.search === 'string' && options.search.trim()) {
      const searchRegex = { $regex: options.search.trim(), $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { contentMarkdown: searchRegex },
      ];
    }

    const totalItems = await Changelog.countDocuments(filter);
    const items = await Changelog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email role');

    return {
      items,
      pagination: buildPaginationMetadata(page, limit, totalItems),
    };
  }

  /**
   * Retrieves a single changelog by ID for admin review.
   */
  static async getAdminChangelogById(id: string): Promise<IChangelog> {
    const changelog = await Changelog.findById(id).populate(
      'author',
      'name email role'
    );
    if (!changelog) {
      throw new ChangelogError(
        'CHANGELOG_NOT_FOUND',
        'Changelog update not found',
        404
      );
    }
    return changelog;
  }

  /**
   * Updates an existing changelog update.
   */
  static async updateChangelog(
    id: string,
    data: UpdateChangelogDTO
  ): Promise<IChangelog> {
    const changelog = await Changelog.findById(id);
    if (!changelog) {
      throw new ChangelogError(
        'CHANGELOG_NOT_FOUND',
        'Changelog update not found',
        404
      );
    }

    if (data.title && data.title.trim() !== changelog.title) {
      changelog.title = data.title.trim();
      changelog.slug = await generateUniqueSlug(data.title.trim(), id);
    }

    if (data.contentMarkdown !== undefined) {
      changelog.contentMarkdown = data.contentMarkdown;
    }

    if (data.category !== undefined) {
      changelog.category = data.category;
    }

    if (data.coverImage !== undefined) {
      changelog.coverImage = data.coverImage.trim();
    }

    await changelog.save();
    await changelog.populate('author', 'name email role');
    return changelog;
  }

  /**
   * Deletes a changelog and its associated reactions.
   */
  static async deleteChangelog(id: string): Promise<{ message: string }> {
    const changelog = await Changelog.findById(id);
    if (!changelog) {
      throw new ChangelogError(
        'CHANGELOG_NOT_FOUND',
        'Changelog update not found',
        404
      );
    }

    await Changelog.findByIdAndDelete(id);

    // Cascading deletion to eliminate orphaned reactions
    await Reaction.deleteMany({ changelog: id });

    return { message: 'Changelog deleted successfully' };
  }

  /**
   * Publishes a draft changelog.
   */
  static async publishChangelog(id: string): Promise<IChangelog> {
    const changelog = await Changelog.findById(id);
    if (!changelog) {
      throw new ChangelogError(
        'CHANGELOG_NOT_FOUND',
        'Changelog update not found',
        404
      );
    }

    changelog.status = 'published';
    if (!changelog.publishedAt) {
      changelog.publishedAt = new Date();
    }

    await changelog.save();
    await changelog.populate('author', 'name email role');
    return changelog;
  }

  /**
   * Unpublishes a published changelog back to draft status.
   */
  static async unpublishChangelog(id: string): Promise<IChangelog> {
    const changelog = await Changelog.findById(id);
    if (!changelog) {
      throw new ChangelogError(
        'CHANGELOG_NOT_FOUND',
        'Changelog update not found',
        404
      );
    }

    changelog.status = 'draft';
    changelog.publishedAt = undefined;

    await changelog.save();
    await changelog.populate('author', 'name email role');
    return changelog;
  }

  // ==========================================
  // PUBLIC CHANGELOG OPERATIONS
  // ==========================================

  /**
   * Lists published changelogs for the public timeline.
   */
  static async listPublicChangelogs(
    options: ChangelogQueryOptions
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { page, limit, skip } = sanitizePaginationParams(
      options.page,
      options.limit
    );

    const filter: Record<string, unknown> = { status: 'published' };

    if (options.category) {
      filter.category = options.category;
    }

    if (options.search && typeof options.search === 'string' && options.search.trim()) {
      const searchRegex = { $regex: options.search.trim(), $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { contentMarkdown: searchRegex },
      ];
    }

    const totalItems = await Changelog.countDocuments(filter);
    const changelogs = await Changelog.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name');

    // Attach reaction counts to each item
    const items = await Promise.all(
      changelogs.map(async (item) => {
        const reactions = await this.getReactionCounts(item._id as Types.ObjectId);
        const json = item.toJSON();
        return {
          ...json,
          reactions,
        };
      })
    );

    return {
      items,
      pagination: buildPaginationMetadata(page, limit, totalItems),
    };
  }

  /**
   * Retrieves single published changelog detail by slug.
   */
  static async getPublicChangelogBySlug(
    slug: string,
    userId?: string
  ): Promise<Record<string, unknown>> {
    const changelog = await Changelog.findOne({
      slug: slug.toLowerCase().trim(),
      status: 'published',
    }).populate('author', 'name');

    if (!changelog) {
      throw new ChangelogError(
        'CHANGELOG_NOT_FOUND',
        'Changelog update not found or is not published',
        404
      );
    }

    const reactions = await this.getReactionCounts(changelog._id as Types.ObjectId);
    const userReactions = await this.getUserReactions(
      changelog._id as Types.ObjectId,
      userId
    );

    const result: Record<string, unknown> = {
      ...changelog.toJSON(),
      reactions,
    };

    if (userReactions) {
      result.userReactions = userReactions;
    }

    return result;
  }

  /**
   * Provides a clean JSON feed for external widgets and aggregators.
   */
  static async getPublicFeed(
    options: { page?: unknown; limit?: unknown }
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { page, limit, skip } = sanitizePaginationParams(
      options.page,
      options.limit
    );

    const filter = { status: 'published' };
    const totalItems = await Changelog.countDocuments(filter);

    const items = await Changelog.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title slug contentMarkdown category coverImage publishedAt')
      .lean();

    return {
      items,
      pagination: buildPaginationMetadata(page, limit, totalItems),
    };
  }

  /**
   * Retrieves related published updates based on category.
   */
  static async getRelatedChangelogs(
    slug: string,
    limit = 3
  ): Promise<Record<string, unknown>[]> {
    const current = await Changelog.findOne({
      slug: slug.toLowerCase().trim(),
      status: 'published',
    }).select('_id category');

    if (!current) {
      throw new ChangelogError(
        'CHANGELOG_NOT_FOUND',
        'Changelog update not found or is not published',
        404
      );
    }

    const related = await Changelog.find({
      status: 'published',
      _id: { $ne: current._id },
      category: current.category,
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('title slug category publishedAt coverImage')
      .lean();

    return related;
  }

  // ==========================================
  // REACTION OPERATIONS
  // ==========================================

  /**
   * Adds a reaction to a published changelog for the authenticated user.
   */
  static async addReaction(
    userId: string,
    changelogId: string,
    type: ReactionType
  ): Promise<{ reactions: ReactionCounts; userReactions: UserReactions }> {
    const changelog = await Changelog.findById(changelogId).select('status');
    if (!changelog) {
      throw new ChangelogError(
        'CHANGELOG_NOT_FOUND',
        'Changelog update not found',
        404
      );
    }

    if (changelog.status !== 'published') {
      throw new ChangelogError(
        'INVALID_OPERATION',
        'Cannot react to unpublished changelogs',
        400
      );
    }

    // Try creating reaction; handle duplicate compound index gracefully
    try {
      await Reaction.create({
        user: new Types.ObjectId(userId),
        changelog: new Types.ObjectId(changelogId),
        type,
      });
    } catch (err: unknown) {
      // E11000 duplicate key error means reaction already exists
      if ((err as { code?: number }).code !== 11000) {
        throw err;
      }
    }

    const reactions = await this.getReactionCounts(changelogId);
    const userReactions = (await this.getUserReactions(changelogId, userId))!;

    return { reactions, userReactions };
  }

  /**
   * Removes a reaction from a changelog for the authenticated user.
   */
  static async removeReaction(
    userId: string,
    changelogId: string,
    type: ReactionType
  ): Promise<{ reactions: ReactionCounts; userReactions: UserReactions }> {
    await Reaction.findOneAndDelete({
      user: new Types.ObjectId(userId),
      changelog: new Types.ObjectId(changelogId),
      type,
    });

    const reactions = await this.getReactionCounts(changelogId);
    const userReactions = (await this.getUserReactions(changelogId, userId))!;

    return { reactions, userReactions };
  }
}
