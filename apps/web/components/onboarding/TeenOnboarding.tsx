'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Compass, Sparkles, ArrowRight, Gamepad2, Instagram } from 'lucide-react';
import { FoundingMentorCTA } from '@/components/cta';

interface TeenOnboardingProps {
  userName?: string;
  onComplete?: () => void;
}

type PathwayChoice = 'build' | 'discover' | 'identify' | null;

export function TeenOnboarding({ userName, onComplete }: TeenOnboardingProps) {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState<PathwayChoice>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const firstName = userName?.split(' ')[0] || 'there';

  const handlePathSelection = async (path: PathwayChoice) => {
    setSelectedPath(path);
    setIsNavigating(true);

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    switch (path) {
      case 'build':
        // They know what they want to build - go to project creation
        router.push('/projects/new');
        break;
      case 'discover':
        // They have an interest area - go to startup pathways
        // This will prompt them to upload data if needed, or generate pathways
        router.push('/dashboard/profile/data?focus=pathways');
        break;
      case 'identify':
        // They want to discover interests from their data
        router.push('/dashboard/profile/data?focus=upload');
        break;
    }

    onComplete?.();
  };

  const pathways = [
    {
      id: 'build' as const,
      icon: Rocket,
      title: 'Build Something Amazing',
      subtitle: 'I know what I want to create',
      description: 'You have a project idea buzzing in your head. Let AI help you break it down into achievable steps and guide you to completion.',
      cta: 'Start Building',
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'from-violet-50 to-purple-50',
      borderColor: 'border-violet-200 hover:border-violet-400',
      examples: ['An app', 'A game', 'A business', 'A creative project'],
    },
    {
      id: 'discover' as const,
      icon: Compass,
      title: 'Find Project Ideas',
      subtitle: 'I have interests but need direction',
      description: 'You know what excites you but need help finding the perfect project. We\'ll match your interests to real startup opportunities.',
      cta: 'Explore Ideas',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      examples: ['AI & Tech', 'Art & Design', 'Science', 'Sports & Gaming'],
    },
    {
      id: 'identify' as const,
      icon: Sparkles,
      title: 'Discover My Passions',
      subtitle: 'Help me figure out what excites me',
      description: 'Not sure what you\'re passionate about? Upload your social media or gaming data and our AI will reveal hidden interests you didn\'t know you had.',
      cta: 'Analyze My Data',
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200 hover:border-amber-400',
      examples: [
        { icon: Instagram, label: 'Instagram' },
        { icon: Gamepad2, label: 'Steam' },
      ],
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Hey {firstName}! <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let's turn your curiosity into something amazing.
            <br />
            <span className="text-gray-500">Where would you like to start?</span>
          </p>
        </div>

        {/* Pathway Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {pathways.map((pathway) => {
            const Icon = pathway.icon;
            const isSelected = selectedPath === pathway.id;
            const isDisabled = isNavigating && !isSelected;

            return (
              <Card
                key={pathway.id}
                className={`
                  relative overflow-hidden cursor-pointer transition-all duration-300
                  border-2 ${pathway.borderColor}
                  ${isSelected ? 'ring-2 ring-offset-2 ring-gray-900 scale-[1.02]' : ''}
                  ${isDisabled ? 'opacity-50 pointer-events-none' : 'hover:shadow-lg hover:scale-[1.01]'}
                `}
                onClick={() => !isNavigating && handlePathSelection(pathway.id)}
              >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-r ${pathway.gradient} p-6 text-white`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{pathway.title}</h2>
                      <p className="text-white/80 text-sm">{pathway.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className={`p-6 bg-gradient-to-b ${pathway.bgGradient}`}>
                  <p className="text-gray-600 mb-4 min-h-[72px]">
                    {pathway.description}
                  </p>

                  {/* Examples */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                      {pathway.id === 'identify' ? 'Supported platforms' : 'Examples'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pathway.id === 'identify' ? (
                        (pathway.examples as Array<{icon: any, label: string}>).map((example, i) => {
                          const ExampleIcon = example.icon;
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full text-sm text-gray-700 border"
                            >
                              <ExampleIcon className="w-3.5 h-3.5" />
                              {example.label}
                            </span>
                          );
                        })
                      ) : (
                        (pathway.examples as string[]).map((example, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-white rounded-full text-sm text-gray-600 border"
                          >
                            {example}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full bg-gradient-to-r ${pathway.gradient} hover:opacity-90 text-white`}
                    disabled={isNavigating}
                  >
                    {isSelected && isNavigating ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {pathway.cta}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 bg-gray-900 rounded-full" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Founding Mentor CTA */}
        <div className="mt-8 mb-6">
          <FoundingMentorCTA variant="featured" context="teen-onboarding" />
        </div>

        {/* Bottom note */}
        <p className="text-center text-gray-500 text-sm">
          Don't worry, you can always explore other options later from your dashboard.
        </p>
      </div>

      {/* Wave animation */}
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-10deg); }
        }
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
          transform-origin: 70% 70%;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
