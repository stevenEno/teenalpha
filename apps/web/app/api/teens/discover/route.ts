import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { MatchReason, DiscoveredTeen } from '@teen-alpha/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = SupabaseClient<any, any, any>;

const SIGNAL_WEIGHTS = {
  interest: 30,
  ladder: 25,
  school: 40,
  grade: 20,
  gaming: 15,
  social: 15,
  pathway: 15,
  content_theme: 10,
  skill: 10,
  goal: 5,
} as const;

const CATEGORY_CAP = 100;

interface UserFingerprint {
  interests: string[];
  ladderInterests: string[];
  school: string | null;
  grade: number | null;
  gamingGenres: string[];
  socialInterests: string[];
  pathwayInterests: string[];
  contentThemes: string[];
  suggestedSkills: string[];
  goalKeywords: string[];
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'i', 'me', 'my', 'want', 'to', 'be', 'a', 'an', 'the', 'and', 'or',
    'of', 'in', 'on', 'at', 'for', 'with', 'is', 'it', 'that', 'this',
    'will', 'can', 'do', 'have', 'has', 'get', 'make', 'more', 'like',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

function arrayOverlap(a: string[], b: string[]): string[] {
  const setB = new Set(b.map(s => s.toLowerCase()));
  return a.filter(item => setB.has(item.toLowerCase()));
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify teen role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, grade, school')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teen') {
      return NextResponse.json({ error: 'Only teens can discover peers' }, { status: 403 });
    }

    // Service role client for cross-user data reads
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Step 1: Gather current user's interest fingerprint
    const fingerprint = await buildFingerprint(serviceClient, user.id, profile);

    const hasSignals = fingerprint.interests.length > 0
      || fingerprint.ladderInterests.length > 0
      || fingerprint.gamingGenres.length > 0
      || fingerprint.socialInterests.length > 0
      || fingerprint.pathwayInterests.length > 0
      || fingerprint.goalKeywords.length > 0;

    // Step 2: Get blocked users (both directions)
    const [{ data: blockedByMe }, { data: blockedMe }] = await Promise.all([
      serviceClient
        .from('blocked_users')
        .select('blocked_user_id')
        .eq('user_id', user.id),
      serviceClient
        .from('blocked_users')
        .select('user_id')
        .eq('blocked_user_id', user.id),
    ]);

    const excludeIds = new Set<string>([
      user.id,
      ...(blockedByMe?.map(b => b.blocked_user_id) || []),
      ...(blockedMe?.map(b => b.user_id) || []),
    ]);

    // Step 3: Fetch candidate pool — teens with non-private profiles
    const { data: candidates } = await serviceClient
      .from('profiles')
      .select('id, full_name, avatar_url, grade, school, bio')
      .eq('role', 'teen')
      .limit(200);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ teens: [], total: 0, hasMore: false });
    }

    // Filter out excluded IDs
    const pool = candidates.filter(c => !excludeIds.has(c.id));

    if (pool.length === 0) {
      return NextResponse.json({ teens: [], total: 0, hasMore: false });
    }

    const poolIds = pool.map(c => c.id);

    // Step 4: Fetch visibility/customization for all candidates
    const { data: customizations } = await serviceClient
      .from('profile_customizations')
      .select('user_id, visibility, interests')
      .in('user_id', poolIds);

    const customizationMap = new Map(
      (customizations || []).map(c => [c.user_id, c])
    );

    // Filter out private profiles
    const visiblePool = pool.filter(c => {
      const cust = customizationMap.get(c.id);
      return !cust || cust.visibility !== 'private';
    });

    if (visiblePool.length === 0) {
      return NextResponse.json({ teens: [], total: 0, hasMore: false });
    }

    const visibleIds = visiblePool.map(c => c.id);

    // Step 5: Batch-fetch enrichment data for candidates
    const [
      candidateLadders,
      candidateGaming,
      candidateSocial,
      candidatePathways,
      candidateGoals,
      userChats,
    ] = await Promise.all([
      fetchCandidateLadders(serviceClient, visibleIds),
      fetchCandidateGaming(serviceClient, visibleIds),
      fetchCandidateSocial(serviceClient, visibleIds),
      fetchCandidatePathways(serviceClient, visibleIds),
      fetchCandidateGoals(serviceClient, visibleIds),
      fetchUserChats(serviceClient, user.id, visibleIds),
    ]);

    // Step 6: Score each candidate
    const scored: DiscoveredTeen[] = visiblePool.map(candidate => {
      const cust = customizationMap.get(candidate.id);
      const visibility = cust?.visibility || 'basic';
      const candidateInterests: string[] = cust?.interests || [];

      let totalScore = 0;
      const reasons: MatchReason[] = [];
      const categoryScores: Record<string, number> = {};

      if (hasSignals) {
        // Interest overlap
        const interestOverlap = arrayOverlap(fingerprint.interests, candidateInterests);
        const interestScore = Math.min(interestOverlap.length * SIGNAL_WEIGHTS.interest, CATEGORY_CAP);
        categoryScores.interest = interestScore;
        totalScore += interestScore;
        if (interestOverlap.length > 0) {
          reasons.push({
            type: 'interest',
            label: interestOverlap.length === 1
              ? `Both like ${interestOverlap[0]}`
              : `${interestOverlap.length} shared interests`,
          });
        }

        // Ladder overlap
        const candLadders = candidateLadders.get(candidate.id) || [];
        const ladderOverlap = arrayOverlap(fingerprint.ladderInterests, candLadders);
        const ladderScore = Math.min(ladderOverlap.length * SIGNAL_WEIGHTS.ladder, CATEGORY_CAP);
        categoryScores.ladder = ladderScore;
        totalScore += ladderScore;
        if (ladderOverlap.length > 0) {
          reasons.push({
            type: 'ladder',
            label: ladderOverlap.length === 1
              ? `Both in ${ladderOverlap[0]} ladder`
              : `${ladderOverlap.length} shared ladders`,
          });
        }

        // Same school bonus
        if (fingerprint.school && candidate.school
          && fingerprint.school.toLowerCase() === candidate.school.toLowerCase()) {
          const schoolScore = Math.min(SIGNAL_WEIGHTS.school, CATEGORY_CAP);
          categoryScores.school = schoolScore;
          totalScore += schoolScore;
          reasons.push({ type: 'school', label: `Same school` });
        }

        // Same grade bonus
        if (fingerprint.grade && candidate.grade
          && fingerprint.grade === candidate.grade) {
          const gradeScore = Math.min(SIGNAL_WEIGHTS.grade, CATEGORY_CAP);
          categoryScores.grade = gradeScore;
          totalScore += gradeScore;
          reasons.push({ type: 'grade', label: `Same grade` });
        }

        // Gaming genre overlap
        const candGaming = candidateGaming.get(candidate.id) || { genres: [], skills: [] };
        const gamingOverlap = arrayOverlap(fingerprint.gamingGenres, candGaming.genres);
        const gamingScore = Math.min(gamingOverlap.length * SIGNAL_WEIGHTS.gaming, CATEGORY_CAP);
        categoryScores.gaming = gamingScore;
        totalScore += gamingScore;
        if (gamingOverlap.length > 0) {
          reasons.push({
            type: 'gaming',
            label: gamingOverlap.length === 1
              ? `Both play ${gamingOverlap[0]}`
              : `${gamingOverlap.length} shared gaming genres`,
          });
        }

        // Social interest overlap
        const candSocial = candidateSocial.get(candidate.id) || { interests: [], themes: [], skills: [] };
        const socialOverlap = arrayOverlap(fingerprint.socialInterests, candSocial.interests);
        const socialScore = Math.min(socialOverlap.length * SIGNAL_WEIGHTS.social, CATEGORY_CAP);
        categoryScores.social = socialScore;
        totalScore += socialScore;
        if (socialOverlap.length > 0) {
          reasons.push({
            type: 'social',
            label: socialOverlap.length === 1
              ? `Both into ${socialOverlap[0]}`
              : `${socialOverlap.length} shared social interests`,
          });
        }

        // Pathway interest overlap
        const candPathways = candidatePathways.get(candidate.id) || [];
        const pathwayOverlap = arrayOverlap(fingerprint.pathwayInterests, candPathways);
        const pathwayScore = Math.min(pathwayOverlap.length * SIGNAL_WEIGHTS.pathway, CATEGORY_CAP);
        categoryScores.pathway = pathwayScore;
        totalScore += pathwayScore;
        if (pathwayOverlap.length > 0) {
          reasons.push({
            type: 'pathway',
            label: pathwayOverlap.length === 1
              ? `Shared pathway: ${pathwayOverlap[0]}`
              : `${pathwayOverlap.length} shared pathway interests`,
          });
        }

        // Content theme overlap
        const contentOverlap = arrayOverlap(fingerprint.contentThemes, candSocial.themes);
        const contentScore = Math.min(contentOverlap.length * SIGNAL_WEIGHTS.content_theme, CATEGORY_CAP);
        categoryScores.content_theme = contentScore;
        totalScore += contentScore;

        // Suggested skills overlap (gaming + social combined)
        const candAllSkills = [...candGaming.skills, ...candSocial.skills];
        const skillOverlap = arrayOverlap(fingerprint.suggestedSkills, candAllSkills);
        const skillScore = Math.min(skillOverlap.length * SIGNAL_WEIGHTS.skill, CATEGORY_CAP);
        categoryScores.skill = skillScore;
        totalScore += skillScore;
        if (skillOverlap.length > 0) {
          reasons.push({
            type: 'skill',
            label: skillOverlap.length === 1
              ? `Shared skill: ${skillOverlap[0]}`
              : `${skillOverlap.length} shared skills`,
          });
        }

        // Goal keyword overlap
        const candGoals = candidateGoals.get(candidate.id) || [];
        const goalOverlap = arrayOverlap(fingerprint.goalKeywords, candGoals);
        const goalScore = Math.min(goalOverlap.length * SIGNAL_WEIGHTS.goal, CATEGORY_CAP);
        categoryScores.goal = goalScore;
        totalScore += goalScore;
        if (goalOverlap.length > 0) {
          reasons.push({ type: 'goal', label: 'Similar goals' });
        }
      }

      // Top 3 match reasons
      const topReasons = reasons.slice(0, 3);

      const chatInfo = userChats.get(candidate.id);

      return {
        id: candidate.id,
        full_name: candidate.full_name,
        avatar_url: candidate.avatar_url,
        grade: candidate.grade != null ? String(candidate.grade) : null,
        school: visibility === 'full' ? candidate.school : null,
        bio: visibility === 'full' ? candidate.bio : null,
        interests: visibility === 'full' ? candidateInterests : [],
        matchScore: totalScore,
        matchReasons: topReasons,
        hasExistingChat: !!chatInfo,
        existingChatId: chatInfo || null,
      };
    });

    // Step 7: Sort and paginate
    if (hasSignals) {
      scored.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      // Fallback: return newest teens
      scored.sort(() => Math.random() - 0.5);
    }

    const total = scored.length;
    const paginated = scored.slice(offset, offset + limit);

    return NextResponse.json({
      teens: paginated,
      total,
      hasMore: offset + limit < total,
      fallback: !hasSignals,
    });
  } catch (error: any) {
    console.error('Teen discover error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

async function buildFingerprint(
  client: ServiceClient,
  userId: string,
  profile: { grade: number | null; school: string | null },
): Promise<UserFingerprint> {
  const [
    customization,
    ladders,
    gaming,
    social,
    pathways,
    goals,
  ] = await Promise.all([
    client
      .from('profile_customizations')
      .select('interests')
      .eq('user_id', userId)
      .single(),
    client
      .from('ladder_members')
      .select('ladder_id, ladders:ladder_id (interest)')
      .eq('user_id', userId),
    client
      .from('gaming_analysis')
      .select('top_genres, suggested_skills')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1),
    client
      .from('social_media_analysis')
      .select('top_interests, content_themes, suggested_skills')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1),
    client
      .from('startup_pathways')
      .select('student_interests')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1),
    client
      .from('ambition_goals')
      .select('goal_text')
      .eq('user_id', userId)
      .eq('status', 'active'),
  ]);

  const interests: string[] = customization.data?.interests || [];

  const ladderInterests: string[] = (ladders.data || [])
    .map((lm: any) => lm.ladders?.interest)
    .filter(Boolean);

  const gamingRow = gaming.data?.[0];
  const gamingGenres: string[] = gamingRow?.top_genres || [];
  const gamingSkills: string[] = gamingRow?.suggested_skills || [];

  const socialRow = social.data?.[0];
  const socialInterests: string[] = socialRow?.top_interests || [];
  const contentThemes: string[] = socialRow?.content_themes || [];
  const socialSkills: string[] = socialRow?.suggested_skills || [];

  const pathwayRow = pathways.data?.[0];
  let pathwayInterests: string[] = [];
  if (pathwayRow?.student_interests) {
    const si = pathwayRow.student_interests;
    if (Array.isArray(si)) {
      pathwayInterests = si.map(String);
    } else if (typeof si === 'object' && si !== null) {
      pathwayInterests = Object.values(si).flat().map(String);
    }
  }

  const goalTexts: string[] = (goals.data || []).map((g: any) => g.goal_text);
  const goalKeywords: string[] = [...new Set(goalTexts.flatMap(extractKeywords))];

  const suggestedSkills = [...new Set([...gamingSkills, ...socialSkills])];

  return {
    interests,
    ladderInterests,
    school: profile.school,
    grade: profile.grade,
    gamingGenres,
    socialInterests,
    pathwayInterests,
    contentThemes,
    suggestedSkills,
    goalKeywords,
  };
}

async function fetchCandidateLadders(
  client: ServiceClient,
  userIds: string[],
): Promise<Map<string, string[]>> {
  const { data } = await client
    .from('ladder_members')
    .select('user_id, ladders:ladder_id (interest)')
    .in('user_id', userIds);

  const map = new Map<string, string[]>();
  for (const row of data || []) {
    const interest = (row as any).ladders?.interest;
    if (!interest) continue;
    const existing = map.get(row.user_id) || [];
    existing.push(interest);
    map.set(row.user_id, existing);
  }
  return map;
}

async function fetchCandidateGaming(
  client: ServiceClient,
  userIds: string[],
): Promise<Map<string, { genres: string[]; skills: string[] }>> {
  const { data } = await client
    .from('gaming_analysis')
    .select('user_id, top_genres, suggested_skills')
    .in('user_id', userIds);

  const map = new Map<string, { genres: string[]; skills: string[] }>();
  for (const row of data || []) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, {
        genres: row.top_genres || [],
        skills: row.suggested_skills || [],
      });
    }
  }
  return map;
}

async function fetchCandidateSocial(
  client: ServiceClient,
  userIds: string[],
): Promise<Map<string, { interests: string[]; themes: string[]; skills: string[] }>> {
  const { data } = await client
    .from('social_media_analysis')
    .select('user_id, top_interests, content_themes, suggested_skills')
    .in('user_id', userIds);

  const map = new Map<string, { interests: string[]; themes: string[]; skills: string[] }>();
  for (const row of data || []) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, {
        interests: row.top_interests || [],
        themes: row.content_themes || [],
        skills: row.suggested_skills || [],
      });
    }
  }
  return map;
}

async function fetchCandidatePathways(
  client: ServiceClient,
  userIds: string[],
): Promise<Map<string, string[]>> {
  const { data } = await client
    .from('startup_pathways')
    .select('user_id, student_interests')
    .in('user_id', userIds);

  const map = new Map<string, string[]>();
  for (const row of data || []) {
    if (map.has(row.user_id)) continue;
    const si = row.student_interests;
    let interests: string[] = [];
    if (Array.isArray(si)) {
      interests = si.map(String);
    } else if (typeof si === 'object' && si !== null) {
      interests = Object.values(si).flat().map(String);
    }
    if (interests.length > 0) {
      map.set(row.user_id, interests);
    }
  }
  return map;
}

async function fetchCandidateGoals(
  client: ServiceClient,
  userIds: string[],
): Promise<Map<string, string[]>> {
  const { data } = await client
    .from('ambition_goals')
    .select('user_id, goal_text')
    .in('user_id', userIds)
    .eq('status', 'active');

  const map = new Map<string, string[]>();
  for (const row of data || []) {
    const keywords = extractKeywords(row.goal_text);
    const existing = map.get(row.user_id) || [];
    map.set(row.user_id, [...new Set([...existing, ...keywords])]);
  }
  return map;
}

async function fetchUserChats(
  client: ServiceClient,
  userId: string,
  candidateIds: string[],
): Promise<Map<string, string>> {
  // Get all chat_ids the user is in
  const { data: myChats } = await client
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', userId);

  if (!myChats || myChats.length === 0) return new Map();

  const chatIds = myChats.map(c => c.chat_id);

  // Get one-on-one chats from those
  const { data: oneOnOneChats } = await client
    .from('chats')
    .select('id')
    .in('id', chatIds)
    .eq('chat_type', 'one-on-one');

  if (!oneOnOneChats || oneOnOneChats.length === 0) return new Map();

  const oneOnOneIds = oneOnOneChats.map(c => c.id);

  // Get other participants in those chats
  const { data: otherParticipants } = await client
    .from('chat_participants')
    .select('chat_id, user_id')
    .in('chat_id', oneOnOneIds)
    .in('user_id', candidateIds);

  const map = new Map<string, string>();
  for (const p of otherParticipants || []) {
    if (!map.has(p.user_id)) {
      map.set(p.user_id, p.chat_id);
    }
  }
  return map;
}
