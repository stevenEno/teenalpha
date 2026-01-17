import JSZip from 'jszip';

interface InstagramLike {
  title: string;
  string_list_data: Array<{
    href: string;
    value: string;
    timestamp: number;
  }>;
}

interface InstagramFollowing {
  title: string;
  string_list_data: Array<{
    href: string;
    value: string;
    timestamp: number;
  }>;
}

interface InstagramSearches {
  title: string;
  string_list_data: Array<{
    value: string;
    timestamp: number;
  }>;
}

interface ParsedInstagramData {
  likes: InstagramLike[];
  following: InstagramFollowing[];
  searches: InstagramSearches[];
}

export async function parseInstagramZip(zip: JSZip): Promise<ParsedInstagramData> {
  const data: ParsedInstagramData = {
    likes: [],
    following: [],
    searches: [],
  };

  try {
    // Parse likes (media/posts)
    const likesFile = zip.file('your_instagram_activity/likes/liked_posts.json');
    if (likesFile) {
      const likesContent = await likesFile.async('string');
      const likesData = JSON.parse(likesContent);
      data.likes = likesData.likes_media_likes || [];
      console.log(`📸 Parsed ${data.likes.length} likes`);
    }

    // Parse following
    const followingFile = zip.file('followers_and_following/following.json');
    if (followingFile) {
      const followingContent = await followingFile.async('string');
      const followingData = JSON.parse(followingContent);
      data.following = followingData.relationships_following || [];
      console.log(`👥 Parsed ${data.following.length} following`);
    }

    // Parse searches
    const searchesFile = zip.file('logged_information/recent_searches/word_or_phrase_searches.json');
    if (searchesFile) {
      const searchesContent = await searchesFile.async('string');
      const searchesData = JSON.parse(searchesContent);
      data.searches = searchesData.word_or_phrase_searches || [];
      console.log(`🔍 Parsed ${data.searches.length} searches`);
    }

    return data;
  } catch (error) {
    console.error('Error parsing Instagram ZIP:', error);
    throw new Error('Failed to parse Instagram data. Make sure you uploaded a valid Instagram export.');
  }
}

export function anonymizeInstagramData(data: ParsedInstagramData) {
  // Extract account names from likes (these are creators they engage with)
  const likedAccounts = data.likes.map(like => like.title);
  
  // Extract accounts they follow
  const followedAccounts = data.following.map(f => 
    f.string_list_data?.[0]?.value || f.title
  );

  // Extract search queries
  const searches = data.searches.map(s => 
    s.string_list_data?.[0]?.value || s.title
  );

  // Count frequency of likes per account
  const accountFrequency = likedAccounts.reduce((acc, account) => {
    acc[account] = (acc[account] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top accounts by engagement
  const topAccounts = Object.entries(accountFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .map(([account, count]) => ({ account, count }));

  // Categorize accounts and searches
  const categories = categorizeContent([
    ...topAccounts.map(a => a.account),
    ...followedAccounts.slice(0, 100),
    ...searches.slice(0, 50),
  ]);

  return {
    totalLikes: data.likes.length,
    totalFollowing: data.following.length,
    totalSearches: data.searches.length,
    topAccounts: topAccounts.slice(0, 20), // Only top 20 for analysis
    categories: categories,
    recentSearches: searches.slice(0, 20), // Last 20 searches
    engagementLevel: data.likes.length > 1000 ? 'high' : data.likes.length > 500 ? 'medium' : 'low',
  };
}

function categorizeContent(items: string[]): Record<string, number> {
  const categories: Record<string, string[]> = {
    'Tech & Coding': ['code', 'dev', 'program', 'tech', 'software', 'web', 'app', 'data', 'ai', 'ml', 'python', 'javascript', 'react', 'design', 'ui', 'ux'],
    'Art & Design': ['art', 'design', 'creative', 'illustration', 'graphic', 'draw', 'paint', 'sketch', 'photo', 'aesthetic', 'artist', 'creator'],
    'Fashion & Beauty': ['fashion', 'style', 'outfit', 'beauty', 'makeup', 'hair', 'skincare', 'clothing', 'clothes', 'brand'],
    'Fitness & Health': ['fitness', 'workout', 'gym', 'health', 'nutrition', 'yoga', 'running', 'training', 'sport'],
    'Music & Entertainment': ['music', 'song', 'artist', 'band', 'concert', 'festival', 'entertainment', 'movie', 'film', 'tv', 'show', 'netflix'],
    'Gaming': ['gaming', 'game', 'gamer', 'esports', 'streamer', 'twitch', 'xbox', 'playstation', 'nintendo', 'pc', 'fps'],
    'Food & Cooking': ['food', 'cook', 'recipe', 'chef', 'restaurant', 'eating', 'foodie', 'baking', 'kitchen'],
    'Travel & Adventure': ['travel', 'adventure', 'explore', 'wanderlust', 'trip', 'vacation', 'destination', 'hiking'],
    'Education & Learning': ['education', 'learning', 'study', 'school', 'university', 'college', 'student', 'teacher', 'tutorial'],
    'Business & Entrepreneurship': ['business', 'entrepreneur', 'startup', 'marketing', 'hustle', 'ceo', 'founder', 'invest'],
    'Photography & Video': ['photography', 'photographer', 'photo', 'video', 'cinematography', 'filmmaking', 'camera', 'editing'],
    'Nature & Animals': ['nature', 'animal', 'pet', 'wildlife', 'outdoor', 'environment', 'conservation', 'dog', 'cat'],
  };

  const categoryCounts: Record<string, number> = {};

  items.forEach(item => {
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
      .slice(0, 10)
  );
}