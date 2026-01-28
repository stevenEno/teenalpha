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
            
            {/* Teen Navigation */}
            {profile.role === 'teen' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/projects')}
                >
                  Projects
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => router.push('/projects/discover')}
                >
                  ✨ Discover
                </Button>
              </>
            )}
            
            {/* Parent Navigation */}
            {profile.role === 'parent' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/my-teens')}
                >
                  My Teens
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/recommend-mentor')}
                >
                  💼 Recommend Mentor
                </Button>
              </>
            )}
            
            {/* Mentor Navigation */}
            {profile.role === 'mentor' && (
              <Button
                variant="ghost"
                onClick={() => router.push('/mentees')}
              >
                Mentees
              </Button>
            )}

            {/* Admin Navigation */}
            {profile.role === 'admin' && (
              <Button
                variant="ghost"
                onClick={() => router.push('/admin')}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                Admin
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