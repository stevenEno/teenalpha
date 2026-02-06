'use client';

import { useEffect } from 'react';
import { trackLandingPageView, type LandingVariant } from '@/lib/ab-testing';

interface TrackLandingViewProps {
  variant: LandingVariant;
}

export function TrackLandingView({ variant }: TrackLandingViewProps) {
  useEffect(() => {
    trackLandingPageView(variant);
  }, [variant]);

  return null; // This component doesn't render anything
}
