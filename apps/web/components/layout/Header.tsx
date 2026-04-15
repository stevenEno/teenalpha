'use client';

import { useRouter } from 'next/navigation';
import { MessageSquare, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageBadge } from '@/components/messaging/MessageBadge';
import { useChats, useMiniMap } from '@/hooks';
import { signOut } from '@teen-alpha/database';
import type { Profile } from '@teen-alpha/database';

interface HeaderProps {
  profile: Profile;
  hasExplorePath?: boolean;
}

export function Header({ profile, hasExplorePath = false }: HeaderProps) {
  const router = useRouter();
  const { totalUnread } = profile.role === 'teen' ? useChats() : { totalUnread: 0 };
  const { isVisible: miniMapVisible, toggle: toggleMiniMap } = useMiniMap();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'Avatar'}
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-sm font-semibold text-[#FF6B35]">
                {profile.full_name?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Teen Alpha
              </h1>
              <p className="text-sm text-gray-500">
                {profile.full_name} • {profile.role}
              </p>
            </div>
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
                  onClick={() => router.push('/dashboard/pathway')}
                >
                  Pathway
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => router.push('/map')}
                >
                  <Map className="w-4 h-4 mr-1" />
                  Map
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

                <Button
                  variant="ghost"
                  onClick={() => router.push('/map')}
                >
                  <Map className="w-4 h-4 mr-1" />
                  Map
                </Button>
              </>
            )}
            
            {/* Mentor Navigation */}
            {profile.role === 'mentor' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/mentees')}
                >
                  Mentees
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/map')}
                >
                  <Map className="w-4 h-4 mr-1" />
                  Map
                </Button>
              </>
            )}

            {/* Admin Navigation */}
            {profile.role === 'admin' && (
              <Button
                variant="ghost"
                onClick={() => router.push('/admin')}
                className="text-[#FF6B35] hover:text-[#FF6B35] hover:bg-[#FF6B35]/5"
              >
                Admin
              </Button>
            )}

            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}