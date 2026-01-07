'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signOut } from '@teen-alpha/database';
import type { Profile } from '@teen-alpha/database';

interface HeaderProps {
  profile: Profile;
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Teen Alpha
            </h1>
            <p className="text-sm text-gray-500">
              {profile.full_name} • {profile.role}
            </p>
          </div>

          <nav className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </Button>
            
            {profile.role === 'teen' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/projects')}
                >
                  Projects
                </Button>
                
                {profile.steam_id && (
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/projects/discover')}
                  >
                    ✨ Discover
                  </Button>
                )}
              </>
            )}
            
            {profile.role === 'mentor' && (
              <Button
                variant="ghost"
                onClick={() => router.push('/mentees')}
              >
                Mentees
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={() => router.push('/profile')}
            >
              Profile
            </Button>

            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}