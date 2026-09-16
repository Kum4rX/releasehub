import { User } from '../models/user.model';

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  lastViewedChangelogDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileData {
  name?: string;
  [key: string]: unknown;
}

export class UserService {
  /**
   * Retrieves the safe profile of an authenticated user.
   */
  static async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastViewedChangelogDate: user.lastViewedChangelogDate || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Updates the safe profile fields of an authenticated user (name only).
   * Ensures email and role remain strictly read-only.
   */
  static async updateProfile(
    userId: string,
    data: UpdateProfileData
  ): Promise<UserProfileResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Only allow updating safe fields: name
    if (data.name !== undefined && typeof data.name === 'string') {
      user.name = data.name.trim();
    }

    // Note: email and role are strictly read-only and preserved
    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastViewedChangelogDate: user.lastViewedChangelogDate || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
