process.env.NODE_ENV = 'test';

import http from 'http';
import { app } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/database';
import { User, Changelog, Reaction } from '../src/models';
import { AuthService } from '../src/services/auth.service';
import { Logger } from '../src/utils/logger';

let server: http.Server;
let apiBaseUrl: string;
let adminToken: string;
let userToken: string;
let adminUserId: string;
let normalUserId: string;

const runTests = async () => {
  Logger.info('====================================================');
  Logger.info('STARTING COMPREHENSIVE MILESTONE 4 TESTS');
  Logger.info('====================================================');

  await connectDB();

  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not start test server');
  }
  apiBaseUrl = `http://localhost:${address.port}/api/v1`;

  let testPassedCount = 0;
  const TOTAL_TESTS = 26;

  const assert = (condition: boolean, testName: string) => {
    if (!condition) {
      Logger.error(`FAILED: ${testName}`);
      throw new Error(`Test assertion failed: ${testName}`);
    }
    testPassedCount++;
    Logger.info(`PASSED [${testPassedCount}/${TOTAL_TESTS}]: ${testName}`);
  };

  try {
    // -------------------------------------------------------------
    // Setup Test Users & Data
    // -------------------------------------------------------------
    await User.deleteMany({ email: /.*@m4test\.test/ });
    await Changelog.deleteMany({ title: /.*\[M4\].*/ });
    await Reaction.deleteMany({});

    // Admin user
    const adminUser = await User.create({
      name: 'Admin M4',
      email: 'admin@m4test.test',
      passwordHash: await AuthService.hashPassword('AdminPass123!'),
      role: 'admin',
      isEmailVerified: true,
    });
    adminUserId = adminUser._id.toString();
    adminToken = AuthService.signAccessToken({
      userId: adminUserId,
      role: 'admin',
    });

    // Normal user
    const normalUser = await User.create({
      name: 'Regular User M4',
      email: 'user@m4test.test',
      passwordHash: await AuthService.hashPassword('UserPass123!'),
      role: 'user',
      isEmailVerified: true,
      lastViewedChangelogDate: null,
    });
    normalUserId = normalUser._id.toString();
    userToken = AuthService.signAccessToken({
      userId: normalUserId,
      role: 'user',
    });

    // Create sample changelogs: 2 published, 1 draft
    const changelogPublished1 = await Changelog.create({
      title: 'Published Feature 1 [M4]',
      slug: 'published-feature-1-m4',
      contentMarkdown: '# Published 1 markdown content',
      category: 'new',
      status: 'published',
      publishedAt: new Date(Date.now() - 60000), // 1 minute ago
      author: adminUserId,
    });

    const changelogPublished2 = await Changelog.create({
      title: 'Published Feature 2 [M4]',
      slug: 'published-feature-2-m4',
      contentMarkdown: '# Published 2 markdown content',
      category: 'improved',
      status: 'published',
      publishedAt: new Date(Date.now() - 30000), // 30 seconds ago
      author: adminUserId,
    });

    const changelogDraft = await Changelog.create({
      title: 'Draft Feature [M4]',
      slug: 'draft-feature-m4',
      contentMarkdown: '# Draft markdown content',
      category: 'fixed',
      status: 'draft',
      author: adminUserId,
    });

    // Add reactions to published 1
    await Reaction.create({
      user: adminUserId,
      changelog: changelogPublished1._id,
      type: 'heart',
    });
    await Reaction.create({
      user: normalUserId,
      changelog: changelogPublished1._id,
      type: 'rocket',
    });

    // -------------------------------------------------------------
    // PART 1: NOTIFICATIONS / WHAT'S NEW TESTS
    // -------------------------------------------------------------

    // 1. Authenticated user can retrieve What's New
    const resNotifAuth = await fetch(`${apiBaseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const dataNotifAuth = await resNotifAuth.json();
    assert(
      resNotifAuth.status === 200 &&
        dataNotifAuth.success === true &&
        Array.isArray(dataNotifAuth.data.updates),
      '1. Authenticated user can retrieve What\'s New'
    );

    // 2. Unauthenticated user receives 401
    const resNotifUnauth = await fetch(`${apiBaseUrl}/notifications`);
    assert(
      resNotifUnauth.status === 401,
      '2. Unauthenticated user receives 401'
    );

    // 3. Published updates appear
    const updatesTitles = dataNotifAuth.data.updates.map(
      (u: { title: string }) => u.title
    );
    assert(
      updatesTitles.includes(changelogPublished1.title) &&
        updatesTitles.includes(changelogPublished2.title),
      '3. Published updates appear'
    );

    // 4. Draft updates do not appear
    assert(
      !updatesTitles.includes(changelogDraft.title),
      '4. Draft updates do not appear'
    );

    // 5. Unread count is correct for initial state
    assert(
      dataNotifAuth.data.unreadCount >= 2,
      '5. Unread count is correct'
    );

    // 6. lastViewedChangelogDate controls unread state (initially all updates are unread)
    const allUnread = dataNotifAuth.data.updates.every(
      (u: { isUnread: boolean }) => u.isUnread === true
    );
    assert(
      allUnread,
      '6. lastViewedChangelogDate controls unread state'
    );

    // 7. Mark-all-as-read works
    const resMarkRead = await fetch(`${apiBaseUrl}/notifications/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const dataMarkRead = await resMarkRead.json();
    assert(
      resMarkRead.status === 200 &&
        dataMarkRead.success === true &&
        dataMarkRead.data.unreadCount === 0 &&
        Boolean(dataMarkRead.data.readAt),
      '7. Mark-all-as-read works'
    );

    // 8. After marking read, unread count becomes zero and items are read
    const resNotifAfterRead = await fetch(`${apiBaseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const dataNotifAfterRead = await resNotifAfterRead.json();
    const allNowRead = dataNotifAfterRead.data.updates.every(
      (u: { isUnread: boolean }) => u.isUnread === false
    );
    assert(
      dataNotifAfterRead.data.unreadCount === 0 && allNowRead,
      '8. After marking read, unread count becomes zero'
    );

    // 9. Newly published update becomes unread again
    const changelogNew = await Changelog.create({
      title: 'Brand New Published Feature [M4]',
      slug: 'brand-new-published-feature-m4',
      contentMarkdown: '# Brand new feature content',
      category: 'new',
      status: 'published',
      publishedAt: new Date(Date.now() + 5000), // In the future / newer than readAt
      author: adminUserId,
    });

    const resNotifNew = await fetch(`${apiBaseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const dataNotifNew = await resNotifNew.json();
    const newUpdateItem = dataNotifNew.data.updates.find(
      (u: { id: string }) => u.id === changelogNew._id.toString()
    );
    assert(
      dataNotifNew.data.unreadCount >= 1 &&
        newUpdateItem &&
        newUpdateItem.isUnread === true,
      '9. Newly published update becomes unread again'
    );

    // -------------------------------------------------------------
    // PART 2: USER PROFILE / SETTINGS TESTS
    // -------------------------------------------------------------

    // 10. Authenticated user can get profile
    const resProfile = await fetch(`${apiBaseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const dataProfile = await resProfile.json();
    assert(
      resProfile.status === 200 &&
        dataProfile.success === true &&
        dataProfile.data.profile.email === 'user@m4test.test' &&
        dataProfile.data.profile.role === 'user',
      '10. Authenticated user can get profile'
    );

    // 11. Unauthenticated user receives 401
    const resProfileUnauth = await fetch(`${apiBaseUrl}/users/me`);
    assert(
      resProfileUnauth.status === 401,
      '11. Unauthenticated user receives 401'
    );

    // 12. Sensitive fields are not exposed
    const profileObj = dataProfile.data.profile;
    assert(
      profileObj.passwordHash === undefined &&
        profileObj.refreshTokenHash === undefined &&
        profileObj.emailVerificationToken === undefined &&
        profileObj.emailVerificationExpires === undefined,
      '12. Sensitive fields are not exposed'
    );

    // 13. User can update name
    const resUpdateName = await fetch(`${apiBaseUrl}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ name: 'Updated Full Name' }),
    });
    const dataUpdateName = await resUpdateName.json();
    assert(
      resUpdateName.status === 200 &&
        dataUpdateName.success === true &&
        dataUpdateName.data.profile.name === 'Updated Full Name',
      '13. User can update name'
    );

    // 14. Invalid profile input is rejected (e.g. empty name)
    const resInvalidName = await fetch(`${apiBaseUrl}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ name: ' ' }),
    });
    assert(
      resInvalidName.status === 400,
      '14. Invalid profile input is rejected'
    );

    // 15. User cannot change role through profile update
    const resChangeRole = await fetch(`${apiBaseUrl}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ name: 'Hacker Name', role: 'admin' }),
    });
    const dataChangeRole = await resChangeRole.json();
    assert(
      resChangeRole.status === 200 &&
        dataChangeRole.data.profile.role === 'user',
      '15. User cannot change role through profile update'
    );

    // 16. Email remains read-only if no email-change flow exists
    const resChangeEmail = await fetch(`${apiBaseUrl}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: 'Honest User',
        email: 'attacker@evil.com',
      }),
    });
    const dataChangeEmail = await resChangeEmail.json();
    assert(
      resChangeEmail.status === 200 &&
        dataChangeEmail.data.profile.email === 'user@m4test.test',
      '16. Email remains read-only if no email-change flow exists'
    );

    // -------------------------------------------------------------
    // PART 3: ADMIN INSIGHTS TESTS
    // -------------------------------------------------------------

    // 17. Admin can retrieve insights
    const resAdminInsights = await fetch(`${apiBaseUrl}/admin/insights`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAdminInsights = await resAdminInsights.json();
    assert(
      resAdminInsights.status === 200 &&
        dataAdminInsights.success === true &&
        Boolean(dataAdminInsights.data.changelogs) &&
        Boolean(dataAdminInsights.data.reactions) &&
        Boolean(dataAdminInsights.data.users),
      '17. Admin can retrieve insights'
    );

    // 18. Normal user receives 403
    const resUserInsights = await fetch(`${apiBaseUrl}/admin/insights`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      resUserInsights.status === 403,
      '18. Normal user receives 403'
    );

    // 19. Unauthenticated user receives 401
    const resUnauthInsights = await fetch(`${apiBaseUrl}/admin/insights`);
    assert(
      resUnauthInsights.status === 401,
      '19. Unauthenticated user receives 401'
    );

    // 20. Changelog counts are correct
    const expectedTotal = await Changelog.countDocuments();
    assert(
      dataAdminInsights.data.changelogs.total === expectedTotal,
      '20. Changelog counts are correct'
    );

    // 21. Draft/published counts are correct
    const expectedPublished = await Changelog.countDocuments({
      status: 'published',
    });
    const expectedDraft = await Changelog.countDocuments({ status: 'draft' });
    assert(
      dataAdminInsights.data.changelogs.published === expectedPublished &&
        dataAdminInsights.data.changelogs.draft === expectedDraft,
      '21. Draft/published counts are correct'
    );

    // 22. Reaction totals are correct
    const expectedReactions = await Reaction.countDocuments();
    assert(
      dataAdminInsights.data.reactions.total === expectedReactions,
      '22. Reaction totals are correct'
    );

    // 23. Reaction type aggregation is correct
    const expectedHearts = await Reaction.countDocuments({ type: 'heart' });
    const expectedRockets = await Reaction.countDocuments({ type: 'rocket' });
    assert(
      dataAdminInsights.data.reactions.byType.heart === expectedHearts &&
        dataAdminInsights.data.reactions.byType.rocket === expectedRockets,
      '23. Reaction type aggregation is correct'
    );

    // 24. User counts are correct
    const expectedUsers = await User.countDocuments();
    const expectedVerified = await User.countDocuments({
      isEmailVerified: true,
    });
    assert(
      dataAdminInsights.data.users.total === expectedUsers &&
        dataAdminInsights.data.users.verified === expectedVerified,
      '24. User counts are correct'
    );

    // 25. POST /notifications/read unauthenticated returns 401
    const resMarkReadUnauth = await fetch(`${apiBaseUrl}/notifications/read`, {
      method: 'POST',
    });
    assert(
      resMarkReadUnauth.status === 401,
      '25. Unauthenticated user cannot mark notifications as read'
    );

    // 26. Extremely long name (> 100 chars) is rejected with 400
    const resTooLongName = await fetch(`${apiBaseUrl}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ name: 'A'.repeat(101) }),
    });
    assert(
      resTooLongName.status === 400,
      '26. Profile name exceeding 100 characters is rejected with 400'
    );

    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    await User.deleteMany({ email: /.*@m4test\.test/ });
    await Changelog.deleteMany({ title: /.*\[M4\].*/ });
    await Reaction.deleteMany({});

    Logger.info('====================================================');
    Logger.info(`ALL ${testPassedCount} MILESTONE 4 TESTS PASSED CLEANLY!`);
    Logger.info('====================================================');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await disconnectDB();
  }
};

runTests().catch((err) => {
  Logger.error(`Milestone 4 test suite failed with error: ${err.message}`);
  process.exit(1);
});
