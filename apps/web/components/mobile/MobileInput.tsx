'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface MobileInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full h-14 px-4 text-base rounded-xl border-2
            bg-white text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:border-[#FF6B35] focus:ring-0
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? 'border-red-500' : 'border-gray-200'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';
