import JSZip from 'jszip';

// === Type Definitions ===

interface StringListItem {
  href?: string;
  value: string;
  timestamp: number;
}

interface MediaMapItem {
  uri: string;
  creation_timestamp: number;
  media_metadata?: {
    photo_metadata?: {
      exif_data?: any[];
    };
    video_metadata?: any;
  };
  title?: string;
}

interface InstagramLike {
  title: string;
  string_list_data?: StringListItem[];
}

interface InstagramFollowing {
  title: string;
  string_list_data?: StringListItem[];
}

interface InstagramSearchItem {
  title?: string;
  string_list_data?: StringListItem[];
}

interface SavedItem {
  title: string;
  string_list_data?: StringListItem[];
}

interface InstagramPost {
  media?: MediaMapItem[];
  title?: string;
  creation_timestamp?: number;
}

interface InstagramReel {
  media?: MediaMapItem[];
  title?: string;
  creation_timestamp?: number;
}

interface InstagramComment {
  title?: string;
  string_list_data?: StringListItem[];
  media_list_data?: MediaMapItem[];
}

interface InstagramStory {
  title?: string;
  creation_timestamp?: number;
  uri?: string;
}

interface TopicInterest {
  string_map_data?: {
    Name?: { value: string };
    Value?: { value: string };
  };
  value?: string;
}

interface AdInterest {
  string_map_data?: {
    Name?: { value: string };
    Value?: { value: string };
  };
  value?: string;
}

interface ParsedInstagramData {
  // Likes & Engagement
  likedPosts: InstagramLike[];
  likedComments: InstagramLike[];
  likedReels: InstagramLike[];

  // Following/Followers
  following: InstagramFollowing[];
  followers: InstagramFollowing[];
  closeFriends: InstagramFollowing[];
  recentlyUnfollowed: InstagramFollowing[];

  // Searches
  wordSearches: InstagramSearchItem[];
  accountSearches: InstagramSearchItem[];
  tagSearches: InstagramSearchItem[];
  locationSearches: InstagramSearchItem[];
  profileSearches: InstagramSearchItem[];

  // Saved Content
  savedPosts: SavedItem[];
  savedCollections: SavedItem[];

  // User's Own Content
  posts: InstagramPost[];
  reels: InstagramReel[];
  stories: InstagramStory[];
  comments: InstagramComment[];

  // Interests & Topics
  topicInterests: TopicInterest[];
  adInterests: AdInterest[];
  adCategories: any[]; // other_categories_used_to_reach_you.json
  adsViewed: any[];
  adsClicked: any[];

  // Viewing Activity (IMPORTANT for interests)
  postsViewed: any[];
  videosWatched: any[];
  postsNotInterested: any[];

  // Link History
  linkHistory: any[];

  // Messages (limited - just contacts/interaction counts)
  messageContacts: string[];
}

// === Helper Functions ===

async function tryParseJsonFile<T>(zip: JSZip, paths: string[]): Promise<T | null> {
  for (const path of paths) {
    const file = zip.file(path);
    if (file) {
      try {
        const content = await file.async('string');
        return JSON.parse(content);
      } catch (e) {
        console.log(`Failed to parse ${path}:`, e);
      }
    }
  }
  return null;
}

async function tryParseMultipleJsonFiles<T>(zip: JSZip, pathPattern: RegExp): Promise<T[]> {
  const results: T[] = [];
  const files = Object.keys(zip.files).filter(name => pathPattern.test(name));

  for (const path of files) {
    const file = zip.file(path);
    if (file) {
      try {
        const content = await file.async('string');
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          results.push(...data);
        } else {
          results.push(data);
        }
      } catch (e) {
        console.log(`Failed to parse ${path}:`, e);
      }
    }
  }
  return results;
}

// === Main Parser ===

export async function parseInstagramZip(zip: JSZip): Promise<ParsedInstagramData> {
  const data: ParsedInstagramData = {
    likedPosts: [],
    likedComments: [],
    likedReels: [],
    following: [],
    followers: [],
    closeFriends: [],
    recentlyUnfollowed: [],
    wordSearches: [],
    accountSearches: [],
    tagSearches: [],
    locationSearches: [],
    profileSearches: [],
    savedPosts: [],
    savedCollections: [],
    posts: [],
    reels: [],
    stories: [],
    comments: [],
    topicInterests: [],
    adInterests: [],
    adCategories: [],
    adsViewed: [],
    adsClicked: [],
    postsViewed: [],
    videosWatched: [],
    postsNotInterested: [],
    linkHistory: [],
    messageContacts: [],
  };

  console.log('📂 Starting Instagram ZIP parse...');

  // Log all files that match key patterns to help debug
  const allFiles = Object.keys(zip.files);
  console.log('📂 Total files in ZIP:', allFiles.length);

  // Find files related to interests/topics
  const interestFiles = allFiles.filter(f =>
    f.includes('topic') || f.includes('interest') || f.includes('preferences') || f.includes('ads_and_topics')
  );
  console.log('📂 Interest-related files found:', interestFiles.join(', ') || 'NONE');

  // Find files in ads_information
  const adsFiles = allFiles.filter(f => f.includes('ads_information'));
  console.log('📂 ads_information files:', adsFiles.join(', ') || 'NONE');

  console.log('📂 First 30 files:', allFiles.slice(0, 30).join(', '), '...');

  try {
    // === LIKES & ENGAGEMENT ===

    // Liked Posts
    const likedPostsData = await tryParseJsonFile<any>(zip, [
      'your_instagram_activity/likes/liked_posts.json',
      'likes/liked_posts.json',
    ]);
    if (likedPostsData) {
      data.likedPosts = likedPostsData.likes_media_likes || likedPostsData || [];
      console.log(`📸 Parsed ${data.likedPosts.length} liked posts`);
    }

    // Liked Comments
    const likedCommentsData = await tryParseJsonFile<any>(zip, [
      'your_instagram_activity/likes/liked_comments.json',
      'likes/liked_comments.json',
    ]);
    if (likedCommentsData) {
      data.likedComments = likedCommentsData.likes_comment_likes || likedCommentsData || [];
      console.log(`💬 Parsed ${data.likedComments.length} liked comments`);
    }

    // Liked Reels (if exists separately)
    const likedReelsData = await tryParseJsonFile<any>(zip, [
      'your_instagram_activity/likes/liked_reels.json',
      'likes/liked_reels.json',
    ]);
    if (likedReelsData) {
      data.likedReels = likedReelsData.likes_media_likes || likedReelsData || [];
      console.log(`🎬 Parsed ${data.likedReels.length} liked reels`);
    }

    // === FOLLOWING/FOLLOWERS ===

    // Following
    const followingData = await tryParseJsonFile<any>(zip, [
      'followers_and_following/following.json',
      'connections/followers_and_following/following.json',
    ]);
    if (followingData) {
      data.following = followingData.relationships_following || followingData || [];
      console.log(`👥 Parsed ${data.following.length} following`);
    }

    // Followers (multiple files possible)
    const followersFiles = Object.keys(zip.files).filter(f =>
      f.includes('followers_and_following/followers') || f.includes('connections/followers')
    );
    for (const path of followersFiles) {
      const file = zip.file(path);
      if (file) {
        try {
          const content = await file.async('string');
          const followersData = JSON.parse(content);
          const followers = followersData.relationships_followers || followersData || [];
          if (Array.isArray(followers)) {
            data.followers.push(...followers);
          }
        } catch (e) { /* ignore */ }
      }
    }
    console.log(`👤 Parsed ${data.followers.length} followers`);

    // Close Friends
    const closeFriendsData = await tryParseJsonFile<any>(zip, [
      'followers_and_following/close_friends.json',
      'connections/close_friends.json',
    ]);
    if (closeFriendsData) {
      data.closeFriends = closeFriendsData.relationships_close_friends || closeFriendsData || [];
      console.log(`💚 Parsed ${data.closeFriends.length} close friends`);
    }

    // Recently Unfollowed
    const unfollowedData = await tryParseJsonFile<any>(zip, [
      'followers_and_following/recently_unfollowed_profiles.json',
      'connections/recently_unfollowed_profiles.json',
    ]);
    if (unfollowedData) {
      data.recentlyUnfollowed = unfollowedData.relationships_unfollowed_users || unfollowedData || [];
      console.log(`👋 Parsed ${data.recentlyUnfollowed.length} recently unfollowed`);
    }

    // === SEARCHES ===

    // Word/Phrase Searches
    const wordSearchesData = await tryParseJsonFile<any>(zip, [
      'logged_information/recent_searches/word_or_phrase_searches.json',
      'recent_searches/word_or_phrase_searches.json',
      'your_instagram_activity/recent_searches/word_or_phrase_searches.json',
    ]);
    if (wordSearchesData) {
      data.wordSearches = wordSearchesData.searches_keyword || wordSearchesData.word_or_phrase_searches || wordSearchesData || [];
      console.log(`🔍 Parsed ${data.wordSearches.length} word searches`);
    }

    // Account Searches
    const accountSearchesData = await tryParseJsonFile<any>(zip, [
      'logged_information/recent_searches/account_searches.json',
      'recent_searches/account_searches.json',
      'your_instagram_activity/recent_searches/account_searches.json',
    ]);
    if (accountSearchesData) {
      data.accountSearches = accountSearchesData.searches_user || accountSearchesData.account_searches || accountSearchesData || [];
      console.log(`👤🔍 Parsed ${data.accountSearches.length} account searches`);
    }

    // Tag Searches
    const tagSearchesData = await tryParseJsonFile<any>(zip, [
      'logged_information/recent_searches/tag_searches.json',
      'recent_searches/tag_searches.json',
      'your_instagram_activity/recent_searches/tag_searches.json',
    ]);
    if (tagSearchesData) {
      data.tagSearches = tagSearchesData.searches_hashtag || tagSearchesData.tag_searches || tagSearchesData || [];
      console.log(`#️⃣ Parsed ${data.tagSearches.length} tag searches`);
    }

    // Location Searches
    const locationSearchesData = await tryParseJsonFile<any>(zip, [
      'logged_information/recent_searches/location_searches.json',
      'recent_searches/location_searches.json',
    ]);
    if (locationSearchesData) {
      data.locationSearches = locationSearchesData.searches_place || locationSearchesData || [];
      console.log(`📍 Parsed ${data.locationSearches.length} location searches`);
    }

    // Profile Searches (account searches)
    const profileSearchesData = await tryParseJsonFile<any>(zip, [
      'logged_information/recent_searches/profile_searches.json',
      'recent_searches/profile_searches.json',
    ]);
    if (profileSearchesData) {
      data.profileSearches = profileSearchesData.searches_user || profileSearchesData || [];
      console.log(`👤🔍 Parsed ${data.profileSearches.length} profile searches`);
    }

    // === SAVED CONTENT ===

    // Saved Posts
    const savedPostsData = await tryParseJsonFile<any>(zip, [
      'your_instagram_activity/saved/saved_posts.json',
      'saved/saved_posts.json',
    ]);
    if (savedPostsData) {
      data.savedPosts = savedPostsData.saved_saved_media || savedPostsData || [];
      console.log(`💾 Parsed ${data.savedPosts.length} saved posts`);
    }

    // Saved Collections
    const savedCollectionsData = await tryParseJsonFile<any>(zip, [
      'your_instagram_activity/saved/saved_collections.json',
      'saved/saved_collections.json',
    ]);
    if (savedCollectionsData) {
      data.savedCollections = savedCollectionsData.saved_saved_collections || savedCollectionsData || [];
      console.log(`📁 Parsed ${data.savedCollections.length} saved collections`);
    }

    // === USER'S OWN CONTENT ===

    // Posts (multiple files: posts_1.json, posts_2.json, etc.)
    const postsFiles = Object.keys(zip.files).filter(f =>
      f.match(/content\/posts_\d+\.json$/) || f.match(/your_instagram_activity\/content\/posts_\d+\.json$/)
    );
    for (const path of postsFiles) {
      const file = zip.file(path);
      if (file) {
        try {
          const content = await file.async('string');
          const postsData = JSON.parse(content);
          if (Array.isArray(postsData)) {
            data.posts.push(...postsData);
          }
        } catch (e) { /* ignore */ }
      }
    }
    console.log(`📷 Parsed ${data.posts.length} user posts`);

    // Reels
    const reelsData = await tryParseJsonFile<any>(zip, [
      'your_instagram_activity/content/reels.json',
      'content/reels.json',
    ]);
    if (reelsData) {
      data.reels = reelsData.ig_reels_media || reelsData || [];
      console.log(`🎞️ Parsed ${data.reels.length} user reels`);
    }

    // Stories
    const storiesData = await tryParseJsonFile<any>(zip, [
      'your_instagram_activity/content/stories.json',
      'content/stories.json',
    ]);
    if (storiesData) {
      data.stories = storiesData.ig_stories || storiesData || [];
      console.log(`📖 Parsed ${data.stories.length} stories`);
    }

    // Comments (multiple files: post_comments_1.json, etc.)
    const commentFiles = Object.keys(zip.files).filter(f =>
      f.match(/comments\/post_comments_\d+\.json$/) ||
      f.match(/your_instagram_activity\/comments\/post_comments_\d+\.json$/)
    );
    for (const path of commentFiles) {
      const file = zip.file(path);
      if (file) {
        try {
          const content = await file.async('string');
          const commentsData = JSON.parse(content);
          if (Array.isArray(commentsData)) {
            data.comments.push(...commentsData);
          } else if (commentsData.comments_media_comments) {
            data.comments.push(...commentsData.comments_media_comments);
          }
        } catch (e) { /* ignore */ }
      }
    }
    console.log(`💭 Parsed ${data.comments.length} user comments`);

    // === INTERESTS & TOPICS ===

    // Topic Interests (Instagram's own categorization)
    const topicsData = await tryParseJsonFile<any>(zip, [
      'preferences/your_topics/recommended_topics.json',
      'your_topics/your_topics.json',
      'logged_information/topics/your_topics.json',
      'preferences/topics/your_topics.json',
    ]);
    if (topicsData) {
      // Try different possible JSON structures
      let topics = topicsData.topics_your_topics
        || topicsData.recommended_topics
        || topicsData.topics
        || topicsData;

      // If it's an array, use it directly; if object with nested data, try to extract
      if (Array.isArray(topics)) {
        data.topicInterests = topics;
      } else if (typeof topics === 'object' && topics !== null) {
        // Maybe the structure is { "topic_name": {...}, "topic_name2": {...} }
        data.topicInterests = Object.keys(topics).map(key => ({ value: key, ...topics[key] }));
      }
      console.log(`🎯 Parsed ${data.topicInterests.length} topic interests from recommended_topics`);
      console.log(`🎯 Topics data structure:`, JSON.stringify(topicsData).slice(0, 500));
    } else {
      console.log(`🎯 No topics file found. Searched paths: preferences/your_topics/recommended_topics.json, your_topics/your_topics.json, etc.`);
    }

    // AI Interest Categories (Instagram's AI-detected interests - very valuable!)
    const aiInterestsData = await tryParseJsonFile<any>(zip, [
      'your_instagram_activity/ai/interest_categories.json',
    ]);
    if (aiInterestsData) {
      // Merge with topic interests or store separately
      const aiInterests = aiInterestsData.topics_your_topics
        || aiInterestsData.interest_categories
        || aiInterestsData.interests
        || aiInterestsData;

      if (Array.isArray(aiInterests)) {
        // Add to topic interests if we have them, or use as primary
        if (data.topicInterests.length === 0) {
          data.topicInterests = aiInterests;
        } else {
          // Merge unique interests
          const existingValues = new Set(data.topicInterests.map((t: any) => t.value || t));
          aiInterests.forEach((interest: any) => {
            const val = interest.value || interest;
            if (!existingValues.has(val)) {
              data.topicInterests.push(interest);
            }
          });
        }
      }
      console.log(`🤖 Parsed AI interest categories, total topics now: ${data.topicInterests.length}`);
      console.log(`🤖 AI interests structure:`, JSON.stringify(aiInterestsData).slice(0, 500));
    }

    // Ad Interests
    const adInterestsData = await tryParseJsonFile<any>(zip, [
      'ads_information/ads_interests.json',
      'information_about_you/ads_interests.json',
      'ads_and_businesses/ads_interests.json',
    ]);
    if (adInterestsData) {
      data.adInterests = adInterestsData.inferred_data_ig_interest ||
                         adInterestsData.ig_custom_audiences_all_types ||
                         adInterestsData || [];
      console.log(`📢 Parsed ${data.adInterests.length} ad interests`);
    }

    // Ads Viewed (in ads_and_topics subfolder)
    const adsViewedData = await tryParseJsonFile<any>(zip, [
      'ads_information/ads_and_topics/ads_viewed.json',
      'ads_information/ads_viewed.json',
      'ads_and_businesses/ads_viewed.json',
    ]);
    if (adsViewedData) {
      data.adsViewed = adsViewedData.impressions_history_ads_seen || adsViewedData || [];
      console.log(`👁️ Parsed ${data.adsViewed.length} ads viewed`);
    }

    // Ads Clicked (in ads_and_topics subfolder)
    const adsClickedData = await tryParseJsonFile<any>(zip, [
      'ads_information/ads_and_topics/ads_clicked.json',
      'ads_information/ads_clicked.json',
      'ads_and_businesses/ads_clicked.json',
    ]);
    if (adsClickedData) {
      data.adsClicked = adsClickedData.impressions_history_ads_clicked || adsClickedData || [];
      console.log(`🖱️ Parsed ${data.adsClicked.length} ads clicked`);
    }

    // Ad Categories (Instagram's interest targeting)
    const adCategoriesData = await tryParseJsonFile<any>(zip, [
      'ads_information/instagram_ads_and_businesses/other_categories_used_to_reach_you.json',
      'instagram_ads_and_businesses/other_categories_used_to_reach_you.json',
      'ads_and_businesses/other_categories_used_to_reach_you.json',
      'information_about_you/other_categories_used_to_reach_you.json',
    ]);
    if (adCategoriesData) {
      data.adCategories = adCategoriesData.label_values
        || adCategoriesData.ig_custom_audiences_all_types
        || adCategoriesData || [];
      console.log(`🏷️ Parsed ${data.adCategories.length} ad targeting categories`);
      console.log(`🏷️ Ad categories structure:`, JSON.stringify(adCategoriesData).slice(0, 500));
    }

    // === VIEWING ACTIVITY (Critical for interests!) ===

    // Posts Viewed (in ads_and_topics subfolder)
    const postsViewedData = await tryParseJsonFile<any>(zip, [
      'ads_information/ads_and_topics/posts_viewed.json',
      'ads_information/posts_viewed.json',
      'your_instagram_activity/posts_viewed.json',
    ]);
    if (postsViewedData) {
      data.postsViewed = postsViewedData.impressions_history_posts_seen || postsViewedData || [];
      console.log(`📱 Parsed ${data.postsViewed.length} posts viewed`);
    }

    // Videos Watched (in ads_and_topics subfolder)
    const videosWatchedData = await tryParseJsonFile<any>(zip, [
      'ads_information/ads_and_topics/videos_watched.json',
      'ads_information/videos_watched.json',
      'your_instagram_activity/videos_watched.json',
    ]);
    if (videosWatchedData) {
      data.videosWatched = videosWatchedData.impressions_history_videos_watched || videosWatchedData || [];
      console.log(`🎬 Parsed ${data.videosWatched.length} videos watched`);
    }

    // Posts Not Interested (negative signal, in ads_and_topics subfolder)
    const notInterestedData = await tryParseJsonFile<any>(zip, [
      "ads_information/ads_and_topics/posts_you're_not_interested_in.json",
      "ads_information/posts_you're_not_interested_in.json",
      'ads_information/posts_youre_not_interested_in.json',
      "your_instagram_activity/posts_you're_not_interested_in.json",
    ]);
    if (notInterestedData) {
      data.postsNotInterested = notInterestedData.impressions_history_posts_not_interested || notInterestedData || [];
      console.log(`🚫 Parsed ${data.postsNotInterested.length} posts not interested`);
    }

    // === LINK HISTORY ===

    const linkHistoryData = await tryParseJsonFile<any>(zip, [
      'logged_information/link_history/your_history.json',
      'link_history/your_history.json',
    ]);
    if (linkHistoryData) {
      data.linkHistory = linkHistoryData.label_values || linkHistoryData || [];
      console.log(`🔗 Parsed ${data.linkHistory.length} link history entries`);
    }

    // === MESSAGES (contacts only for privacy) ===
    const inboxPath = Object.keys(zip.files).find(f =>
      f.includes('messages/inbox') || f.includes('your_instagram_activity/messages')
    );
    if (inboxPath) {
      // Get unique conversation partners from folder names
      const messagesFolders = Object.keys(zip.files)
        .filter(f => f.includes('/inbox/') && f.endsWith('/message_1.json'))
        .map(f => {
          const match = f.match(/inbox\/([^\/]+)\/message/);
          return match ? match[1] : null;
        })
        .filter(Boolean);
      data.messageContacts = [...new Set(messagesFolders)] as string[];
      console.log(`💬 Found ${data.messageContacts.length} message contacts`);
    }

    console.log('✅ Instagram ZIP parsing complete');
    return data;
  } catch (error) {
    console.error('Error parsing Instagram ZIP:', error);
    throw new Error('Failed to parse Instagram data. Make sure you uploaded a valid Instagram export.');
  }
}

// === Data Anonymization & Analysis ===

export function anonymizeInstagramData(data: ParsedInstagramData) {
  // Extract account names from liked posts
  const likedPostAccounts = data.likedPosts.map(like => like.title);
  const likedCommentAccounts = data.likedComments.map(like => like.title);

  // Extract accounts they follow
  const followedAccounts = data.following.map(f =>
    f.string_list_data?.[0]?.value || f.title
  );

  // Extract search queries
  const wordSearches = data.wordSearches.map(s =>
    s.string_list_data?.[0]?.value || s.title || ''
  ).filter(Boolean);

  const accountSearches = data.accountSearches.map(s =>
    s.string_list_data?.[0]?.value || s.title || ''
  ).filter(Boolean);

  const tagSearches = data.tagSearches.map(s =>
    s.string_list_data?.[0]?.value || s.title || ''
  ).filter(Boolean);

  const profileSearches = data.profileSearches.map(s =>
    s.string_list_data?.[0]?.value || s.title || ''
  ).filter(Boolean);

  // Extract saved content creators
  const savedPostAccounts = data.savedPosts.map(s => s.title);

  // Extract topic interests
  const topics = data.topicInterests.map(t => {
    if (t.string_map_data?.Name?.value) return t.string_map_data.Name.value;
    if (t.value) return t.value;
    return '';
  }).filter(Boolean);

  // Extract ad interests
  const adTopics = data.adInterests.map(t => {
    if (t.string_map_data?.Name?.value) return t.string_map_data.Name.value;
    if (t.value) return t.value;
    return '';
  }).filter(Boolean);

  // Extract ad categories (Instagram's targeting categories)
  const adCategories = data.adCategories.map(c => {
    if (c.string_map_data?.Name?.value) return c.string_map_data.Name.value;
    if (c.value) return c.value;
    return '';
  }).filter(Boolean);

  // Extract posts viewed (author names)
  const postsViewedAuthors = data.postsViewed.map(p => {
    if (p.string_map_data?.Author?.value) return p.string_map_data.Author.value;
    if (p.title) return p.title;
    return '';
  }).filter(Boolean);

  // Extract videos watched (author names)
  const videosWatchedAuthors = data.videosWatched.map(v => {
    if (v.string_map_data?.Author?.value) return v.string_map_data.Author.value;
    if (v.title) return v.title;
    return '';
  }).filter(Boolean);

  // Extract ads clicked (shows active interest)
  const adsClickedData = data.adsClicked.map(a => {
    if (a.string_map_data?.Author?.value) return a.string_map_data.Author.value;
    if (a.title) return a.title;
    return '';
  }).filter(Boolean);

  // Extract link history (what external links they clicked)
  const linkDomains = data.linkHistory.map(l => {
    if (l.string_map_data?.Link?.value) {
      try {
        const url = new URL(l.string_map_data.Link.value);
        return url.hostname;
      } catch { return ''; }
    }
    return '';
  }).filter(Boolean);

  // Extract captions from user's posts
  const postCaptions = data.posts
    .map(p => p.title || p.media?.[0]?.title || '')
    .filter(Boolean)
    .slice(0, 50);

  // Extract captions from user's reels
  const reelCaptions = data.reels
    .map(r => r.title || r.media?.[0]?.title || '')
    .filter(Boolean)
    .slice(0, 20);

  // Extract user comments (what they say)
  const userComments = data.comments
    .map(c => c.string_list_data?.[0]?.value || c.title || '')
    .filter(Boolean)
    .slice(0, 30);

  // Count frequency of likes per account
  const allLikedAccounts = [...likedPostAccounts, ...likedCommentAccounts];
  const accountFrequency = allLikedAccounts.reduce((acc, account) => {
    acc[account] = (acc[account] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top accounts by engagement
  const topEngagedAccounts = Object.entries(accountFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .map(([account, count]) => ({ account, count }));

  // Count saved account frequency
  const savedFrequency = savedPostAccounts.reduce((acc, account) => {
    acc[account] = (acc[account] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSavedAccounts = Object.entries(savedFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([account, count]) => ({ account, count }));

  // Count most viewed creators
  const viewedFrequency = postsViewedAuthors.reduce((acc, author) => {
    acc[author] = (acc[author] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topViewedCreators = (Object.entries(viewedFrequency) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([account, count]) => ({ account, count }));

  // Count most watched video creators
  const watchedFrequency = videosWatchedAuthors.reduce((acc, author) => {
    acc[author] = (acc[author] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topWatchedCreators = (Object.entries(watchedFrequency) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([account, count]) => ({ account, count }));

  // Count link domains (what external sites they visit)
  const domainFrequency = linkDomains.reduce((acc, domain) => {
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDomains = (Object.entries(domainFrequency) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([domain, count]) => ({ domain, count }));

  // Combine all signals for categorization
  const allSignals = [
    ...topEngagedAccounts.map(a => a.account),
    ...topSavedAccounts.map(a => a.account),
    ...topViewedCreators.map(a => a.account),
    ...topWatchedCreators.map(a => a.account),
    ...followedAccounts.slice(0, 100),
    ...wordSearches.slice(0, 50),
    ...tagSearches.map(t => t.replace('#', '')),
    ...profileSearches.slice(0, 30),
    ...topics,
    ...adTopics,
    ...adCategories,
    ...adsClickedData.slice(0, 20),
    ...postCaptions,
    ...reelCaptions,
    ...userComments,
  ];

  // Categorize all signals
  const categories = categorizeContent(allSignals);

  // Determine engagement level based on all activity
  const totalEngagement = data.likedPosts.length + data.likedComments.length +
                          data.savedPosts.length + data.postsViewed.length +
                          data.videosWatched.length;
  const engagementLevel = totalEngagement > 5000 ? 'very_high' :
                          totalEngagement > 2000 ? 'high' :
                          totalEngagement > 500 ? 'medium' : 'low';

  // Determine content creator status
  const isContentCreator = data.posts.length > 10 || data.reels.length > 5;

  return {
    // Basic Stats
    totalLikedPosts: data.likedPosts.length,
    totalLikedComments: data.likedComments.length,
    totalFollowing: data.following.length,
    totalFollowers: data.followers.length,
    totalSavedPosts: data.savedPosts.length,
    totalUserPosts: data.posts.length,
    totalUserReels: data.reels.length,
    totalComments: data.comments.length,

    // Viewing Activity Stats (NEW)
    totalPostsViewed: data.postsViewed.length,
    totalVideosWatched: data.videosWatched.length,
    totalAdsClicked: data.adsClicked.length,
    totalLinksClicked: data.linkHistory.length,

    // Engagement Metrics
    engagementLevel,
    isContentCreator,

    // Top Engaged Content (from likes)
    topEngagedAccounts: topEngagedAccounts.slice(0, 25),
    topSavedAccounts: topSavedAccounts.slice(0, 20),

    // Viewing Patterns (NEW - very important for interests!)
    topViewedCreators: topViewedCreators.slice(0, 25),
    topWatchedCreators: topWatchedCreators.slice(0, 25),
    topDomainsVisited: topDomains.slice(0, 15),

    // Search Behavior
    recentWordSearches: wordSearches.slice(0, 30),
    recentAccountSearches: [...accountSearches, ...profileSearches].slice(0, 30),
    recentTagSearches: tagSearches.slice(0, 20),
    totalSearches: wordSearches.length + accountSearches.length + tagSearches.length + profileSearches.length,

    // Instagram's Own Interest Data (VERY VALUABLE!)
    topicInterests: topics.slice(0, 30),
    adInterests: adTopics.slice(0, 30),
    adTargetingCategories: adCategories.slice(0, 30),

    // User's Content (what they create)
    postCaptions: postCaptions.slice(0, 20),
    reelCaptions: reelCaptions.slice(0, 10),
    sampleComments: userComments.slice(0, 15),

    // Categorized Analysis
    categories: categories,

    // Message activity indicator
    messageContactCount: data.messageContacts.length,
  };
}

function categorizeContent(items: string[]): Record<string, number> {
  const categories: Record<string, string[]> = {
    'Tech & Coding': ['code', 'dev', 'program', 'tech', 'software', 'web', 'app', 'data', 'ai', 'ml', 'python', 'javascript', 'react', 'design', 'ui', 'ux', 'computer', 'cyber', 'hack', 'developer', 'coding', 'engineering'],
    'Art & Design': ['art', 'design', 'creative', 'illustration', 'graphic', 'draw', 'paint', 'sketch', 'aesthetic', 'artist', 'creator', 'digital art', 'anime', 'manga', 'animation'],
    'Fashion & Beauty': ['fashion', 'style', 'outfit', 'beauty', 'makeup', 'hair', 'skincare', 'clothing', 'clothes', 'brand', 'model', 'runway', 'ootd', 'aesthetic'],
    'Fitness & Health': ['fitness', 'workout', 'gym', 'health', 'nutrition', 'yoga', 'running', 'training', 'sport', 'athletic', 'muscle', 'cardio', 'wellness'],
    'Music & Audio': ['music', 'song', 'artist', 'band', 'concert', 'festival', 'musician', 'producer', 'beat', 'remix', 'spotify', 'playlist', 'vinyl', 'guitar', 'piano'],
    'Gaming & Esports': ['gaming', 'game', 'gamer', 'esports', 'streamer', 'twitch', 'xbox', 'playstation', 'nintendo', 'pc gaming', 'fps', 'minecraft', 'fortnite', 'valorant', 'roblox'],
    'Film & Entertainment': ['movie', 'film', 'tv', 'show', 'netflix', 'cinema', 'actor', 'actress', 'director', 'hollywood', 'series', 'streaming'],
    'Food & Cooking': ['food', 'cook', 'recipe', 'chef', 'restaurant', 'eating', 'foodie', 'baking', 'kitchen', 'cuisine', 'delicious', 'yummy'],
    'Travel & Adventure': ['travel', 'adventure', 'explore', 'wanderlust', 'trip', 'vacation', 'destination', 'hiking', 'backpack', 'beach', 'mountain'],
    'Education & Learning': ['education', 'learning', 'study', 'school', 'university', 'college', 'student', 'teacher', 'tutorial', 'course', 'book', 'read'],
    'Business & Entrepreneurship': ['business', 'entrepreneur', 'startup', 'marketing', 'hustle', 'ceo', 'founder', 'invest', 'money', 'success', 'career'],
    'Photography & Video': ['photography', 'photographer', 'photo', 'video', 'cinematography', 'filmmaking', 'camera', 'editing', 'lightroom', 'vsco'],
    'Nature & Animals': ['nature', 'animal', 'pet', 'wildlife', 'outdoor', 'environment', 'conservation', 'dog', 'cat', 'plant', 'garden'],
    'Sports': ['basketball', 'football', 'soccer', 'baseball', 'nba', 'nfl', 'sports', 'athlete', 'team', 'tennis', 'golf', 'swimming'],
    'Dance & Performing Arts': ['dance', 'dancer', 'choreography', 'ballet', 'hiphop', 'contemporary', 'perform', 'theatre', 'theater'],
    'Memes & Comedy': ['meme', 'funny', 'comedy', 'laugh', 'humor', 'joke', 'lol', 'viral'],
    'Lifestyle & Vlogs': ['lifestyle', 'vlog', 'daily', 'routine', 'life', 'day in', 'aesthetic'],
    'Science & Space': ['science', 'space', 'nasa', 'physics', 'chemistry', 'biology', 'research', 'experiment', 'scientist'],
    'Cars & Automotive': ['car', 'cars', 'automotive', 'racing', 'f1', 'formula', 'vehicle', 'motor', 'drive'],
    'DIY & Crafts': ['diy', 'craft', 'handmade', 'maker', 'create', 'build', 'project', 'tutorial'],
  };

  const categoryCounts: Record<string, number> = {};

  items.forEach(item => {
    if (!item) return;
    const lowerItem = item.toLowerCase();

    Object.entries(categories).forEach(([category, keywords]) => {
      const matches = keywords.some(keyword => lowerItem.includes(keyword));
      if (matches) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
  });

  // Sort by count and return top categories
  return Object.fromEntries(
    Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
  );
}
