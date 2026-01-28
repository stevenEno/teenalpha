// A/B Testing utilities for landing page experiments

export const LANDING_VARIANTS = ['screen-time', 'grow', 'leapfrog', 'purpose', 'craft'] as const;
export type LandingVariant = (typeof LANDING_VARIANTS)[number];

const VISITOR_ID_KEY = 'ta_visitor_id';
const VARIANT_KEY = 'ta_landing_variant';

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

/**
 * Get the assigned variant for this visitor, or assign one randomly
 */
export function getAssignedVariant(): LandingVariant {
  if (typeof window === 'undefined') return 'screen-time';

  let variant = localStorage.getItem(VARIANT_KEY) as LandingVariant | null;

  if (!variant || !LANDING_VARIANTS.includes(variant)) {
    // Randomly assign a variant
    const randomIndex = Math.floor(Math.random() * LANDING_VARIANTS.length);
    variant = LANDING_VARIANTS[randomIndex];
    localStorage.setItem(VARIANT_KEY, variant);
  }

  return variant;
}

/**
 * Set a specific variant (useful for direct URL visits)
 */
export function setVariant(variant: LandingVariant): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VARIANT_KEY, variant);
}

/**
 * Track an A/B test event
 */
export async function trackEvent(
  eventType: 'view' | 'signup_started' | 'signup_completed' | 'onboarding_completed',
  variant?: LandingVariant,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const visitorId = getVisitorId();
    const assignedVariant = variant || getAssignedVariant();

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        variant: assignedVariant,
        eventType,
        metadata,
      }),
    });
  } catch (error) {
    // Silently fail - tracking shouldn't break the user experience
    console.error('Failed to track event:', error);
  }
}

/**
 * Track a page view for a landing page variant
 */
export function trackLandingPageView(variant: LandingVariant): void {
  setVariant(variant); // Remember this variant for the visitor
  trackEvent('view', variant);
}

/**
 * Get the URL for the assigned variant's landing page
 */
export function getVariantUrl(): string {
  const variant = getAssignedVariant();
  return `/${variant}`;
}
