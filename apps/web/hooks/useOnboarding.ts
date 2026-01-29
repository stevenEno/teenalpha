'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@teen-alpha/database';
import type { Profile } from '@teen-alpha/database';

export type OnboardingStep = 'welcome' | 'basics' | 'upload' | 'analyzing';

interface UseOnboardingOptions {
  profile: Profile;
  hasSocialData: boolean;
  onComplete?: () => void;
}

export function useOnboarding({ profile, hasSocialData, onComplete }: UseOnboardingOptions) {
  const router = useRouter();

  // Determine initial step based on profile state
  const getInitialStep = (): OnboardingStep => {
    if (hasSocialData) return 'analyzing'; // Skip to analyzing if we have data
    if (profile.grade) return 'upload'; // Skip basics if grade is set
    return 'welcome';
  };

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(getInitialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [grade, setGrade] = useState<number>(profile.grade || 9);
  const [school, setSchool] = useState<string>(profile.school || '');

  const steps: OnboardingStep[] = ['welcome', 'basics', 'upload', 'analyzing'];
  const currentStepIndex = steps.indexOf(currentStep);

  const goToStep = useCallback((step: OnboardingStep) => {
    setError(null);
    setCurrentStep(step);
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  }, [currentStepIndex, steps]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  }, [currentStepIndex, steps]);

  const saveBasics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await updateProfile(profile.id, {
        grade,
        school,
      });
      goToStep('upload');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  }, [profile.id, grade, school, goToStep]);

  const completeOnboarding = useCallback(() => {
    if (onComplete) {
      onComplete();
    } else {
      router.push('/m/pathways');
    }
  }, [router, onComplete]);

  const skipUpload = useCallback(() => {
    // Skip to pathways without social data
    router.push('/m/pathways');
  }, [router]);

  return {
    // Step navigation
    currentStep,
    currentStepIndex,
    steps,
    goToStep,
    goNext,
    goBack,

    // State
    isLoading,
    error,
    setError,

    // Form values
    grade,
    setGrade,
    school,
    setSchool,

    // Actions
    saveBasics,
    completeOnboarding,
    skipUpload,

    // Profile data
    profile,
    hasSocialData,
  };
}
