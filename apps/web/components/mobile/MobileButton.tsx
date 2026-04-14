'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface MobileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'default' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'default',
    fullWidth = false,
    loading = false,
    icon,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const baseStyles = 'touch-target inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary: 'bg-[#FF6B35] text-white hover:bg-[#E85A24] active:bg-[#D54A14]',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
      outline: 'bg-transparent border-2 border-gray-200 text-gray-900 hover:border-gray-300 active:bg-gray-50',
    };

    const sizes = {
      default: 'min-h-[48px] px-6 text-base',
      lg: 'min-h-[52px] px-8 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : icon ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

MobileButton.displayName = 'MobileButton';
