'use client';

import { useState, useEffect } from 'react';
import { FoundingMentorCTA, useFoundingMentorModal } from '@/components/cta';

interface FoundingMentorWidgetProps {
  showModal?: boolean;
  context?: string;
}

export function FoundingMentorWidget({ showModal = false, context = 'dashboard' }: FoundingMentorWidgetProps) {
  const modal = useFoundingMentorModal();
  const [dismissed, setDismissed] = useState(false);

  // Check if banner was dismissed in this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('founding_mentor_banner_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  // Show modal on mount if requested and not already shown
  useEffect(() => {
    if (showModal) {
      modal.showOnce();
    }
  }, [showModal, modal]);

  const handleDismissBanner = () => {
    setDismissed(true);
    sessionStorage.setItem('founding_mentor_banner_dismissed', 'true');
  };

  return (
    <>
      {/* Featured CTA Card */}
      <FoundingMentorCTA variant="featured" context={context} className="mb-6" />

      {/* Modal (if triggered) */}
      {modal.isOpen && (
        <FoundingMentorCTA variant="modal" context={context} onClose={modal.close} />
      )}
    </>
  );
}

// Banner version for page headers
export function FoundingMentorBanner({ context = 'page' }: { context?: string }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('founding_mentor_banner_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('founding_mentor_banner_dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <FoundingMentorCTA variant="banner" context={context} onClose={handleDismiss} />
  );
}
