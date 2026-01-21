// TBPN (Technology Brother Podcast Network) RSS Feed Parser
// Fetches and parses podcast episodes for startup pathway generation

export interface TBPNEpisode {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  duration?: string;
  guest?: string;
  themes: string[];
}

export interface TBPNFeedData {
  title: string;
  description: string;
  episodes: TBPNEpisode[];
  fetchedAt: string;
}

const TBPN_RSS_URL = 'https://feeds.transistor.fm/technology-brother';

/**
 * Fetches and parses the TBPN podcast RSS feed
 * @param limit Number of recent episodes to fetch (default: 10)
 * @returns Parsed feed data with episodes
 */
export async function fetchTBPNFeed(limit: number = 10): Promise<TBPNFeedData> {
  try {
    const response = await fetch(TBPN_RSS_URL, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'TeenAlpha/1.0 (Startup Pathways Feature)',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xmlText = await response.text();
    return parseRSSFeed(xmlText, limit);
  } catch (error) {
    console.error('Error fetching TBPN feed:', error);
    throw new Error('Failed to fetch TBPN podcast feed');
  }
}

/**
 * Parses RSS XML into structured data
 */
function parseRSSFeed(xml: string, limit: number): TBPNFeedData {
  // Extract channel info
  const channelTitleMatch = xml.match(/<channel>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
  const channelDescMatch = xml.match(/<channel>[\s\S]*?<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);

  // Extract all items
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const items: TBPNEpisode[] = [];
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const itemXml = match[1];
    const episode = parseEpisode(itemXml);
    if (episode) {
      items.push(episode);
    }
  }

  return {
    title: cleanText(channelTitleMatch?.[1] || 'Technology Brother'),
    description: cleanText(channelDescMatch?.[1] || ''),
    episodes: items,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Parses a single episode item from RSS
 */
function parseEpisode(itemXml: string): TBPNEpisode | null {
  try {
    // Extract basic fields
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
    const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/);
    const durationMatch = itemXml.match(/<itunes:duration>(.*?)<\/itunes:duration>/);

    const title = cleanText(titleMatch?.[1] || '');
    const description = cleanText(descMatch?.[1] || '');

    if (!title) return null;

    // Extract guest name from title or description
    const guest = extractGuest(title, description);

    // Extract themes/topics from title and description
    const themes = extractThemes(title, description);

    return {
      title,
      description: truncateDescription(description, 500),
      pubDate: pubDateMatch?.[1] || '',
      link: cleanText(linkMatch?.[1] || ''),
      duration: durationMatch?.[1] || undefined,
      guest,
      themes,
    };
  } catch (error) {
    console.error('Error parsing episode:', error);
    return null;
  }
}

/**
 * Cleans text by removing CDATA, HTML tags, and extra whitespace
 */
function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncates description to a maximum length
 */
function truncateDescription(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

/**
 * Attempts to extract guest name from episode title/description
 */
function extractGuest(title: string, description: string): string | undefined {
  // Common patterns: "with [Guest Name]", "ft. [Guest Name]", "featuring [Guest Name]"
  const patterns = [
    /with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /ft\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /featuring\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /guest:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /\|\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$/i,
  ];

  const text = `${title} ${description}`;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extracts relevant tech/startup themes from content
 */
function extractThemes(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const themes: string[] = [];

  // Tech and startup keywords to look for
  const themeKeywords: Record<string, string[]> = {
    'AI/ML': ['artificial intelligence', 'machine learning', 'ai', 'deep learning', 'neural', 'gpt', 'llm', 'chatgpt', 'openai'],
    'Fintech': ['fintech', 'finance', 'banking', 'payments', 'crypto', 'blockchain', 'defi', 'trading'],
    'SaaS': ['saas', 'software as a service', 'b2b', 'enterprise', 'cloud'],
    'E-commerce': ['ecommerce', 'e-commerce', 'retail', 'marketplace', 'dtc', 'direct to consumer'],
    'Healthcare': ['healthtech', 'health tech', 'medical', 'biotech', 'healthcare', 'telemedicine'],
    'EdTech': ['edtech', 'education', 'learning', 'online courses', 'tutoring'],
    'Climate Tech': ['climate', 'sustainability', 'cleantech', 'green', 'renewable', 'carbon'],
    'Creator Economy': ['creator', 'content', 'influencer', 'social media', 'streaming', 'youtube'],
    'Gaming': ['gaming', 'esports', 'video games', 'metaverse', 'vr', 'virtual reality'],
    'Robotics': ['robotics', 'automation', 'drones', 'autonomous'],
    'Cybersecurity': ['cybersecurity', 'security', 'privacy', 'encryption'],
    'Web3': ['web3', 'nft', 'dao', 'decentralized', 'token'],
    'Mobile': ['mobile', 'app', 'ios', 'android'],
    'Developer Tools': ['developer', 'devtools', 'api', 'infrastructure', 'open source'],
    'Consumer': ['consumer', 'b2c', 'social', 'app'],
    'Venture Capital': ['vc', 'venture', 'funding', 'investment', 'startup', 'founder'],
    'Product': ['product', 'growth', 'pmf', 'product-market fit'],
    'Entrepreneurship': ['entrepreneur', 'founder', 'ceo', 'startup', 'building', 'scale'],
  };

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      themes.push(theme);
    }
  }

  // Limit to top 5 themes
  return themes.slice(0, 5);
}

/**
 * Formats episodes for AI prompt consumption
 */
export function formatEpisodesForPrompt(episodes: TBPNEpisode[]): string {
  return episodes.map((ep, i) => {
    const guestStr = ep.guest ? ` (Guest: ${ep.guest})` : '';
    const themesStr = ep.themes.length > 0 ? `\n   Topics: ${ep.themes.join(', ')}` : '';
    return `${i + 1}. "${ep.title}"${guestStr}${themesStr}
   ${ep.description}`;
  }).join('\n\n');
}
