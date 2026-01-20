'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HourBalance {
  id: string;
  mentor_id: string;
  mentor_name: string;
  mentor_avatar: string | null;
  teen_id: string;
  teen_name: string;
  teen_avatar?: string | null;
  balance_hours: number;
  total_purchased: number;
  total_used: number;
}

interface HourBalanceCardProps {
  balance: HourBalance;
  onPurchaseMore?: () => void;
  onBookSession?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function HourBalanceCard({
  balance,
  onPurchaseMore,
  onBookSession,
  showActions = true,
  compact = false,
}: HourBalanceCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isLowBalance = balance.balance_hours <= 2;
  const hasBalance = balance.balance_hours > 0;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
            {balance.mentor_avatar ? (
              <img
                src={balance.mentor_avatar}
                alt={balance.mentor_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(balance.mentor_name)
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{balance.mentor_name}</p>
            <p className="text-xs text-gray-500">for {balance.teen_name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-bold ${isLowBalance ? 'text-orange-600' : 'text-green-600'}`}>
            {balance.balance_hours} hr{balance.balance_hours !== 1 ? 's' : ''}
          </p>
          {isLowBalance && hasBalance && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
              Low
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`p-4 ${isLowBalance && hasBalance ? 'border-orange-200 bg-orange-50' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium flex-shrink-0">
          {balance.mentor_avatar ? (
            <img
              src={balance.mentor_avatar}
              alt={balance.mentor_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(balance.mentor_name)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{balance.mentor_name}</h4>
            {isLowBalance && hasBalance && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Low Balance
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-2">For {balance.teen_name}</p>

          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-500">Available</p>
              <p className={`text-xl font-bold ${isLowBalance ? 'text-orange-600' : 'text-green-600'}`}>
                {balance.balance_hours}
              </p>
              <p className="text-xs text-gray-400">hours</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Purchased</p>
              <p className="text-lg font-semibold text-gray-700">{balance.total_purchased}</p>
              <p className="text-xs text-gray-400">hours</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Used</p>
              <p className="text-lg font-semibold text-gray-700">{balance.total_used}</p>
              <p className="text-xs text-gray-400">hours</p>
            </div>
          </div>

          {showActions && (
            <div className="flex gap-2">
              {hasBalance && onBookSession && (
                <Button size="sm" onClick={onBookSession}>
                  Book Session
                </Button>
              )}
              {onPurchaseMore && (
                <Button
                  size="sm"
                  variant={hasBalance ? 'outline' : 'default'}
                  onClick={onPurchaseMore}
                >
                  {hasBalance ? 'Purchase More' : 'Purchase Hours'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface HourBalanceListProps {
  balances: HourBalance[];
  onPurchaseMore?: (mentorId: string, teenId: string) => void;
  onBookSession?: (mentorId: string, teenId: string) => void;
  emptyMessage?: string;
}

export function HourBalanceList({
  balances,
  onPurchaseMore,
  onBookSession,
  emptyMessage = 'No hour balances yet. Purchase hours to get started.',
}: HourBalanceListProps) {
  if (balances.length === 0) {
    return (
      <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
        <p className="text-center text-gray-500">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {balances.map((balance) => (
        <HourBalanceCard
          key={balance.id}
          balance={balance}
          onPurchaseMore={
            onPurchaseMore
              ? () => onPurchaseMore(balance.mentor_id, balance.teen_id)
              : undefined
          }
          onBookSession={
            onBookSession
              ? () => onBookSession(balance.mentor_id, balance.teen_id)
              : undefined
          }
        />
      ))}
    </div>
  );
}
