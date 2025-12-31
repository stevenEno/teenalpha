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

                <nav className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>Dashboard</Button>
                    {profile.role === 'teen' && (
                        <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>Projects</Button>
                    )}
                    {profile.role === 'mentor' && (
                        <Button variant="ghost" size="icon" onClick={() => router.push('/mentees')}>Mentees</Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => router.push('/profile')}>Profile</Button>
                    <Button variant="ghost" size="icon" onClick={handleSignOut}>Sign Out</Button>
                </nav>
            </div>
        </header>
    );
}