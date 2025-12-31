'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@teen-alpha/database';
import type { Profile } from '@teen-alpha/database';

interface OnboardingFormProps {
    initialProfile: Profile;
}

export function OnboardingForm({ initialProfile }: OnboardingFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Teen fields
    const [grade, setGrade] = useState<number>(initialProfile.grade || 9);
    const [school, setSchool] = useState<string>(initialProfile.school || '');
    const [bio, setBio] = useState<string>(initialProfile.bio || '');

    // Mentor fields
    const [expertise, setExpertise] = useState<string>(initialProfile.expertise?.join(',') || '');
    const [linkedinUrl, setLinkedinUrl] = useState<string>(initialProfile.linkedin_url || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const updates: Partial<Profile> = {};

            if (initialProfile.role === 'teen') {
                updates.grade = grade;
                updates.school = school;
                updates.bio = bio;
            } else if (initialProfile.role === 'mentor') {
                updates.expertise = expertise.split(',').map(e => e.trim()).filter(Boolean);
                updates.linkedin_url = linkedinUrl;
                updates.bio = bio;
            } else if (initialProfile.role === 'parent') {
                // Parents might just need to verify info
                updates.bio = bio;
            }
            await updateProfile(initialProfile.id, updates);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <h2 className="text-lg font-bold">
                    Complete Your {initialProfile.role.charAt(0).toUpperCase() + initialProfile.role.slice(1)} Profile
                </h2>
                <p className="text-gray-600">
                    Tell us a bit more about yourself to get started.
                </p>
            </div>

            {initialProfile.role === 'teen' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="grade">Grade</Label>
                        <select id="grade" value={grade} onChange={(e) => setGrade(parseInt(e.target.value))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        required
                        >
                            {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                                <option key={grade} value={grade}>Grade {grade}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="school">School</Label>
                        <Input id="school" type="text" value={school} onChange={(e) => setSchool(e.target.value)} required />
                    </div>
                </>
            )}
            {initialProfile.role === 'mentor' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="expertise">Areas of Expertise</Label>
                        <Input id="expertise" type="text" placeholder = "e.g. Coding, Robotics, Business" value={expertise} onChange={(e) => setExpertise(e.target.value)} required />
                        <p className="text-sm text-gray-500">Separate each expertise with a comma</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="linkedinUrl">LinkedIn Profile URL (optional)</Label>
                        <Input id="linkedinUrl" type="url" placeholder = "https://www.linkedin.com/in/your-name" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                    </div>
                </>
            )}

            <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                    id="bio"
                    placeholder = {
                        initialProfile.role === 'teen'
                            ? "Tell us about your interests and what you want to build..."
                            :initialProfile.role === 'mentor'
                            ? "Share your background and what you can help teens with..."
                            : "Tell us about your family..."
                    }
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2"
                />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Saving...' : 'Continue to Dashboard'}
            </Button>
        </form>
    );
}