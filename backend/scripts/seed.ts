import { connectDB, disconnectDB } from '../src/config/database';
import { User, Changelog, Reaction, PasswordResetToken } from '../src/models';
import { Logger } from '../src/utils/logger';

const seedDatabase = async (): Promise<void> => {
  try {
    Logger.info('--- Starting ReleaseHub Database Initialization & Seed Foundation ---');

    await connectDB();

    Logger.info('Synchronizing indexes for models...');
    await User.syncIndexes();
    await Changelog.syncIndexes();
    await Reaction.syncIndexes();
    await PasswordResetToken.syncIndexes();
    Logger.info('Indexes synchronized successfully:');

    const userIndexes = await User.collection.indexes();
    const changelogIndexes = await Changelog.collection.indexes();
    const reactionIndexes = await Reaction.collection.indexes();
    const passwordResetIndexes = await PasswordResetToken.collection.indexes();

    Logger.info(`- User indexes: ${userIndexes.map((i) => i.name).join(', ')}`);
    Logger.info(`- Changelog indexes: ${changelogIndexes.map((i) => i.name).join(', ')}`);
    Logger.info(`- Reaction indexes: ${reactionIndexes.map((i) => i.name).join(', ')}`);
    Logger.info(`- PasswordResetToken indexes: ${passwordResetIndexes.map((i) => i.name).join(', ')}`);

    // Verify compound unique index on Reaction
    const reactionCompound = reactionIndexes.find(
      (idx) => idx.name === 'user_1_changelog_1_type_1'
    );
    if (reactionCompound && reactionCompound.unique) {
      Logger.info('Verified: Reaction compound unique index [user + changelog + type] is enforced.');
    }

    // Verify TTL index on PasswordResetToken
    const ttlIndex = passwordResetIndexes.find(
      (idx) => idx.expireAfterSeconds !== undefined
    );
    if (ttlIndex) {
      Logger.info(`Verified: PasswordResetToken TTL index on expiresAt is enforced (expireAfterSeconds: ${ttlIndex.expireAfterSeconds}).`);
    }

    Logger.info('Database seed foundation completed successfully!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    Logger.error(`Database seeding failed: ${message}`);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

seedDatabase();
