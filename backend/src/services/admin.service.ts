import { Changelog, ChangelogCategory } from '../models/changelog.model';
import { User } from '../models/user.model';
import { Reaction, ReactionType } from '../models/reaction.model';
import { ChangelogService } from './changelog.service';

export interface AdminInsightsResponse {
  changelogs: {
    total: number;
    published: number;
    draft: number;
  };
  reactions: {
    total: number;
    byType: {
      heart: number;
      celebrate: number;
      rocket: number;
    };
  };
  users: {
    total: number;
    verified: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    slug: string;
    category: ChangelogCategory;
    publishedAt: Date | null;
    reactions: {
      heart: number;
      celebrate: number;
      rocket: number;
      total: number;
    };
  }>;
}

export class AdminService {
  /**
   * Aggregates key system insights for administrator reporting.
   */
  static async getInsights(): Promise<AdminInsightsResponse> {
    const [
      totalChangelogs,
      publishedChangelogs,
      draftChangelogs,
      totalUsers,
      verifiedUsers,
      totalReactions,
      reactionTypeAgg,
      recentDocs,
    ] = await Promise.all([
      Changelog.countDocuments(),
      Changelog.countDocuments({ status: 'published' }),
      Changelog.countDocuments({ status: 'draft' }),
      User.countDocuments(),
      User.countDocuments({ isEmailVerified: true }),
      Reaction.countDocuments(),
      Reaction.aggregate<{ _id: ReactionType; count: number }>([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Changelog.find({ status: 'published' })
        .sort({ publishedAt: -1 })
        .limit(5)
        .select('title slug category publishedAt'),
    ]);

    // Build byType reaction breakdown
    const byType: Record<ReactionType, number> = {
      heart: 0,
      celebrate: 0,
      rocket: 0,
    };

    reactionTypeAgg.forEach((item) => {
      if (item._id in byType) {
        byType[item._id] = item.count;
      }
    });

    // Populate reaction counts for recent activity
    const recentActivity = await Promise.all(
      recentDocs.map(async (item) => {
        const reactions = await ChangelogService.getReactionCounts(
          item._id.toString()
        );
        return {
          id: item._id.toString(),
          title: item.title,
          slug: item.slug,
          category: item.category,
          publishedAt: item.publishedAt || null,
          reactions: {
            ...reactions,
            total: reactions.heart + reactions.celebrate + reactions.rocket,
          },
        };
      })
    );

    return {
      changelogs: {
        total: totalChangelogs,
        published: publishedChangelogs,
        draft: draftChangelogs,
      },
      reactions: {
        total: totalReactions,
        byType,
      },
      users: {
        total: totalUsers,
        verified: verifiedUsers,
      },
      recentActivity,
    };
  }
}
