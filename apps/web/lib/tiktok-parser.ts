import JSZip from 'jszip';

interface TikTokFavoriteVideo {
  Date: string;
  Link: string;
}

interface TikTokFavoriteSound {
  Date: string;
  Link: string;
}

interface TikTokSearch {
  Date: string;
  SearchTerm: string;
}

interface TikTokLikedItem {
  Date: string;
  Link?: string;
}

interface TikTokRepost {
  Date: string;
  Link?: string;
}

interface ParsedTikTokData {
  favoriteVideos: TikTokFavoriteVideo[];
  favoriteSounds: TikTokFavoriteSound[];
  likedItems: TikTokLikedItem[];
  reposts: TikTokRepost[];
  searches: TikTokSearch[];
  adInterestCategories: string[];
}

export async function parseTikTokZip(zip: JSZip): Promise<ParsedTikTokData> {
  const data: ParsedTikTokData = {
    favoriteVideos: [],
    favoriteSounds: [],
    likedItems: [],
    reposts: [],
    searches: [],
    adInterestCategories: [],
  };

  // List all files in the ZIP for debugging
  const fileNames = Object.keys(zip.files);
  console.log('📂 TikTok ZIP files:', fileNames);

  // TikTok exports a single JSON file - try multiple possible locations
  let tiktokFile = zip.file('user_data_tiktok.json');

  // If not found at root, search for it
  if (!tiktokFile) {
    console.log('🔍 Searching for TikTok data file...');
    const jsonFile = fileNames.find(name =>
      name.toLowerCase().includes('user_data') && name.endsWith('.json')
    );
    if (jsonFile) {
      tiktokFile = zip.file(jsonFile);
      console.log('📄 Found TikTok file at:', jsonFile);
    }
  }

  if (!tiktokFile) {
    console.error('❌ Available files:', fileNames);
    throw new Error(`Could not find TikTok data file. Found ${fileNames.length} files: ${fileNames.slice(0, 5).join(', ')}${fileNames.length > 5 ? '...' : ''}`);
  }

  let content: string;
  try {
    content = await tiktokFile.async('string');
    console.log('📄 TikTok file size:', content.length, 'bytes');
  } catch (readError: any) {
    console.error('❌ Error reading file:', readError);
    throw new Error(`Could not read TikTok file: ${readError.message}`);
  }

  let tiktokData: any;
  try {
    tiktokData = JSON.parse(content);
  } catch (parseError: any) {
    console.error('❌ JSON parse error:', parseError);
    console.error('First 500 chars:', content.substring(0, 500));
    throw new Error(`TikTok file is not valid JSON: ${parseError.message}`);
  }

  const topLevelKeys = Object.keys(tiktokData);
  console.log('📊 TikTok data top-level keys:', topLevelKeys);

  // Parse Likes and Favorites section
  try {
    const likesAndFavorites = tiktokData['Likes and Favorites'] || tiktokData['Activity'] || {};
    console.log('📊 Likes and Favorites keys:', Object.keys(likesAndFavorites));

    // Favorite Videos
    const favoriteVideos = likesAndFavorites['Favorite Videos'] || {};
    data.favoriteVideos = favoriteVideos.FavoriteVideoList || favoriteVideos.VideoList || [];
    console.log(`🎬 Parsed ${data.favoriteVideos.length} favorite videos`);

    // Favorite Sounds
    const favoriteSounds = likesAndFavorites['Favorite Sounds'] || {};
    data.favoriteSounds = favoriteSounds.FavoriteSoundList || favoriteSounds.SoundList || [];
    console.log(`🎵 Parsed ${data.favoriteSounds.length} favorite sounds`);

    // Like List (this is the main likes - much more data than favorites)
    const likeList = likesAndFavorites['Like List'] || likesAndFavorites['ItemFavoriteList'] || {};
    data.likedItems = likeList.ItemFavoriteList || [];
    console.log(`❤️ Parsed ${data.likedItems.length} liked items`);
  } catch (likesError: any) {
    console.error('⚠️ Error parsing Likes and Favorites:', likesError);
    // Continue anyway - we might have other data
  }

  // Parse Your Activity section
  try {
    const yourActivity = tiktokData['Your Activity'] || tiktokData['Activity'] || {};
    console.log('📊 Your Activity keys:', Object.keys(yourActivity));

    // Searches
    const searches = yourActivity['Searches'] || yourActivity['Search History'] || {};
    data.searches = searches.SearchList || searches.History || [];
    console.log(`🔍 Parsed ${data.searches.length} searches`);

    // Reposts
    const reposts = yourActivity['Reposts'] || {};
    data.reposts = reposts.RepostList || [];
    console.log(`🔄 Parsed ${data.reposts.length} reposts`);

    // Ad Interest Categories
    const adInterests = yourActivity['Ad Interests'] || {};
    let categories = adInterests.AdInterestCategories || adInterests.Categories || [];

    // Handle case where it might be a string instead of array
    if (typeof categories === 'string') {
      categories = categories.split(',').map((c: string) => c.trim());
    }

    // Filter out empty or invalid categories
    if (Array.isArray(categories)) {
      data.adInterestCategories = categories.filter((c: any) =>
        c && typeof c === 'string' && c.trim() && c.trim() !== ','
      );
    }
    console.log(`📊 Parsed ${data.adInterestCategories.length} ad interest categories`);
  } catch (activityError: any) {
    console.error('⚠️ Error parsing Your Activity:', activityError);
    // Continue anyway - we might have other data
  }

  // Validate we got some data
  const totalItems = data.favoriteVideos.length + data.favoriteSounds.length +
                     data.likedItems.length + data.searches.length + data.reposts.length;

  console.log(`✅ Total items parsed: ${totalItems}`);

  if (totalItems === 0) {
    console.error('❌ No data found in TikTok export');
    console.error('Top-level keys:', topLevelKeys);
    throw new Error('No activity data found in TikTok export. The file structure may be different than expected.');
  }

  return data;
}

export function anonymizeTikTokData(data: ParsedTikTokData) {
  // Extract search terms (primary interest signal)
  const searchTerms = data.searches
    .filter(s => s && s.SearchTerm)
    .map(s => s.SearchTerm);

  // Count search term frequency
  const searchFrequency = searchTerms.reduce((acc, term) => {
    if (term) {
      const normalized = term.toLowerCase().trim();
      acc[normalized] = (acc[normalized] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Get top searches by frequency
  const topSearches = Object.entries(searchFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .map(([term, count]) => ({ term, count }));

  // Categorize content based on searches and ad interests
  const categories = categorizeContent([
    ...searchTerms.slice(0, 100),
    ...data.adInterestCategories,
  ]);

  // Calculate engagement level based on activity
  const totalActivity = data.favoriteVideos.length + data.favoriteSounds.length +
                        data.likedItems.length + data.searches.length + data.reposts.length;
  const engagementLevel = totalActivity > 1000 ? 'high' : totalActivity > 300 ? 'medium' : 'low';

  return {
    totalFavoriteVideos: data.favoriteVideos.length,
    totalFavoriteSounds: data.favoriteSounds.length,
    totalLikedItems: data.likedItems.length,
    totalReposts: data.reposts.length,
    totalSearches: data.searches.length,
    topSearches: topSearches.slice(0, 20),
    adInterestCategories: data.adInterestCategories.slice(0, 20),
    categories: categories,
    recentSearches: searchTerms.slice(0, 20),
    engagementLevel,
    totalActivity,
  };
}

function categorizeContent(items: string[]): Record<string, number> {
  const categories: Record<string, string[]> = {
    'Tech & Coding': ['code', 'dev', 'program', 'tech', 'software', 'web', 'app', 'data', 'ai', 'ml', 'python', 'javascript', 'react', 'design', 'ui', 'ux', 'computer', 'robot', 'arduino', 'raspberry'],
    'Art & Design': ['art', 'design', 'creative', 'illustration', 'graphic', 'draw', 'paint', 'sketch', 'photo', 'aesthetic', 'artist', 'creator', 'craft', 'diy'],
    'Fashion & Beauty': ['fashion', 'style', 'outfit', 'beauty', 'makeup', 'hair', 'skincare', 'clothing', 'clothes', 'brand', 'aritzia', 'sweatpants', 'dress', 'shoes', 'sneaker', 'ootd'],
    'Fitness & Health': ['fitness', 'workout', 'gym', 'health', 'nutrition', 'yoga', 'running', 'training', 'sport', 'exercise', 'weight', 'muscle'],
    'Music & Entertainment': ['music', 'song', 'artist', 'band', 'concert', 'festival', 'entertainment', 'movie', 'film', 'tv', 'show', 'netflix', 'spotify', 'dance', 'singing', 'singer'],
    'Gaming': ['gaming', 'game', 'gamer', 'esports', 'streamer', 'twitch', 'xbox', 'playstation', 'nintendo', 'pc', 'fps', 'roblox', 'minecraft', 'fortnite', 'valorant'],
    'Food & Cooking': ['food', 'cook', 'recipe', 'chef', 'restaurant', 'eating', 'foodie', 'baking', 'kitchen', 'meal', 'breakfast', 'lunch', 'dinner', 'cafe', 'coffee'],
    'Travel & Adventure': ['travel', 'adventure', 'explore', 'wanderlust', 'trip', 'vacation', 'destination', 'hiking', 'beach', 'mountain'],
    'Education & Learning': ['education', 'learning', 'study', 'school', 'university', 'college', 'student', 'teacher', 'tutorial', 'lesson', 'homework', 'exam'],
    'Business & Entrepreneurship': ['business', 'entrepreneur', 'startup', 'marketing', 'hustle', 'ceo', 'founder', 'invest', 'money', 'side hustle', 'income'],
    'Photography & Video': ['photography', 'photographer', 'photo', 'video', 'cinematography', 'filmmaking', 'camera', 'editing', 'tiktok', 'content creator', 'vlog'],
    'Nature & Animals': ['nature', 'animal', 'pet', 'wildlife', 'outdoor', 'environment', 'conservation', 'dog', 'cat', 'puppy', 'kitten'],
    'Comedy & Memes': ['funny', 'comedy', 'meme', 'humor', 'joke', 'prank', 'viral', 'trending', 'relatable', 'lol'],
    'Relationships & Lifestyle': ['couple', 'boyfriend', 'girlfriend', 'relationship', 'dating', 'love', 'life', 'day in my life', 'routine', 'grwm', 'get ready'],
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
      .slice(0, 10)
  );
}
