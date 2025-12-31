'use client';

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword } from '@teen-alpha/database';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            await resetPassword(email);
            setSuccess('A password reset email has been sent to your email address.');
        } catch (error) {
            setError('Failed to send password reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="bg-white py-8 px-6 rounded-xl shadow-sm">
                        <Alert className="bg-green-50 border-green-200 text-green-800">
                            <AlertDescription className="text-green-800">
                                A password reset email has been sent to your email address.
                            </AlertDescription>
                        </Alert>
                        <div className="mt-6 text-center text-sm text-gray-500">
                            <Link href="/login" className="font-medium text-primary hover:text-primary/80">Back to login</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white py-8 px-6 rounded-xl shadow-sm">
                    <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Reset Your Password
                    </h1>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Enter your email address below and we'll send you a link to reset your password.
                    </p>
                </div>
                <div className="bg-white py-8 px-6 rounded-xl shadow-sm">
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Sending reset email...' : 'Reset Password'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        <Link href="/login" className="font-medium text-primary hover:text-primary/80">Back to login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}