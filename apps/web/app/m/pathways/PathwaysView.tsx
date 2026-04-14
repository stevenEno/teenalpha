'use client';

import { usePathways } from '@/hooks/usePathways';
import { MobileLayout, MobileButton, LoadingOverlay } from '@/components/mobile';
import { PathwayCardMobile } from '@/components/mobile/PathwayCardMobile';
import { Rocket, RefreshCw, Sparkles } from 'lucide-react';

interface PathwaysViewProps {
  autoGenerate?: boolean;
}

export function PathwaysView({ autoGenerate = false }: PathwaysViewProps) {
  const {
    pathways,
    interests,
    isLoading,
    isGenerating,
    choosingIndex,
    error,
    generatePathways,
    choosePathway,
    hasPathways,
  } = usePathways({ autoGenerate });

  // Loading state
  if (isLoading || isGenerating) {
    return (
      <LoadingOverlay
        message={isGenerating ? 'Generating your pathways...' : 'Loading...'}
        subMessage={isGenerating ? 'AI is finding the perfect matches for you' : undefined}
      />
    );
  }

  return (
    <MobileLayout>
      <div className="px-5 pt-8 pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Rocket className="w-8 h-8 text-[#FF6B35]" />
            <h1 className="text-2xl font-bold text-gray-900">
              Startup Pathways
            </h1>
          </div>
          <p className="text-gray-600">
            AI-powered career paths based on your interests
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
            <MobileButton
              variant="ghost"
              className="mt-2 text-red-600"
              onClick={generatePathways}
            >
              Try Again
            </MobileButton>
          </div>
        )}

        {/* No Pathways State */}
        {!hasPathways && !error && (
          <div className="text-center py-12">
            <Rocket className="w-16 h-16 text-[#FF6B35]/40 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Discover Your Startup Path
            </h2>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              We'll analyze your interests and create personalized career
              pathways connecting you to exciting opportunities.
            </p>
            <MobileButton
              size="lg"
              onClick={generatePathways}
              loading={isGenerating}
              icon={<Sparkles className="w-5 h-5" />}
            >
              Generate Pathways
            </MobileButton>
          </div>
        )}

        {/* Pathways List */}
        {hasPathways && (
          <>
            {/* Interests Summary */}
            {interests && interests.topInterests.length > 0 && (
              <div className="bg-[#FF6B35]/5 rounded-xl p-4 mb-6">
                <p className="text-sm text-[#FF6B35]">
                  <span className="font-medium">Based on your interests: </span>
                  {interests.topInterests.slice(0, 5).join(', ')}
                </p>
              </div>
            )}

            {/* Pathway Cards */}
            <div className="space-y-4 mb-6">
              {pathways.map((pathway, index) => (
                <PathwayCardMobile
                  key={index}
                  pathway={pathway}
                  index={index}
                  onChoose={() => choosePathway(index)}
                  isChoosing={choosingIndex === index}
                  disabled={choosingIndex !== null}
                />
              ))}
            </div>

            {/* Refresh Button */}
            <div className="text-center">
              <MobileButton
                variant="ghost"
                onClick={generatePathways}
                loading={isGenerating}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Generate New Pathways
              </MobileButton>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
