'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signOut } from '@teen-alpha/database';

interface SignOutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SignOutButton({ variant = 'outline', size = 'default', className }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <Button variant={variant} size={size} onClick={handleSignOut} className={className}>
      Sign Out
    </Button>
  );
}
