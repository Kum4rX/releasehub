process.env.NODE_ENV = 'test';

import http from 'http';
import { app } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/database';
import { User, Changelog, Reaction } from '../src/models';
import { AuthService } from '../src/services/auth.service';
import { Logger } from '../src/utils/logger';

let server: http.Server;
let baseUrl: string;
let adminToken: string;
let userToken: string;
let otherUserToken: string;
let adminUserId: string;
let normalUserId: string;
let otherUserId: string;

const runTests = async () => {
  Logger.info('====================================================');
  Logger.info('STARTING COMPREHENSIVE MILESTONE 3 CHANGELOG TESTS');
  Logger.info('====================================================');

  await connectDB();

  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not start test server');
  }
  baseUrl = `http://localhost:${address.port}/api/v1/changelog`;

  let testPassedCount = 0;
  const assert = (condition: boolean, testName: string) => {
    if (!condition) {
      Logger.error(`FAILED: ${testName}`);
      throw new Error(`Test assertion failed: ${testName}`);
    }
    testPassedCount++;
    Logger.info(`PASSED [${testPassedCount}/42]: ${testName}`);
  };

  try {
    // -------------------------------------------------------------
    // Setup Test Users
    // -------------------------------------------------------------
    await User.deleteMany({ email: /.*@changelog\.test/ });
    await Changelog.deleteMany({});
    await Reaction.deleteMany({});

    const adminUser = await User.create({
      name: 'Admin Tester',
      email: 'admin@changelog.test',
      passwordHash: await AuthService.hashPassword('AdminPass123!'),
      role: 'admin',
      isEmailVerified: true,
    });
    adminUserId = adminUser._id.toString();
    adminToken = AuthService.signAccessToken({
      userId: adminUserId,
      role: 'admin',
    });

    const normalUser = await User.create({
      name: 'Normal Tester',
      email: 'user@changelog.test',
      passwordHash: await AuthService.hashPassword('UserPass123!'),
      role: 'user',
      isEmailVerified: true,
    });
    normalUserId = normalUser._id.toString();
    userToken = AuthService.signAccessToken({
      userId: normalUserId,
      role: 'user',
    });

    const otherUser = await User.create({
      name: 'Other Tester',
      email: 'other@changelog.test',
      passwordHash: await AuthService.hashPassword('OtherPass123!'),
      role: 'user',
      isEmailVerified: true,
    });
    otherUserId = otherUser._id.toString();
    otherUserToken = AuthService.signAccessToken({
      userId: otherUserId,
      role: 'user',
    });

    let createdChangelogId = '';
    let createdChangelogSlug = '';

    // =============================================================
    // SECTION 1: ADMIN CRUD (Tests 1 - 9)
    // =============================================================

    // TEST 1: Admin can create draft
    const createRes = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Introducing Smart Search Engine',
        contentMarkdown: '# Smart Search\n\nFind all release notes instantly.',
        category: 'new',
        coverImage: 'https://example.com/cover1.jpg',
      }),
    });
    const createData = await createRes.json();
    assert(
      createRes.status === 201 &&
        createData.success === true &&
        createData.data.title === 'Introducing Smart Search Engine' &&
        createData.data.status === 'draft' &&
        createData.data.publishedAt === undefined &&
        createData.data.slug === 'introducing-smart-search-engine',
      '1. Admin can create draft'
    );
    createdChangelogId = createData.data._id;
    createdChangelogSlug = createData.data.slug;

    // TEST 2: Normal user cannot create changelog (403)
    const normalCreateRes = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Post',
        contentMarkdown: 'Should fail',
        category: 'new',
      }),
    });
    assert(normalCreateRes.status === 403, '2. Normal user cannot create changelog');

    // TEST 3: Unauthenticated user cannot create changelog (401)
    const unauthCreateRes = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthenticated Post',
        contentMarkdown: 'Should fail',
        category: 'new',
      }),
    });
    assert(unauthCreateRes.status === 401, '3. Unauthenticated user cannot create changelog');

    // TEST 4: Admin can list changelogs
    const adminListRes = await fetch(`${baseUrl}/admin?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    assert(
      adminListRes.status === 200 &&
        adminListData.success === true &&
        adminListData.data.items.length >= 1 &&
        adminListData.data.pagination.totalItems >= 1,
      '4. Admin can list changelogs'
    );

    // TEST 5: Admin can retrieve a changelog
    const adminGetRes = await fetch(`${baseUrl}/admin/${createdChangelogId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminGetData = await adminGetRes.json();
    assert(
      adminGetRes.status === 200 &&
        adminGetData.success === true &&
        adminGetData.data._id === createdChangelogId &&
        adminGetData.data.author?.name === 'Admin Tester',
      '5. Admin can retrieve a changelog'
    );

    // TEST 6: Admin can update a changelog
    const updateRes = await fetch(`${baseUrl}/${createdChangelogId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Introducing Ultra Smart Search Engine',
        category: 'improved',
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 &&
        updateData.success === true &&
        updateData.data.title === 'Introducing Ultra Smart Search Engine' &&
        updateData.data.category === 'improved' &&
        updateData.data.slug === 'introducing-ultra-smart-search-engine',
      '6. Admin can update a changelog and slug is updated safely'
    );
    createdChangelogSlug = updateData.data.slug;

    // TEST 7: Non-admin cannot update (403)
    const normalUpdateRes = await fetch(`${baseUrl}/${createdChangelogId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert(normalUpdateRes.status === 403, '7. Non-admin cannot update');

    // TEST 8: Non-admin cannot delete (403)
    const normalDeleteRes = await fetch(`${baseUrl}/${createdChangelogId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(normalDeleteRes.status === 403, '8. Non-admin cannot delete');

    // TEST 9: Admin can delete a changelog (tested on a disposable item)
    const disposable = await Changelog.create({
      title: 'Disposable Update',
      slug: 'disposable-update',
      contentMarkdown: 'To be deleted',
      category: 'fixed',
      author: adminUserId,
    });
    const deleteRes = await fetch(`${baseUrl}/${disposable._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteData = await deleteRes.json();
    const checkDeleted = await Changelog.findById(disposable._id);
    assert(
      deleteRes.status === 200 &&
        deleteData.success === true &&
        checkDeleted === null,
      '9. Admin can delete a changelog'
    );

    // =============================================================
    // SECTION 2: PUBLISHING & LIFECYCLE (Tests 10 - 13)
    // =============================================================

    // TEST 10: Admin can publish draft
    const publishRes = await fetch(`${baseUrl}/${createdChangelogId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const publishData = await publishRes.json();
    assert(
      publishRes.status === 200 &&
        publishData.success === true &&
        publishData.data.status === 'published' &&
        publishData.data.publishedAt !== undefined,
      '10. Admin can publish draft'
    );

    // TEST 11: Published changelog gets publishedAt timestamp
    assert(
      new Date(publishData.data.publishedAt).getTime() <= Date.now(),
      '11. Published changelog gets publishedAt timestamp'
    );

    // TEST 12: Admin can unpublish
    const unpublishRes = await fetch(`${baseUrl}/${createdChangelogId}/unpublish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const unpublishData = await unpublishRes.json();
    assert(
      unpublishRes.status === 200 &&
        unpublishData.success === true &&
        unpublishData.data.status === 'draft' &&
        unpublishData.data.publishedAt === undefined,
      '12. Admin can unpublish'
    );

    // TEST 13: Unpublished changelog disappears from public API
    const publicAfterUnpublishRes = await fetch(`${baseUrl}/${createdChangelogSlug}`);
    assert(
      publicAfterUnpublishRes.status === 404,
      '13. Unpublished changelog disappears from public API (404)'
    );

    // Re-publish the main test changelog for subsequent public and reaction tests
    await fetch(`${baseUrl}/${createdChangelogId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Seed additional published and draft items for query/filter testing
    await Changelog.create([
      {
        title: 'Performance Boost 2.0',
        slug: 'performance-boost-2',
        contentMarkdown: 'Speed improvements and caching optimizations.',
        category: 'improved',
        status: 'published',
        publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
        author: adminUserId,
      },
      {
        title: 'Fixed Dark Mode Flicker',
        slug: 'fixed-dark-mode-flicker',
        contentMarkdown: 'Eliminated flickering on theme toggle.',
        category: 'fixed',
        status: 'published',
        publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
        author: adminUserId,
      },
      {
        title: 'Unpublished Secret Feature',
        slug: 'unpublished-secret-feature',
        contentMarkdown: 'Top secret update not ready yet.',
        category: 'new',
        status: 'draft',
        author: adminUserId,
      },
    ]);

    // =============================================================
    // SECTION 3: PUBLIC TIMELINE & FILTERS (Tests 14 - 21)
    // =============================================================

    // TEST 14: Public endpoint returns published updates
    const publicTimelineRes = await fetch(`${baseUrl}`);
    const publicTimelineData = await publicTimelineRes.json();
    assert(
      publicTimelineRes.status === 200 &&
        publicTimelineData.success === true &&
        publicTimelineData.data.items.length >= 3,
      '14. Public endpoint returns published updates'
    );

    // TEST 15: Public endpoint excludes drafts
    const containsDraft = publicTimelineData.data.items.some(
      (item: { status: string }) => item.status === 'draft'
    );
    assert(
      containsDraft === false,
      '15. Public endpoint excludes drafts'
    );

    // TEST 16: Reverse chronological ordering
    const items = publicTimelineData.data.items;
    const isReverseChronological = new Date(items[0].publishedAt).getTime() >=
      new Date(items[1].publishedAt).getTime();
    assert(
      isReverseChronological,
      '16. Reverse chronological ordering by publishedAt'
    );

    // TEST 17: Category filtering
    const filterRes = await fetch(`${baseUrl}?category=fixed`);
    const filterData = await filterRes.json();
    const allFixed = filterData.data.items.every(
      (item: { category: string }) => item.category === 'fixed'
    );
    assert(
      filterRes.status === 200 && filterData.data.items.length >= 1 && allFixed,
      '17. Category filtering works'
    );

    // TEST 18: Invalid category rejected (400)
    const invalidCatRes = await fetch(`${baseUrl}?category=invalid-cat`);
    assert(
      invalidCatRes.status === 400,
      '18. Invalid category rejected with 400'
    );

    // TEST 19: Keyword search across title and contentMarkdown
    const searchRes = await fetch(`${baseUrl}?search=flickering`);
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 &&
        searchData.data.items.length === 1 &&
        searchData.data.items[0].slug === 'fixed-dark-mode-flicker',
      '19. Keyword search across contentMarkdown matches correctly'
    );

    // TEST 20: Pagination
    const pageRes = await fetch(`${baseUrl}?page=1&limit=2`);
    const pageData = await pageRes.json();
    assert(
      pageRes.status === 200 &&
        pageData.data.items.length === 2 &&
        pageData.data.pagination.page === 1 &&
        pageData.data.pagination.limit === 2 &&
        pageData.data.pagination.hasNextPage === true,
      '20. Pagination metadata works correctly'
    );

    // TEST 21: Maximum page limit enforced (clamped to MAX_LIMIT 50)
    const maxLimitRes = await fetch(`${baseUrl}?limit=1000`);
    const maxLimitData = await maxLimitRes.json();
    assert(
      maxLimitRes.status === 200 &&
        maxLimitData.data.pagination.limit <= 50,
      '21. Maximum page limit enforced'
    );

    // =============================================================
    // SECTION 4: PUBLIC DETAIL (Tests 22 - 24)
    // =============================================================

    // TEST 22: Published slug returns detail
    const detailRes = await fetch(`${baseUrl}/${createdChangelogSlug}`);
    const detailData = await detailRes.json();
    assert(
      detailRes.status === 200 &&
        detailData.success === true &&
        detailData.data.slug === createdChangelogSlug &&
        detailData.data.reactions !== undefined,
      '22. Published slug returns detail'
    );

    // TEST 23: Draft slug returns 404
    const draftDetailRes = await fetch(`${baseUrl}/unpublished-secret-feature`);
    assert(
      draftDetailRes.status === 404,
      '23. Draft slug returns 404 on public detail endpoint'
    );

    // TEST 24: Unknown slug returns 404
    const unknownDetailRes = await fetch(`${baseUrl}/completely-unknown-slug-xyz`);
    assert(
      unknownDetailRes.status === 404,
      '24. Unknown slug returns 404'
    );

    // =============================================================
    // SECTION 5: PUBLIC FEED (Tests 25 - 26)
    // =============================================================

    // TEST 25: Public JSON feed returns published updates
    const feedRes = await fetch(`${baseUrl}/feed`);
    const feedData = await feedRes.json();
    assert(
      feedRes.status === 200 &&
        feedData.success === true &&
        Array.isArray(feedData.data.items) &&
        feedData.data.items.length >= 3,
      '25. Public JSON feed returns published updates'
    );

    // TEST 26: Feed excludes drafts
    const feedHasDraft = feedData.data.items.some(
      (item: { status: string }) => item.status === 'draft'
    );
    assert(
      feedHasDraft === false,
      '26. Public JSON feed excludes drafts'
    );

    // =============================================================
    // SECTION 6: RELATED UPDATES (Tests 27 - 28)
    // =============================================================

    // TEST 27: Related updates return published related content
    const relatedRes = await fetch(`${baseUrl}/${createdChangelogSlug}/related`);
    const relatedData = await relatedRes.json();
    assert(
      relatedRes.status === 200 &&
        relatedData.success === true &&
        Array.isArray(relatedData.data.items) &&
        relatedData.data.items.length >= 1 &&
        relatedData.data.items[0].category === 'improved',
      '27. Related updates return matching category items'
    );

    // TEST 28: Current update excluded from related list
    const containsSelf = relatedData.data.items.some(
      (item: { slug: string }) => item.slug === createdChangelogSlug
    );
    assert(
      containsSelf === false,
      '28. Current update is excluded from related list'
    );

    // =============================================================
    // SECTION 7: REACTIONS ENGINE (Tests 29 - 38)
    // =============================================================

    // TEST 29: Authenticated user can add heart
    const heartRes = await fetch(`${baseUrl}/${createdChangelogId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ type: 'heart' }),
    });
    const heartData = await heartRes.json();
    assert(
      heartRes.status === 200 &&
        heartData.success === true &&
        heartData.data.reactions.heart === 1 &&
        heartData.data.userReactions.heart === true,
      '29. Authenticated user can add heart reaction'
    );

    // TEST 30: Authenticated user can add celebrate
    const celebrateRes = await fetch(`${baseUrl}/${createdChangelogId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ type: 'celebrate' }),
    });
    const celebrateData = await celebrateRes.json();
    assert(
      celebrateRes.status === 200 &&
        celebrateData.data.reactions.celebrate === 1 &&
        celebrateData.data.userReactions.celebrate === true,
      '30. Authenticated user can add celebrate reaction'
    );

    // TEST 31: Authenticated user can add rocket
    const rocketRes = await fetch(`${baseUrl}/${createdChangelogId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ type: 'rocket' }),
    });
    const rocketData = await rocketRes.json();
    assert(
      rocketRes.status === 200 &&
        rocketData.data.reactions.rocket === 1 &&
        rocketData.data.userReactions.rocket === true,
      '31. Authenticated user can add rocket reaction'
    );

    // TEST 32: Duplicate same reaction is prevented
    const dupReactionRes = await fetch(`${baseUrl}/${createdChangelogId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ type: 'heart' }),
    });
    const dupReactionData = await dupReactionRes.json();
    assert(
      dupReactionRes.status === 200 &&
        dupReactionData.data.reactions.heart === 1,
      '32. Duplicate same reaction does not duplicate count'
    );

    // TEST 33: Different reaction types can coexist
    assert(
      dupReactionData.data.reactions.heart === 1 &&
        dupReactionData.data.reactions.celebrate === 1 &&
        dupReactionData.data.reactions.rocket === 1,
      '33. Different reaction types coexist for the same user'
    );

    // TEST 34: User can delete own reaction
    const delReactionRes = await fetch(
      `${baseUrl}/${createdChangelogId}/reactions/heart`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );
    const delReactionData = await delReactionRes.json();
    assert(
      delReactionRes.status === 200 &&
        delReactionData.data.reactions.heart === 0 &&
        delReactionData.data.userReactions.heart === false,
      '34. User can delete own reaction'
    );

    // TEST 35: User cannot delete another user's reaction
    // Other user adds celebrate
    await fetch(`${baseUrl}/${createdChangelogId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherUserToken}`,
      },
      body: JSON.stringify({ type: 'celebrate' }),
    });
    // First user deletes celebrate -> only deletes user's own, other user's remains
    await fetch(`${baseUrl}/${createdChangelogId}/reactions/celebrate`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const countsAfterOtherCheck = await fetch(
      `${baseUrl}/${createdChangelogSlug}`
    );
    const countsData = await countsAfterOtherCheck.json();
    assert(
      countsData.data.reactions.celebrate === 1,
      '35. Deleting own reaction preserves another user reaction'
    );

    // TEST 36: Reaction counts are correct
    assert(
      countsData.data.reactions.celebrate === 1 &&
        countsData.data.reactions.rocket === 1 &&
        countsData.data.reactions.heart === 0,
      '36. Reaction counts are aggregate and accurate'
    );

    // TEST 37: Unauthenticated user cannot react (401)
    const unauthReactRes = await fetch(`${baseUrl}/${createdChangelogId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'heart' }),
    });
    assert(
      unauthReactRes.status === 401,
      '37. Unauthenticated user cannot react'
    );

    // TEST 38: Reaction on unpublished changelog is rejected
    const draftChangelog = await Changelog.findOne({ status: 'draft' });
    const reactOnDraftRes = await fetch(
      `${baseUrl}/${draftChangelog!._id}/reactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ type: 'heart' }),
      }
    );
    assert(
      reactOnDraftRes.status === 400,
      '38. Reaction on unpublished changelog is rejected with 400'
    );

    // =============================================================
    // SECTION 8: DATABASE & EDGE CASES (Tests 39 - 42)
    // =============================================================

    // TEST 39: Duplicate slug handled with incrementing suffix
    const dupTitle1 = await Changelog.create({
      title: 'Collision Title Test',
      slug: 'collision-title-test',
      contentMarkdown: 'First collision',
      category: 'new',
      author: adminUserId,
    });
    const dupTitle2 = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Collision Title Test',
        contentMarkdown: 'Second collision',
        category: 'new',
      }),
    });
    const dupTitleData = await dupTitle2.json();
    assert(
      dupTitle2.status === 201 &&
        dupTitleData.data.slug === 'collision-title-test-1',
      '39. Duplicate slug automatically receives incrementing suffix'
    );

    // TEST 40: Invalid ObjectId handled (400)
    const invalidIdRes = await fetch(`${baseUrl}/admin/invalid-not-an-objectid`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      invalidIdRes.status === 400,
      '40. Invalid ObjectId format rejected with 400'
    );

    // TEST 41: Missing changelog handled (404)
    const missingId = '507f1f77bcf86cd799439011';
    const missingRes = await fetch(`${baseUrl}/admin/${missingId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      missingRes.status === 404,
      '41. Non-existent changelog ID returns 404'
    );

    // TEST 42: Pagination edge cases handled (page beyond total, negative page)
    const edgePageRes = await fetch(`${baseUrl}?page=9999&limit=10`);
    const edgePageData = await edgePageRes.json();
    assert(
      edgePageRes.status === 200 &&
        edgePageData.data.items.length === 0 &&
        edgePageData.data.pagination.hasNextPage === false,
      '42. Out-of-bounds pagination returns clean empty set and valid metadata'
    );

    Logger.info('====================================================');
    Logger.info('ALL 42 MILESTONE 3 CHANGELOG TESTS PASSED CLEANLY!');
    Logger.info('====================================================');
  } catch (error) {
    Logger.error('Changelog test suite failed:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await disconnectDB();
  }
};

runTests();
