// Mentor Pricing Types
export interface MentorPricing {
  id: string;
  mentor_id: string;
  hourly_rate: number; // cents
  currency: string;
  created_at: string;
  updated_at: string;
}

// Hour Package Types
export interface HourPackage {
  id: string;
  mentor_id: string;
  hours: number;
  price: number; // cents
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Hour Balance Types
export interface HourBalance {
  id: string;
  family_id: string;
  mentor_id: string;
  teen_id: string;
  balance_hours: number;
  total_purchased_hours: number;
  total_used_hours: number;
  created_at: string;
  updated_at: string;
}

// Session Types
export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  mentor_id: string;
  teen_id: string;
  family_id: string;
  status: SessionStatus;
  scheduled_at: string;
  duration_hours: number;
  notes: string | null;
  mentor_notes: string | null;
  cancelled_by: string | null;
  cancelled_reason: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

// Session with related profiles
export interface SessionWithProfiles extends Session {
  mentor: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
  teen: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
  family: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

// Payment Types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentType = 'hourly' | 'package' | 'subscription';

export interface Payment {
  id: string;
  family_id: string;
  mentor_id: string;
  teen_id: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number; // cents
  currency: string;
  hours_purchased: number;
  package_id: string | null;
  status: PaymentStatus;
  payment_type: PaymentType;
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

// Checkout Request Types
export interface CreateCheckoutRequest {
  mentor_id: string;
  teen_id: string;
  hours?: number; // For hourly purchases
  package_id?: string; // For package purchases
}

export interface CreateCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

// Balance Response Type
export interface BalanceResponse {
  balances: Array<{
    mentor_id: string;
    mentor_name: string;
    mentor_avatar: string | null;
    teen_id: string;
    teen_name: string;
    balance_hours: number;
    total_purchased: number;
    total_used: number;
  }>;
}

// Pricing Response Type
export interface PricingResponse {
  hourly_rate: number;
  hourly_rate_formatted: string;
  packages: Array<{
    id: string;
    hours: number;
    price: number;
    price_formatted: string;
    name: string;
    description: string | null;
    discount_percent: number;
  }>;
  mentor: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Session Create Request
export interface CreateSessionRequest {
  mentor_id: string;
  teen_id: string;
  scheduled_at: string;
  duration_hours: number;
  notes?: string;
}

// Session Update Request
export interface UpdateSessionRequest {
  status?: SessionStatus;
  mentor_notes?: string;
  cancelled_reason?: string;
}
