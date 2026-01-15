interface RobloxUser {
    id: number;
    name: string;
    displayName: string;
    description: string;
    created: string;
    isBanned: boolean;
  }
  
  interface RobloxGame {
    id: number;
    name: string;
    description: string;
    creator: {
      id: number;
      name: string;
      type: string;
    };
    placeVisits: number;
    created: string;
    updated: string;
  }
  
  interface RobloxFavorite {
    id: number;
    name: string;
    description: string;
    placeVisits: number;
  }
  
  interface RobloxGroup {
    group: {
      id: number;
      name: string;
      description: string;
      memberCount: number;
    };
    role: {
      name: string;
      rank: number;
    };
  }
  
  interface RobloxBadge {
    id: number;
    name: string;
    description: string;
    displayName: string;
    enabled: boolean;
    awardingUniverse: {
      id: number;
      name: string;
    };
  }

  async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  export async function getRobloxUserByUsername(username: string): Promise<RobloxUser> {
    // Retry logic for network errors
    let lastError: any;
    
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt + 1}/3 for Roblox user lookup`);
          await delay(2000 * attempt); // Increasing delay: 2s, 4s
        }
  
        // First, get user ID from username
        const userResponse = await fetch(
          `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`,
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }
        );
  
        if (userResponse.status === 429) {
          throw new Error('Roblox rate limit reached. Please wait a minute and try again.');
        }
  
        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error('Roblox search error:', userResponse.status, errorText);
          throw new Error(`Failed to search for Roblox user (Status: ${userResponse.status})`);
        }
  
        const userData = await userResponse.json();
        
        if (!userData.data || userData.data.length === 0) {
          throw new Error('Roblox user not found. Check spelling and try again.');
        }
  
        // Find exact match (case-insensitive)
        const user = userData.data.find(
          (u: any) => u.name.toLowerCase() === username.toLowerCase()
        );
  
        if (!user) {
          throw new Error(`Roblox user "${username}" not found. Check spelling and try again.`);
        }
  
        // Small delay before next request
        await delay(1000);
  
        // Get full user details
        const detailsResponse = await fetch(
          `https://users.roblox.com/v1/users/${user.id}`,
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000),
          }
        );
  
        if (detailsResponse.status === 429) {
          throw new Error('Roblox rate limit reached. Please wait a minute and try again.');
        }
  
        if (!detailsResponse.ok) {
          const errorText = await detailsResponse.text();
          console.error('Roblox details error:', detailsResponse.status, errorText);
          throw new Error(`Failed to get user details (Status: ${detailsResponse.status})`);
        }
  
        const userDetails = await detailsResponse.json();
        console.log('✅ Successfully fetched Roblox user:', userDetails.name);
        return userDetails;
  
      } catch (error: any) {
        lastError = error;
        
        // Don't retry for these specific errors
        if (error.message.includes('not found') || 
            error.message.includes('rate limit') ||
            error.message.includes('Check spelling')) {
          throw error;
        }
        
        console.error(`Roblox API attempt ${attempt + 1} failed:`, error.message);
        
        // If it's the last attempt, throw
        if (attempt === 2) {
          throw new Error('Unable to connect to Roblox. Their API might be temporarily down. Please try again in a few minutes.');
        }
      }
    }
    
    throw lastError;
  }
  
  // Then update each API function to include delays
  export async function getRobloxUserGames(userId: number): Promise<RobloxGame[]> {
    try {
      await delay(300); // Add delay before request
      
      const response = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=50&sortOrder=Desc`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TeenProjectManager/1.0)',
          },
        }
      );
  
      if (response.status === 429) {
        console.warn('Roblox rate limit - games');
        return [];
      }
  
      if (!response.ok) {
        return [];
      }
  
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Roblox games fetch error:', error);
      return [];
    }
  }
  
  export async function getRobloxUserFavorites(userId: number): Promise<RobloxFavorite[]> {
    try {
      await delay(300);
      
      const response = await fetch(
        `https://games.roblox.com/v2/users/${userId}/favorite/games?limit=50`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TeenProjectManager/1.0)',
          },
        }
      );
  
      if (response.status === 429) {
        console.warn('Roblox rate limit - favorites');
        return [];
      }
  
      if (!response.ok) {
        return [];
      }
  
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Roblox favorites fetch error:', error);
      return [];
    }
  }
  
  export async function getRobloxUserGroups(userId: number): Promise<RobloxGroup[]> {
    try {
      await delay(300);
      
      const response = await fetch(
        `https://groups.roblox.com/v2/users/${userId}/groups/roles`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TeenProjectManager/1.0)',
          },
        }
      );
  
      if (response.status === 429) {
        console.warn('Roblox rate limit - groups');
        return [];
      }
  
      if (!response.ok) {
        return [];
      }
  
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Roblox groups fetch error:', error);
      return [];
    }
  }
  
  export async function getRobloxUserBadges(userId: number): Promise<RobloxBadge[]> {
    try {
      await delay(300);
      
      const response = await fetch(
        `https://badges.roblox.com/v1/users/${userId}/badges?limit=100&sortOrder=Desc`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TeenProjectManager/1.0)',
          },
        }
      );
  
      if (response.status === 429) {
        console.warn('Roblox rate limit - badges');
        return [];
      }
  
      if (!response.ok) {
        return [];
      }
  
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Roblox badges fetch error:', error);
      return [];
    }
  }
  
  export function analyzeRobloxData(data: {
    user: RobloxUser;
    games: RobloxGame[];
    favorites: RobloxFavorite[];
    groups: RobloxGroup[];
    badges: RobloxBadge[];
  }): {
    isCreator: boolean;
    createdGames: number;
    favoriteGenres: string[];
    topGames: Array<{ name: string; type: string }>;
    skills: string[];
    interests: string[];
  } {
    const { user, games, favorites, groups, badges } = data;
  
    // Determine if they're a creator
    const isCreator = games.length > 0;
    const createdGames = games.length;
  
    // Analyze favorite games for genres
    const genreKeywords = new Map<string, string[]>([
      ['Roleplay', ['roleplay', 'rp', 'life', 'town', 'city', 'adopt']],
      ['Simulator', ['simulator', 'tycoon', 'clicker', 'idle']],
      ['Obby', ['obby', 'parkour', 'obstacle']],
      ['Shooter', ['shooter', 'fps', 'gun', 'war', 'battle']],
      ['Adventure', ['adventure', 'quest', 'explore', 'dungeon']],
      ['Horror', ['horror', 'scary', 'escape', 'survival']],
      ['Fighting', ['fighting', 'combat', 'pvp', 'arena']],
      ['Racing', ['racing', 'drive', 'car', 'speed']],
      ['Building', ['build', 'craft', 'create', 'design']],
      ['Social', ['hangout', 'chat', 'friends', 'party']],
    ]);
  
    const genres = new Set<string>();
    const allGameNames = [
      ...games.map(g => g.name),
      ...favorites.map(f => f.name),
    ].map(name => name.toLowerCase());
  
    genreKeywords.forEach((keywords, genre) => {
      const matches = keywords.some(keyword =>
        allGameNames.some(name => name.includes(keyword))
      );
      if (matches) {
        genres.add(genre);
      }
    });
  
    // Top games (created + favorites)
    const topGames = [
      ...games.slice(0, 3).map(g => ({ name: g.name, type: 'Created' })),
      ...favorites.slice(0, 3).map(f => ({ name: f.name, type: 'Favorite' })),
    ].slice(0, 5);
  
    // Determine skills based on activity
    const skills: string[] = [];
    if (isCreator) skills.push('Game Development');
    if (games.some(g => g.placeVisits > 1000)) skills.push('Popular Creator');
    if (badges.length > 50) skills.push('Achievement Hunter');
    if (groups.length > 5) skills.push('Community Active');
  
    // Determine interests from groups
    const interests = groups
      .slice(0, 5)
      .map(g => g.group.name)
      .filter(name => !name.toLowerCase().includes('fan'));
  
    return {
      isCreator,
      createdGames,
      favoriteGenres: Array.from(genres),
      topGames,
      skills,
      interests,
    };
  }