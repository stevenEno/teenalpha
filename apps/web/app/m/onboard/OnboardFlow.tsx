'use client';

import type { Profile } from '@teen-alpha/database';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useFileUpload } from '@/hooks/useFileUpload';
import { MobileLayout, StepIndicator } from '@/components/mobile';
import { WelcomeStep } from '@/components/mobile/onboard/WelcomeStep';
import { BasicsStep } from '@/components/mobile/onboard/BasicsStep';
import { UploadStep } from '@/components/mobile/onboard/UploadStep';
import { AnalyzingStep } from '@/components/mobile/onboard/AnalyzingStep';

interface OnboardFlowProps {
  profile: Profile;
  hasSocialData: boolean;
}

export function OnboardFlow({ profile, hasSocialData }: OnboardFlowProps) {
  const onboarding = useOnboarding({
    profile,
    hasSocialData,
  });

  const fileUpload = useFileUpload({
    onSuccess: () => {
      onboarding.goToStep('analyzing');
    },
  });

  const handleUploadComplete = () => {
    onboarding.completeOnboarding();
  };

  return (
    <MobileLayout>
      <div className="px-6 pt-8 pb-8">
        {/* Progress Indicator */}
        <StepIndicator
          steps={onboarding.steps}
          currentStep={onboarding.currentStepIndex}
          className="mb-8"
        />

        {/* Step Content */}
        {onboarding.currentStep === 'welcome' && (
          <WelcomeStep
            profileName={profile.full_name}
            onContinue={() => onboarding.goToStep('basics')}
          />
        )}

        {onboarding.currentStep === 'basics' && (
          <BasicsStep
            grade={onboarding.grade}
            school={onboarding.school}
            onGradeChange={onboarding.setGrade}
            onSchoolChange={onboarding.setSchool}
            onContinue={onboarding.saveBasics}
            onBack={() => onboarding.goToStep('welcome')}
            isLoading={onboarding.isLoading}
            error={onboarding.error}
          />
        )}

        {onboarding.currentStep === 'upload' && (
          <UploadStep
            selectedPlatform={fileUpload.selectedPlatform}
            onPlatformSelect={fileUpload.setSelectedPlatform}
            file={fileUpload.file}
            onFileSelect={fileUpload.handleFileSelect}
            onUpload={fileUpload.uploadFile}
            onSkip={onboarding.skipUpload}
            onBack={() => onboarding.goToStep('basics')}
            isUploading={fileUpload.isUploading}
            canUpload={fileUpload.canUpload}
            error={fileUpload.error}
          />
        )}

        {onboarding.currentStep === 'analyzing' && (
          <AnalyzingStep onComplete={handleUploadComplete} />
        )}
      </div>
    </MobileLayout>
  );
}
