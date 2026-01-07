interface SteamGame {
    appid: number;
    name: string;
    playtime_forever: number; // in minutes
    playtime_2weeks?: number;
    img_icon_url: string;
  }
  
  interface SteamGamesResponse {
    response: {
      game_count: number;
      games: SteamGame[];
    };
  }
  
  interface SteamPlayerSummary {
    steamid: string;
    personaname: string;
    profileurl: string;
    avatar: string;
    avatarmedium: string;
    avatarfull: string;
  }
  
  export async function getSteamGames(steamId: string): Promise<SteamGame[]> {
    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) {
      throw new Error('Steam API key not configured');
    }
  
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch Steam games');
      }
  
      const data: SteamGamesResponse = await response.json();
      
      if (!data.response || !data.response.games) {
        throw new Error('No games found or profile is private');
      }
  
      return data.response.games;
    } catch (error) {
      console.error('Steam API error:', error);
      throw error;
    }
  }
  
  export async function getSteamPlayerSummary(steamId: string): Promise<SteamPlayerSummary> {
    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) {
      throw new Error('Steam API key not configured');
    }
  
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}&format=json`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch Steam profile');
      }
  
      const data = await response.json();
      
      if (!data.response?.players?.[0]) {
        throw new Error('Steam profile not found');
      }
  
      return data.response.players[0];
    } catch (error) {
      console.error('Steam API error:', error);
      throw error;
    }
  }

  export async function resolveSteamId(input: string): Promise<string> {
    // Handle Steam ID directly (17 digits)
    if (/^\d{17}$/.test(input.trim())) {
      return input.trim();
    }
  
    // Handle profile URLs - extract the custom URL or numeric ID
    const customUrlMatch = input.match(/steamcommunity\.com\/id\/([^/?]+)/);
    if (customUrlMatch) {
      const vanityUrl = customUrlMatch[1];
      
      // Need to resolve vanity URL to Steam ID via API
      const apiKey = process.env.STEAM_API_KEY;
      if (!apiKey) throw new Error('Steam API key not configured');
      
      const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${vanityUrl}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.response?.success === 1) {
        return data.response.steamid;
      }
      throw new Error('Could not resolve Steam profile URL');
    }
  
    // Handle numeric profile URLs
    const numericMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
    if (numericMatch) {
      return numericMatch[1];
    }
  
    throw new Error('Invalid Steam ID or profile URL format');
  }
  
  export function formatPlaytime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return `${minutes}m`;
    if (hours < 100) return `${hours}h`;
    return `${Math.floor(hours / 100) * 100}+ hours`;
  }
  
  export function analyzeGamingData(games: SteamGame[]): {
    topGames: Array<{ name: string; hours: number }>;
    totalHours: number;
    genres: string[];
    mostPlayed: SteamGame;
  } {
    // Sort by playtime
    const sorted = [...games].sort((a, b) => b.playtime_forever - a.playtime_forever);
    
    // Get top 10 games
    const topGames = sorted.slice(0, 10).map(game => ({
      name: game.name,
      hours: Math.floor(game.playtime_forever / 60),
    }));
  
    // Calculate total hours
    const totalHours = Math.floor(
      games.reduce((sum, game) => sum + game.playtime_forever, 0) / 60
    );
  
    // Identify genres based on game names (simple keyword matching)
    const genres = new Set<string>();
    games.forEach(game => {
      const name = game.name.toLowerCase();
      if (name.includes('craft') || name.includes('build')) genres.add('Building/Crafting');
      if (name.includes('shooter') || name.includes('fps')) genres.add('Shooter');
      if (name.includes('rpg') || name.includes('fantasy')) genres.add('RPG');
      if (name.includes('strategy') || name.includes('rts')) genres.add('Strategy');
      if (name.includes('survival')) genres.add('Survival');
      if (name.includes('puzzle')) genres.add('Puzzle');
      if (name.includes('racing')) genres.add('Racing');
      if (name.includes('sports')) genres.add('Sports');
    });
  
    return {
      topGames,
      totalHours,
      genres: Array.from(genres),
      mostPlayed: sorted[0],
    };
  }