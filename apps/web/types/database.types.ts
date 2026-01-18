// Gaming Analysis Types
export type GamingAnalysis = {
    id: string;
    profile_id: string;
    platform: 'steam' | 'roblox';
    raw_data: any;
    analysis: {
      gamingPersonality?: string;
      topGenres?: string[];
      personalityInsights?: string;
      suggestedProjects?: string[];
    };
    top_games?: string[];
    top_genres?: string[];
    total_playtime_hours?: number;
    created_at: string;
    updated_at: string;
  };
  
  // Social Media Analysis Types
  export type SocialMediaAnalysis = {
    id: string;
    profile_id: string;
    platform: 'instagram' | 'tiktok' | 'snapchat';
    raw_data: {
      totalLikes?: number;
      totalFollowing?: number;
      totalSearches?: number;
      topAccounts?: Array<{ account: string; count: number }>;
      categories?: Record<string, number>;
      recentSearches?: string[];
      engagementLevel?: 'low' | 'medium' | 'high';
    };
    analysis: {
      topInterests?: string[];
      contentThemes?: string[];
      suggestedSkills?: string[];
      personalityInsights?: string;
      projectRecommendations?: string[];
    };
    top_interests?: string[];
    content_themes?: string[];
    suggested_skills?: string[];
    created_at: string;
    updated_at: string;
  };
  
  // Project Recommendations Types
  export type ProjectRecommendation = {
    id: string;
    profile_id: string;
    title: string;
    description: string;
    why_matches: string;
    skills_learned: string[];
    difficulty: string;
    estimated_time: string;
    tech_stack: string[];
    first_step: string;
    data_source: 'gaming' | 'social';
    source_platform: 'steam' | 'roblox' | 'instagram' | 'tiktok' | 'snapchat';
    created_at: string;
    updated_at: string;
  };
  
  // Profile Types
  export type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    steam_id: string | null;
    roblox_username: string | null;
    instagram_connected_at: string | null;
    instagram_upload_filename: string | null;
    instagram_upload_size_bytes: number | null;
    tiktok_connected_at: string | null;
    tiktok_upload_filename: string | null;
    tiktok_upload_size_bytes: number | null;
    snapchat_connected_at: string | null;
    snapchat_upload_filename: string | null;
    snapchat_upload_size_bytes: number | null;
    created_at: string;
    updated_at: string;
  };
  
  // Database Schema Type
  export type Database = {
    public: {
      Tables: {
        profiles: {
          Row: Profile;
          Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
        };
        gaming_analysis: {
          Row: GamingAnalysis;
          Insert: Omit<GamingAnalysis, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<GamingAnalysis, 'id' | 'created_at' | 'updated_at'>>;
        };
        social_media_analysis: {
          Row: SocialMediaAnalysis;
          Insert: Omit<SocialMediaAnalysis, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<SocialMediaAnalysis, 'id' | 'created_at' | 'updated_at'>>;
        };
        project_recommendations: {
          Row: ProjectRecommendation;
          Insert: Omit<ProjectRecommendation, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<ProjectRecommendation, 'id' | 'created_at' | 'updated_at'>>;
        };
      };
    };
  };