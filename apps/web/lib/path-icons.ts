const ICON_CATEGORIES: Record<string, string[]> = {
  'content-creation': ['content', 'creator', 'blog', 'blogging', 'publish', 'media', 'influencer', 'vlog'],
  'digital-art': ['digital art', 'illustration', 'draw', 'drawing', 'nft', 'graphic', 'anime', 'cartoon', 'sketch'],
  'coding': ['code', 'coding', 'program', 'developer', 'software', 'app', 'web dev', 'website', 'tech', 'saas', 'automat'],
  'music': ['music', 'beat', 'song', 'audio', 'sound', 'producer', 'dj', 'instrument', 'sing', 'rap', 'podcast', 'listen'],
  'video': ['video', 'film', 'youtube', 'tiktok', 'stream', 'edit', 'cinema', 'movie', 'animat', 'motion'],
  'writing': ['writ', 'copywriting', 'freelance writ', 'story', 'fiction', 'journal', 'newsletter', 'ebook', 'author', 'poet', 'script'],
  'community': ['community', 'mentor', 'coach', 'consult', 'network', 'group', 'club', 'volunteer', 'lead'],
  'ecommerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'sell', 'product', 'merch', 'dropship', 'print on demand', 'marketplace', 'resell', 'retail', 'business'],
  'gaming': ['game', 'gaming', 'esport', 'twitch', 'stream game', 'minecraft', 'roblox', 'mod'],
  'photography': ['photo', 'camera', 'portrait', 'landscape', 'shoot', 'stock photo', 'lightroom'],
  'teaching': ['teach', 'tutor', 'course', 'lesson', 'education', 'instruct', 'academy', 'class', 'learn', 'train'],
  'design': ['design', 'ui', 'ux', 'logo', 'brand', 'canva', 'figma', 'layout', 'visual', 'poster', 'flyer'],
  'social-media': ['social media', 'instagram', 'twitter', 'tiktok', 'snapchat', 'influenc', 'follower', 'post', 'viral', 'engagement'],
  'crafts': ['craft', 'handmade', 'diy', 'knit', 'crochet', 'sew', 'jewelry', 'woodwork', 'pottery', 'etsy', 'maker', 'bead'],
};

/**
 * Maps a path name + tagline to the closest Ghibli-style illustration.
 * Returns the public path to the matched SVG.
 */
export function getPathIcon(pathName: string, pathTagline: string = ''): string {
  const text = `${pathName} ${pathTagline}`.toLowerCase();

  let bestMatch = 'default';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(ICON_CATEGORIES)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += keyword.length; // longer keyword matches are weighted higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return `/path-icons/${bestMatch}.svg`;
}
