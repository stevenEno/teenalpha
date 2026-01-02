'use client';

import { useState } from 'react';
import { signIn, signUp } from '@teen-alpha/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthFormProps {
    mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'teen' | 'mentor' | 'parent' | 'admin'>('teen');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                await signUp(email, password, { 
                    full_name: fullName, 
                    role, 
                });
                setIsSuccess(true);

                setTimeout(() => {
                    router.push('/onboarding');
                }, 2000);
            } else {
                await signIn(email, password);
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess && mode === 'signup') {
        return (
            <Alert className="bg-green-50 border-green-200">
                <AlertDescription>Account created successfully! Redirecting to onboarding...</AlertDescription>
            </Alert>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {mode === 'signup' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="Your name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>I am a ...</Label>
                        <div className="grid grid-cols-3 gap-3">
                            <Button
                                type="button"
                                variant={role === 'teen' ? 'default' : 'outline'}
                                onClick={() => setRole('teen')}
                                className="w-full"
                            >
                                Teen
                            </Button>
                            <Button
                                type="button"
                                variant={role === 'mentor' ? 'default' : 'outline'}
                                onClick={() => setRole('mentor')}
                                className="w-full"
                            >
                                Mentor
                            </Button>
                            <Button
                                type="button"
                                variant={role === 'parent' ? 'default' : 'outline'}
                                onClick={() => setRole('parent')}
                                className="w-full"
                            >
                                Parent
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                {mode === 'signup' && (
                    <p className="text-sm text-gray-500">
                        Password must be at least 6 characters long
                    </p>
                )}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create Account'}
            </Button>
        </form>
    );
}