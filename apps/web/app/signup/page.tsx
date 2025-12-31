import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Teen Alpha
                    </h1>
                    <h2 className="mt-6 text-center text-x1 font-semibold tracking-tight text-gray-900 dark:text-gray-400">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Start building ambitious projects with adult mentorship and AI guidance.
                    </p>
                </div>

                <div className="bg-white py-8 px-6 rounded-xl shadow-sm">
                    <AuthForm mode="signup" />

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <Link href="/login" className="font-medium text-primary hover:text-primary/80">Already have an account? Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}