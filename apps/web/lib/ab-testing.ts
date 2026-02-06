// A/B Testing utilities for explore flow experiments

// ===== CURRENT A/B TEST: Question Variants =====
// These are the questions shown on the /explore landing page
export const QUESTION_VARIANTS = ['curious', 'youtube', 'unprompted', 'pain'] as const;
export type QuestionVariant = (typeof QUESTION_VARIANTS)[number];

// Explore UI variants (mindmap vs list view)
export const EXPLORE_UI_VARIANTS = ['mindmap', 'list'] as const;
export type ExploreUIVariant = (typeof EXPLORE_UI_VARIANTS)[number];

// ===== DEPRECATED: Old Landing Page Variants =====
// These pages are archived but kept for historical analytics
export const LANDING_VARIANTS = ['screen-time', 'grow', 'leapfrog', 'purpose', 'craft'] as const;
export type LandingVariant = (typeof LANDING_VARIANTS)[number];

// Explore flow event types
export type ExploreEventType =
  | 'explore_view'
  | 'interest_submitted'
  | 'paths_generated'
  | 'path_selected'
  | 'signup_prompted'
  | 'explore_signup_completed'
  | 'alpha_awarded';

// All event types
export type EventType =
  | 'view'
  | 'signup_started'
  | 'signup_completed'
  | 'onboarding_completed'
  | ExploreEventType;

// LocalStorage keys
const VISITOR_ID_KEY = 'ta_visitor_id';
const QUESTION_VARIANT_KEY = 'ta_question_variant';
const EXPLORE_UI_VARIANT_KEY = 'ta_explore_variant';
const LEGACY_LANDING_VARIANT_KEY = 'ta_landing_variant'; // For historical data

/**
 * Generate a unique visitor ID
 */
function generateVisitorId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create a visitor ID (stored in localStorage)
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

// ===== Question Variant A/B Testing (PRIMARY) =====

/**
 * Get the assigned question variant for this visitor, or assign one randomly
 */
export function getQuestionVariant(): QuestionVariant {
  if (typeof window === 'undefined') return 'curious';

  let variant = localStorage.getItem(QUESTION_VARIANT_KEY) as QuestionVariant | null;

  if (!variant || !QUESTION_VARIANTS.includes(variant)) {
    // Randomly assign a variant with equal probability
    const randomIndex = Math.floor(Math.random() * QUESTION_VARIANTS.length);
    variant = QUESTION_VARIANTS[randomIndex];
    localStorage.setItem(QUESTION_VARIANT_KEY, variant);
  }

  return variant;
}

/**
 * Get the question variant index (0-3) for use in InterestCapture
 */
export function getQuestionVariantIndex(): number {
  if (typeof window === 'undefined') return 0;

  const stored = localStorage.getItem(QUESTION_VARIANT_KEY);
  if (stored !== null) {
    const index = QUESTION_VARIANTS.indexOf(stored as QuestionVariant);
    return index >= 0 ? index : 0;
  }

  // Assign and return random index
  const variant = getQuestionVariant();
  return QUESTION_VARIANTS.indexOf(variant);
}

/**
 * Set a specific question variant
 */
export function setQuestionVariant(variant: QuestionVariant): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUESTION_VARIANT_KEY, variant);
}

/**
 * Set question variant by index
 */
export function setQuestionVariantByIndex(index: number): void {
  if (typeof window === 'undefined') return;
  const variant = QUESTION_VARIANTS[index % QUESTION_VARIANTS.length];
  localStorage.setItem(QUESTION_VARIANT_KEY, variant);
}

// ===== Explore UI A/B Testing =====

/**
 * Get the assigned explore UI variant for this visitor (mindmap or list)
 */
export function getExploreVariant(): ExploreUIVariant {
  if (typeof window === 'undefined') return 'mindmap';

  let variant = localStorage.getItem(EXPLORE_UI_VARIANT_KEY) as ExploreUIVariant | null;

  if (!variant || !EXPLORE_UI_VARIANTS.includes(variant)) {
    // Weighted towards mindmap (70/30 split)
    const random = Math.random();
    variant = random < 0.7 ? 'mindmap' : 'list';
    localStorage.setItem(EXPLORE_UI_VARIANT_KEY, variant);
  }

  return variant;
}

/**
 * Set a specific explore UI variant
 */
export function setExploreVariant(variant: ExploreUIVariant): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EXPLORE_UI_VARIANT_KEY, variant);
}

// ===== Event Tracking =====

/**
 * Track an A/B test event
 */
export async function trackEvent(
  eventType: EventType,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const visitorId = getVisitorId();
    const questionVariant = getQuestionVariant();
    const uiVariant = getExploreVariant();

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        variant: questionVariant, // Primary variant for analytics
        eventType,
        metadata: {
          ...metadata,
          questionVariant,
          uiVariant,
        },
      }),
    });
  } catch (error) {
    // Silently fail - tracking shouldn't break the user experience
    console.error('Failed to track event:', error);
  }
}

/**
 * Track an explore flow event
 */
export async function trackExploreEvent(
  eventType: ExploreEventType,
  metadata?: Record<string, any>
): Promise<void> {
  return trackEvent(eventType, { ...metadata, flow: 'explore' });
}

/**
 * Track explore page view with question variant
 */
export function trackExploreView(): void {
  const questionVariant = getQuestionVariant();
  trackExploreEvent('explore_view', { questionVariant });
}

// ===== Legacy Functions (for backwards compatibility) =====

/**
 * @deprecated Use getQuestionVariant() instead
 * Get the assigned landing variant (kept for historical data)
 */
export function getAssignedVariant(): LandingVariant {
  if (typeof window === 'undefined') return 'screen-time';

  const variant = localStorage.getItem(LEGACY_LANDING_VARIANT_KEY) as LandingVariant | null;
  return variant && LANDING_VARIANTS.includes(variant) ? variant : 'screen-time';
}

/**
 * @deprecated Use setQuestionVariant() instead
 */
export function setVariant(variant: LandingVariant): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LEGACY_LANDING_VARIANT_KEY, variant);
}

/**
 * @deprecated Landing pages are archived
 */
export function trackLandingPageView(variant: LandingVariant): void {
  setVariant(variant);
  trackEvent('view', { legacyVariant: variant });
}

/**
 * @deprecated Use /explore directly
 */
export function getVariantUrl(): string {
  return '/explore';
}
