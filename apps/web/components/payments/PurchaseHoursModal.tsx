'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PricingCard } from './PricingCard';

interface Teen {
  id: string;
  full_name: string | null;
}

interface Mentor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Package {
  id: string;
  hours: number;
  price: number;
  price_formatted: string;
  name: string;
  description: string | null;
  discount_percent: number;
  savings_formatted: string;
}

interface PricingData {
  hourly_rate: number;
  hourly_rate_formatted: string;
  packages: Package[];
  mentor: Mentor;
}

interface PurchaseHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string;
  teen: Teen;
  onPurchaseComplete?: () => void;
}

export function PurchaseHoursModal({
  isOpen,
  onClose,
  mentorId,
  teen,
  onPurchaseComplete,
}: PurchaseHoursModalProps) {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && mentorId) {
      fetchPricing();
    }
  }, [isOpen, mentorId]);

  async function fetchPricing() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/mentor-pricing/${mentorId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pricing');
      }

      setPricing(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(hours?: number, packageId?: string) {
    setPurchasing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentor_id: mentorId,
          teen_id: teen.id,
          hours,
          package_id: packageId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Stripe checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err: any) {
      setError(err.message);
      setPurchasing(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Mentoring Hours</DialogTitle>
          <DialogDescription>
            For {teen.full_name || 'your teen'} with {pricing?.mentor.full_name || 'mentor'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg" />
            <div className="h-32 bg-gray-200 rounded-lg" />
          </div>
        ) : pricing ? (
          <PricingCard
            hourlyRate={pricing.hourly_rate}
            hourlyRateFormatted={pricing.hourly_rate_formatted}
            packages={pricing.packages}
            onSelectHourly={(hours) => handlePurchase(hours)}
            onSelectPackage={(packageId) => handlePurchase(undefined, packageId)}
            loading={purchasing}
          />
        ) : (
          <p className="text-gray-500 text-center py-8">
            Unable to load pricing information.
          </p>
        )}

        {purchasing && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Redirecting to checkout...</span>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={purchasing}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
