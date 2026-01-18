import JSZip from 'jszip';

interface SnapchatFriend {
  Username: string;
  'Display Name': string;
  'Creation Timestamp': string;
  Source: string;
}

interface SnapchatEngagement {
  Event: string;
  Occurrences: number;
}

interface SnapchatStoryView {
  'Story Date': string;
  'Story Views': number;
  'Story Replies': number;
}

interface ParsedSnapchatData {
  friends: SnapchatFriend[];
  engagement: SnapchatEngagement[];
  storyViews: SnapchatStoryView[];
  snapscore: number;
  totalFriends: number;
  spotlightHashtags: Record<string, string>;
}

export async function parseSnapchatZip(zip: JSZip): Promise<ParsedSnapchatData> {
  const data: ParsedSnapchatData = {
    friends: [],
    engagement: [],
    storyViews: [],
    snapscore: 0,
    totalFriends: 0,
    spotlightHashtags: {},
  };

  try {
    // Parse friends.json
    const friendsFile = zip.file('json/friends.json');
    if (friendsFile) {
      const friendsContent = await friendsFile.async('string');
      const friendsData = JSON.parse(friendsContent);
      data.friends = friendsData.Friends || [];
      console.log(`👥 Parsed ${data.friends.length} friends`);
    }

    // Parse user_profile.json for engagement data
    const profileFile = zip.file('json/user_profile.json');
    if (profileFile) {
      const profileContent = await profileFile.async('string');
      const profileData = JSON.parse(profileContent);
      data.engagement = profileData.Engagement || [];
      console.log(`📊 Parsed ${data.engagement.length} engagement events`);
    }

    // Parse ranking.json for snapscore and spotlight hashtags
    const rankingFile = zip.file('json/ranking.json');
    if (rankingFile) {
      const rankingContent = await rankingFile.async('string');
      const rankingData = JSON.parse(rankingContent);

      const stats = rankingData.Statistics || {};
      data.snapscore = parseFloat(stats.Snapscore || '0');
      data.totalFriends = parseInt(stats['Your Total Friends'] || '0', 10);

      // Spotlight hashtags are in an array where the second element is the hashtag object
      const spotlight = rankingData.Spotlight || [];
      if (spotlight.length > 1 && typeof spotlight[1] === 'object') {
        data.spotlightHashtags = spotlight[1];
      }
      console.log(`🏆 Snapscore: ${data.snapscore}, Friends: ${data.totalFriends}`);
      console.log(`#️⃣ Parsed ${Object.keys(data.spotlightHashtags).length} spotlight hashtags`);
    }

    // Parse story_history.json
    const storyFile = zip.file('json/story_history.json');
    if (storyFile) {
      const storyContent = await storyFile.async('string');
      const storyData = JSON.parse(storyContent);
      data.storyViews = storyData['Your Story Views'] || [];
      console.log(`📖 Parsed ${data.storyViews.length} story view entries`);
    }

    return data;
  } catch (error) {
    console.error('Error parsing Snapchat ZIP:', error);
    throw new Error('Failed to parse Snapchat data. Make sure you uploaded a valid Snapchat export.');
  }
}

export function anonymizeSnapchatData(data: ParsedSnapchatData) {
  // Extract engagement metrics
  const engagementMap = data.engagement.reduce((acc, e) => {
    acc[e.Event] = e.Occurrences;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total story engagement
  const totalStoryViews = data.storyViews.reduce((sum, s) => sum + s['Story Views'], 0);
  const totalStoryReplies = data.storyViews.reduce((sum, s) => sum + s['Story Replies'], 0);

  // Extract meaningful spotlight hashtags (filter out empty values and low-use ones)
  const usedHashtags = Object.entries(data.spotlightHashtags)
    .filter(([_, count]) => count && count !== '' && parseInt(count, 10) > 0)
    .map(([hashtag, count]) => ({
      hashtag: hashtag.replace('#', ''),
      count: parseInt(count, 10) || 1,
    }))
    .sort((a, b) => b.count - a.count);

  // Categorize based on hashtags and engagement patterns
  const hashtagTexts = usedHashtags.map(h => h.hashtag);
  const categories = categorizeContent(hashtagTexts);

  // Determine engagement level based on activity
  const totalActivity = (engagementMap['Snap Sends'] || 0) +
                       (engagementMap['Chats Sent'] || 0) +
                       (engagementMap['Application Opens'] || 0);
  const engagementLevel = totalActivity > 10000 ? 'high' : totalActivity > 5000 ? 'medium' : 'low';

  // Determine if they're a content creator
  const isContentCreator = (engagementMap['Snaps Posted to Story'] || 0) > 20 ||
                          (engagementMap['Direct Snaps Created'] || 0) > 1000;

  return {
    snapscore: data.snapscore,
    totalFriends: data.totalFriends,
    engagement: {
      snapsSent: engagementMap['Snap Sends'] || 0,
      snapsViewed: engagementMap['Snap Views'] || 0,
      chatsSent: engagementMap['Chats Sent'] || 0,
      chatsViewed: engagementMap['Chats Viewed'] || 0,
      storyPostsCreated: engagementMap['Snaps Posted to Story'] || 0,
      storyViewsReceived: totalStoryViews,
      storyRepliesReceived: totalStoryReplies,
      discoverViewings: engagementMap['Discover Editions Viewed'] || 0,
      applicationOpens: engagementMap['Application Opens'] || 0,
    },
    topHashtags: usedHashtags.slice(0, 20),
    categories: categories,
    engagementLevel,
    isContentCreator,
  };
}

function categorizeContent(hashtags: string[]): Record<string, number> {
  const categories: Record<string, string[]> = {
    'Tech & Coding': ['code', 'tech', 'software', 'app', 'data', 'ai', 'computer', 'robot'],
    'Art & Design': ['art', 'design', 'creative', 'aesthetic', 'artist', 'painting', 'drawing'],
    'Fashion & Beauty': ['fashion', 'style', 'outfit', 'beauty', 'makeup', 'ootd', 'aesthetic'],
    'Fitness & Health': ['fitness', 'workout', 'gym', 'health', 'sport', 'gymnast', 'parkour'],
    'Music & Entertainment': ['music', 'song', 'concert', 'movie', 'film', 'entertainment', 'dance', 'singing'],
    'Gaming': ['gaming', 'game', 'gamer', 'esports', 'streamer', 'fortnite', 'minecraft'],
    'Food & Cooking': ['food', 'cook', 'recipe', 'foodie', 'hibachi', 'coffee', 'baking'],
    'Travel & Adventure': ['travel', 'adventure', 'explore', 'trip', 'vacation', 'beach'],
    'Comedy & Entertainment': ['funny', 'comedy', 'meme', 'humor', 'prank', 'funnyvideo', 'fails', 'relatable'],
    'Relationships & Social': ['couple', 'boyfriend', 'girlfriend', 'relationship', 'love', 'friends', 'couplegoals'],
    'Pop Culture': ['taylorswift', 'strangerthings', 'spongebob', 'theboys', 'netflix', 'celebrity'],
    'Trending & Viral': ['viral', 'trending', 'fyp', 'spotlight', 'challenge', 'viralvideo'],
  };

  const categoryCounts: Record<string, number> = {};

  hashtags.forEach(hashtag => {
    const lowerHashtag = hashtag.toLowerCase();

    Object.entries(categories).forEach(([category, keywords]) => {
      const matches = keywords.some(keyword => lowerHashtag.includes(keyword));
      if (matches) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
  });

  // Sort by count and return top categories
  return Object.fromEntries(
    Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  );
}
