'use client';

import { ReactNode } from 'react';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function MobileCard({
  children,
  className = '',
  onClick,
  variant = 'default'
}: MobileCardProps) {
  const variants = {
    default: 'bg-gray-50 border border-gray-100',
    outlined: 'bg-white border-2 border-gray-200',
    elevated: 'bg-white shadow-lg',
  };

  return (
    <div
      className={`
        p-5 rounded-2xl
        ${variants[variant]}
        ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
