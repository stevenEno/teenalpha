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
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
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
                  onClick={() => router.push('/projects/discover')}
                >
                  ✨ Discover
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/profile/customize')}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  Customize
                </Button>

                {/* Mini-map toggle for users with explore paths */}
                {hasExplorePath && (
                  <Button
                    variant="ghost"
                    onClick={toggleMiniMap}
                    className={miniMapVisible ? 'bg-indigo-100 text-indigo-700' : ''}
                  >
                    <Map className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Path</span>
                  </Button>
                )}

                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/messages')}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Messages
                  </Button>
                  <MessageBadge count={totalUnread} />
                </div>
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