'use client';

import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
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
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Teen Alpha</h1>
                    <p className="text-sm text-muted-foreground">
                        {profile.full_name} ({profile.role})
                    </p>
                </div>

                <nav className="flex items-center gap-6">
                    <Button variant="outline" size="default" onClick={() => router.push('/dashboard')} className="rounded-lg shadow-sm">
                        Dashboard
                    </Button>
                    {profile.role === 'teen' && (
                        <Button variant="secondary" size="default" onClick={() => router.push('/projects')} className="rounded-full">
                            Projects
                        </Button>
                    )}
                    {profile.role === 'mentor' && (
                        <Button variant="secondary" size="default" onClick={() => router.push('/mentees')} className="rounded-full">
                            Mentees
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => router.push('/profile')} className="rounded-md">
                        Profile
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-md border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40">
                        Sign Out
                    </Button>
                </nav>
            </div>
        </header>
    );
}