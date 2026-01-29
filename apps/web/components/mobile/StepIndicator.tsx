'use client';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className = '' }: StepIndicatorProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-2">
        {steps.map((_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-300
                ${index === currentStep
                  ? 'bg-indigo-600 scale-125'
                  : index < currentStep
                    ? 'bg-indigo-400'
                    : 'bg-gray-200'
                }
              `}
            />
            {index < steps.length - 1 && (
              <div
                className={`
                  w-8 h-0.5 ml-2 transition-colors duration-300
                  ${index < currentStep ? 'bg-indigo-400' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
