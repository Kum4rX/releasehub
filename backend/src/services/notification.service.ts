import { User } from '../models/user.model';
import { Changelog, ChangelogCategory } from '../models/changelog.model';
import { ChangelogService } from './changelog.service';

export interface NotificationUpdateItem {
  id: string;
  title: string;
  slug: string;
  category: ChangelogCategory;
  publishedAt: Date | null;
  coverImage?: string;
  contentMarkdown: string;
  isUnread: boolean;
  reactions: {
    heart: number;
    celebrate: number;
    rocket: number;
    total: number;
  };
}

export interface WhatsNewResponse {
  unreadCount: number;
  lastViewedAt: Date | null;
  updates: NotificationUpdateItem[];
}

export class NotificationService {
  /**
   * Retrieves What's New notification updates and unread count for the authenticated user.
   */
  static async getWhatsNew(userId: string): Promise<WhatsNewResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const lastViewed = user.lastViewedChangelogDate
      ? new Date(user.lastViewedChangelogDate)
      : null;

    // Fetch published updates in reverse-chronological order
    const changelogs = await Changelog.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(20);

    // Calculate unread count across all published updates
    let unreadCount: number;
    if (!lastViewed) {
      // If user has never viewed notifications, all published updates are treated as unread
      unreadCount = await Changelog.countDocuments({ status: 'published' });
    } else {
      unreadCount = await Changelog.countDocuments({
        status: 'published',
        publishedAt: { $gt: lastViewed },
      });
    }

    // Attach isUnread flag and reaction counts to each update
    const updates: NotificationUpdateItem[] = await Promise.all(
      changelogs.map(async (item) => {
        const reactions = await ChangelogService.getReactionCounts(
          item._id.toString()
        );

        let isUnread = true;
        if (lastViewed && item.publishedAt) {
          isUnread = new Date(item.publishedAt).getTime() > lastViewed.getTime();
        }

        return {
          id: item._id.toString(),
          title: item.title,
          slug: item.slug,
          category: item.category,
          publishedAt: item.publishedAt || null,
          coverImage: item.coverImage,
          contentMarkdown: item.contentMarkdown,
          isUnread,
          reactions: {
            ...reactions,
            total: reactions.heart + reactions.celebrate + reactions.rocket,
          },
        };
      })
    );

    return {
      unreadCount,
      lastViewedAt: lastViewed,
      updates,
    };
  }

  /**
   * Marks all published changelogs as read by updating lastViewedChangelogDate to now.
   */
  static async markAllAsRead(
    userId: string
  ): Promise<{ readAt: Date; unreadCount: number }> {
    const now = new Date();
    const user = await User.findByIdAndUpdate(
      userId,
      { lastViewedChangelogDate: now },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return {
      readAt: now,
      unreadCount: 0,
    };
  }
}
