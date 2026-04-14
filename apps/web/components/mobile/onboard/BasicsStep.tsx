'use client';

import { MobileButton, MobileInput } from '@/components/mobile';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface BasicsStepProps {
  grade: number;
  school: string;
  onGradeChange: (grade: number) => void;
  onSchoolChange: (school: string) => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

const grades = [6, 7, 8, 9, 10, 11, 12];

export function BasicsStep({
  grade,
  school,
  onGradeChange,
  onSchoolChange,
  onContinue,
  onBack,
  isLoading,
  error,
}: BasicsStepProps) {
  const canContinue = school.trim().length > 0;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-500 mb-6 touch-target"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        <span>Back</span>
      </button>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Quick info about you
      </h1>
      <p className="text-gray-600 mb-8">
        This helps us personalize your experience.
      </p>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Grade Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What grade are you in?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {grades.map((g) => (
            <button
              key={g}
              onClick={() => onGradeChange(g)}
              className={`
                py-4 rounded-xl border-2 font-semibold text-base transition-all
                touch-target active:scale-[0.98]
                ${grade === g
                  ? 'border-[#FF6B35] bg-[#FF6B35]/5 text-[#FF6B35]'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {g}th
            </button>
          ))}
        </div>
      </div>

      {/* School Input */}
      <div className="mb-8">
        <MobileInput
          label="What school do you go to?"
          type="text"
          placeholder="Enter your school name"
          value={school}
          onChange={(e) => onSchoolChange(e.target.value)}
        />
      </div>

      {/* Continue Button */}
      <MobileButton
        fullWidth
        size="lg"
        onClick={onContinue}
        loading={isLoading}
        disabled={!canContinue}
        icon={<ArrowRight className="w-5 h-5" />}
      >
        Continue
      </MobileButton>
    </div>
  );
}
