'use client';

import { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function MobileLayout({ children, footer, className = '' }: MobileLayoutProps) {
  return (
    <div className={`min-h-screen-safe flex flex-col bg-white ${className}`}>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      {footer && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 pb-safe">
          {footer}
        </div>
      )}
    </div>
  );
}
