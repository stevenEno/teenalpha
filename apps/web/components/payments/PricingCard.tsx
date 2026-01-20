'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Package {
  id: string;
  hours: number;
  price: number;
  price_formatted: string;
  name: string;
  description: string | null;
  discount_percent: number;
  savings_formatted?: string;
}

interface PricingCardProps {
  hourlyRate: number;
  hourlyRateFormatted: string;
  packages: Package[];
  onSelectHourly: (hours: number) => void;
  onSelectPackage: (packageId: string) => void;
  loading?: boolean;
}

export function PricingCard({
  hourlyRate,
  hourlyRateFormatted,
  packages,
  onSelectHourly,
  onSelectPackage,
  loading = false,
}: PricingCardProps) {
  return (
    <div className="space-y-4">
      {/* Hourly Rate */}
      <Card className="p-4 border-2 hover:border-blue-500 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold">Pay Per Hour</h4>
            <p className="text-2xl font-bold text-blue-600">{hourlyRateFormatted}/hr</p>
          </div>
          <Badge variant="outline">Flexible</Badge>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Purchase individual hours as needed. No commitment required.
        </p>
        <div className="flex gap-2">
          {[1, 2, 3].map((hours) => (
            <Button
              key={hours}
              variant="outline"
              size="sm"
              onClick={() => onSelectHourly(hours)}
              disabled={loading}
              className="flex-1"
            >
              {hours} hr{hours > 1 ? 's' : ''}
            </Button>
          ))}
        </div>
      </Card>

      {/* Packages */}
      {packages.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Hour Packages (Save More)</h4>
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`p-4 border-2 hover:border-green-500 transition-colors ${
                pkg.discount_percent >= 15 ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{pkg.name}</h4>
                    {pkg.discount_percent > 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        Save {pkg.discount_percent}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-green-600">{pkg.price_formatted}</p>
                  {pkg.savings_formatted && (
                    <p className="text-sm text-green-600">You save {pkg.savings_formatted}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium">{pkg.hours} hours</p>
                  <p className="text-sm text-gray-500">
                    ${(pkg.price / 100 / pkg.hours).toFixed(0)}/hr
                  </p>
                </div>
              </div>
              {pkg.description && (
                <p className="text-sm text-gray-500 mb-3">{pkg.description}</p>
              )}
              <Button
                onClick={() => onSelectPackage(pkg.id)}
                disabled={loading}
                className="w-full"
                variant={pkg.discount_percent >= 15 ? 'default' : 'outline'}
              >
                {pkg.discount_percent >= 15 ? 'Best Value - Buy Now' : 'Select Package'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
