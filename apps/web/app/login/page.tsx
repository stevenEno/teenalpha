import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Teen Alpha
                    </h1>
                    <h2 className="mt-6 text-center text-x1 font-semibold tracking-tight text-gray-00 dark:text-gray-400">
                        Sign in to your account
                    </h2>
                </div>

                <div className="mt-8 bg-white py-8 px-6 rounded-xl shadow-sm">
                    <AuthForm mode="login" />

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <Link href="/signup" className="font-medium text-primary hover:text-primary/80">Don't have an account? Sign up</Link>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <Link href="auth/forgot-password" className="font-medium text-primary hover:text-primary/80">Forgot your password?</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}