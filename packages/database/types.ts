export interface Profile {
id: string;
role: 'teen' | 'mentor' | 'parent' | 'admin';
full_name: string | null;
email: string | null;
avatar_url: string | null;

// Teen fields
grade: number | null;
school: string | null;
bio: string | null;

// Social media connections
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

//Mentor fields
expertise: string[] | null;
max_mentees: number | null;
linkedin_url: string | null;
is_default_mentor: boolean | null;

created_at: string;
updated_at: string;
}

export interface Project {
id: string;
teen_id: string;
title: string;
description: string;
category: string | null;
status: 'active' | 'completed' | 'archived';
ai_generated: boolean;
ai_prompt: string | null;
created_at: string;
updated_at: string;
completed_at: string | null;
}

export interface Task {
id: string;
project_id: string;
title: string;
description: string | null;
status: 'todo' | 'in_progress' | 'done';
order_index: number;
evidence_url: string | null;
evidence_type: string | null;
evidence_description: string | null;
ai_generated: boolean;
suggested_evidence: string | null;
created_at: string;
updated_at: string;
completed_at: string | null;
}

export interface Mentorship {
    id: string;
    mentor_id: string;
    teen_id: string;
    status: 'pending' | 'active' | 'completed' | 'declined';
    invited_by: string | null;
    invitation_message: string | null;
    created_at: string;
    accepted_at: string | null;
    completed_at: string | null;
}

export interface FamilyConnection {
    id: string;
    parent_id: string;
    teen_id: string;
    relationship: string | null;
    verified: boolean;
    created_at: string;
    verified_at: string | null;
}

export interface Comment {
    id: string;
    project_id: string | null;
    task_id: string | null;
    author_id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectWithTasks extends Project {
    tasks: Task[];
}

export interface MentorshipWithProfiles extends Mentorship {
    mentor: Profile;
    teen: Profile;
}

// Incentive Systems

export interface IncentiveAssignment {
    id: string;
    user_id: string;
    system: 'quest' | 'ladder' | 'tracker';
    assigned_at: string;
    active: boolean;
}

export interface Quest {
    id: string;
    user_id: string;
    chain_date: string;
    title: string;
    description: string;
    difficulty: number;
    estimated_minutes: number;
    proof_type: string;
    order_index: number;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    proof_text: string | null;
    discomfort_rating: number | null;
    points_earned: number;
    completed_at: string | null;
    created_at: string;
}

export interface UserQuestProgress {
    user_id: string;
    current_streak: number;
    longest_streak: number;
    total_points: number;
    level: number;
    last_completed_date: string | null;
    recovery_available: boolean;
    updated_at: string;
}

export interface Ladder {
    id: string;
    interest: string;
    status: 'forming' | 'active' | 'completed';
    current_day: number;
    created_at: string;
}

export interface LadderMember {
    id: string;
    ladder_id: string;
    user_id: string;
    tokens: number;
    joined_at: string;
}

export interface Challenge {
    id: string;
    ladder_id: string;
    day: number;
    title: string;
    description: string;
    difficulty: 'normal' | 'hard';
    is_selected: boolean;
    votes: string[];
    status: 'pending' | 'voting' | 'active' | 'completed';
    created_at: string;
}

export interface ChallengeCompletion {
    id: string;
    challenge_id: string;
    user_id: string;
    proof_text: string | null;
    discomfort_rating: number | null;
    tokens_earned: number;
    completed_at: string;
}

export interface AmbitionGoal {
    id: string;
    user_id: string;
    goal_text: string;
    week_start: string;
    status: 'active' | 'completed' | 'abandoned';
    total_stars: number;
    created_at: string;
}

export interface DailyTrack {
    id: string;
    goal_id: string;
    day_number: number;
    task_description: string;
    difficulty: number;
    status: 'pending' | 'completed';
    evidence_text: string | null;
    effort_rating: number | null;
    stars_earned: number;
    completed_at: string | null;
    created_at: string;
}

export interface IncentiveEvent {
    id: string;
    user_id: string;
    system: string;
    event_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface AlphaScore {
    total: number;
    fromQuests: number;
    fromLadders: number;
    fromTracker: number;
    level: number;
    levelProgress: number;
    streak: number;
}

// Profile Customization

export interface ProfileWidget {
    type: 'visitor_counter' | 'mood' | 'glitter_text' | 'top_friends';
    config: Record<string, unknown>;
}

export interface ProfileCssOverrides {
    borderRadius?: number;
    cardOpacity?: number;
    headerHeight?: number;
    shadowIntensity?: number;
}

export interface ProfileCustomization {
    user_id: string;
    avatar_type: 'default' | 'upload' | 'preset';
    avatar_preset: string | null;
    avatar_badges: string[];
    banner_type: 'color' | 'upload';
    banner_color: string;
    banner_image_path: string | null;
    interests: string[];
    theme_palette: 'indigo' | 'teal' | 'orange' | 'hotpink' | 'neon' | 'dark';
    theme_font: 'inter' | 'space-grotesk' | 'poppins' | 'jetbrains-mono' | 'caveat';
    bg_type: 'default' | 'color' | 'upload';
    bg_color: string | null;
    bg_image_path: string | null;
    bg_tile: boolean;
    bg_overlay: 'none' | 'glitter' | 'stars' | 'bubbles';
    music_url: string | null;
    music_autoplay: boolean;
    widgets: ProfileWidget[];
    css_overrides: ProfileCssOverrides;
    visibility: 'full' | 'basic' | 'private';
    created_at: string;
    updated_at: string;
}

export interface ProfileUnlock {
    id: string;
    user_id: string;
    unlock_type: 'badge_slot' | 'widget_slot' | 'effect' | 'premium_music' | 'font' | 'bg_overlay' | 'premium_preset';
    unlock_key: string;
    alpha_cost: number;
    unlocked_at: string;
}

// Messaging

export interface Chat {
    id: string;
    chat_type: 'one-on-one' | 'group';
    name: string | null;
    created_by: string;
    created_at: string;
}

export interface ChatParticipant {
    id: string;
    chat_id: string;
    user_id: string;
    joined_at: string;
    last_read_at: string;
}

export interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string | null;
    message_type: 'text' | 'image' | 'voice' | 'video' | 'sticker';
    media_url: string | null;
    viewed_at: string | null;
    expires_at: string | null;
    saved: boolean;
    created_at: string;
}

export interface ChatStreak {
    id: string;
    chat_id: string;
    streak_count: number;
    last_message_date: string | null;
    longest_streak: number;
    updated_at: string;
}

export interface ChatReport {
    id: string;
    chat_id: string;
    reporter_id: string;
    reason: string;
    resolved: boolean;
    created_at: string;
}

export interface BlockedUser {
    id: string;
    user_id: string;
    blocked_user_id: string;
    created_at: string;
}

export interface ChatWithPreview extends Chat {
    participants: (ChatParticipant & { profile?: Pick<Profile, 'full_name' | 'avatar_url'> })[];
    last_message?: Message | null;
    streak?: ChatStreak | null;
    unread_count: number;
}

// Teen Discovery

export interface MatchReason {
    type: 'interest' | 'ladder' | 'gaming' | 'social' | 'grade' | 'school' | 'pathway' | 'goal' | 'skill';
    label: string;
}

export interface DiscoveredTeen {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    grade: string | null;
    school: string | null;
    bio: string | null;
    interests: string[];
    matchScore: number;
    matchReasons: MatchReason[];
    hasExistingChat: boolean;
    existingChatId: string | null;
}

// Visual Onboarding / Explore Types

export interface ExploreStep {
    order: number;
    title: string;
    description: string;
    timeEstimate: string;
}

// Summary version for progressive loading (details optional)
export interface ExplorePathSummary {
    id: string;
    name: string;
    icon: string;
    tagline: string;
    connection: string;
    moneyPath: string;
    steps?: ExploreStep[];
    skills?: string[];
    tools?: string[];
}

// Full version with all details (for backwards compatibility)
export interface ExplorePath {
    id: string;
    name: string;
    icon: string;
    tagline: string;
    connection: string;
    moneyPath: string;
    steps: ExploreStep[];
    skills: string[];
    tools: string[];
}

export interface ExplorePathsResponse {
    paths: ExplorePath[];
}

export interface AlphaAward {
    id: string;
    user_id: string;
    source: string;
    amount: number;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface GuestOnboardingSession {
    id: string;
    visitor_id: string;
    interest: string;
    paths_generated: ExplorePath[] | null;
    selected_path_index: number | null;
    converted_user_id: string | null;
    variant: 'mindmap' | 'list';
    created_at: string;
}

export interface GuestExploreData {
    interest: string;
    paths: ExplorePath[];
    selectedPathIndex: number | null;
    visitorId: string;
}