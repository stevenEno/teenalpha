'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Zap, Calendar, ArrowRight, Sparkles, Code, Bot } from 'lucide-react';
import Link from 'next/link';

type CTAVariant = 'featured' | 'compact' | 'banner' | 'modal' | 'inline';

interface FoundingMentorCTAProps {
  variant?: CTAVariant;
  context?: string; // For analytics: 'dashboard', 'post-signup', 'project', etc.
  onClose?: () => void;
  className?: string;
}

// Booking link - replace with actual Calendly/Cal.com link
const BOOKING_URL = 'https://calendly.com/steveneno/teen-alpha-coaching';

// Track CTA interactions
async function trackCTAClick(context: string, action: string) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'founding_mentor_cta',
        metadata: { context, action },
      }),
    });
  } catch {
    // Silent fail
  }
}

export function FoundingMentorCTA({
  variant = 'featured',
  context = 'unknown',
  onClose,
  className = '',
}: FoundingMentorCTAProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    trackCTAClick(context, 'click');
  };

  // Featured variant - Large card for dashboard/prominent placement
  if (variant === 'featured') {
    return (
      <motion.div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Accent glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#FF6B35]/50/20 rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            FOUNDING MENTOR
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Content */}
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">
                1-on-1 Coaching with Steven Eno
              </h3>
              <p className="text-slate-300 text-sm mb-4">
                Get personalized guidance from Teen Alpha's founding engineer. Learn to leverage AI tools, build your first viable business, and set up your technical infrastructure at home.
              </p>

              {/* Value props */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { icon: Bot, text: 'AI-powered workflows' },
                  { icon: Code, text: 'Technical setup help' },
                  { icon: Rocket, text: 'First business launch' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <item.icon className="w-4 h-4 text-amber-400" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Book a Free Session
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Avatar/Visual */}
            <div className="hidden sm:flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-lg">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">Forward Deployed<br/>Engineer</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Compact variant - Smaller sidebar/inline placement
  if (variant === 'compact') {
    return (
      <motion.div
        className={`bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white ${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">1-on-1 Coaching</p>
            <p className="text-xs text-slate-400">with Steven Eno</p>
          </div>
        </div>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Book Free Session
        </a>
      </motion.div>
    );
  }

  // Banner variant - Sticky top banner
  if (variant === 'banner') {
    return (
      <motion.div
        className={`bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white py-2 px-4 ${className}`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm font-medium">
              <span className="hidden sm:inline">Get 1-on-1 coaching with our founding engineer. </span>
              <span className="font-bold">Book a free session with Steven Eno</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              className="flex items-center gap-1 bg-white text-amber-600 font-semibold text-sm px-3 py-1 rounded-full hover:bg-amber-50 transition-colors"
            >
              Book Now
              <ArrowRight className="w-3 h-3" />
            </a>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Inline variant - Text-based inline mention
  if (variant === 'inline') {
    return (
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-medium transition-colors ${className}`}
      >
        <Zap className="w-4 h-4" />
        Get 1-on-1 help from Steven
        <ArrowRight className="w-3 h-3" />
      </a>
    );
  }

  // Modal variant - Full screen modal for key moments
  if (variant === 'modal') {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#FF6B35]/50/30 rounded-full blur-xl" />

              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  <Sparkles className="w-3 h-3" />
                  EXCLUSIVE OFFER
                </div>

                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-lg mb-4">
                  <Zap className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-2xl font-bold mb-2">
                  Ready to Build Your First Business?
                </h2>
                <p className="text-slate-300 text-sm">
                  Get 1-on-1 coaching from Teen Alpha's founding engineer
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {[
                  {
                    icon: Bot,
                    title: 'AI-Powered Workflows',
                    desc: 'Learn to use ChatGPT, Claude, and other AI tools to 10x your productivity',
                  },
                  {
                    icon: Code,
                    title: 'Technical Setup at Home',
                    desc: 'Get your development environment, tools, and systems set up correctly',
                  },
                  {
                    icon: Rocket,
                    title: 'Launch Your First Business',
                    desc: 'Turn your idea into a real, revenue-generating business in 30 days',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                <Calendar className="w-5 h-5" />
                Book Your Free Session
                <ArrowRight className="w-5 h-5" />
              </a>

              <p className="text-center text-xs text-gray-500 mt-4">
                Limited availability. Book now to secure your spot.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}

// Hook to manage modal state
export function useFoundingMentorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const open = () => {
    setIsOpen(true);
    setHasShown(true);
  };

  const close = () => setIsOpen(false);

  // Show once per session
  const showOnce = () => {
    if (!hasShown) {
      open();
    }
  };

  return { isOpen, open, close, showOnce, hasShown };
}
