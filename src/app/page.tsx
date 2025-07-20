"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/ui/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [skipAuth, setSkipAuth] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure the app is fully loaded
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // If auth loading takes too long, skip authentication
    if (authLoading && isReady) {
      const skipTimer = setTimeout(() => {
        setSkipAuth(true);
      }, 3000);
      return () => clearTimeout(skipTimer);
    }
  }, [authLoading, isReady]);

  useEffect(() => {
    if (!isReady || authLoading || skipAuth) return;
    
    if (user && userRole) {
      console.log('User authenticated, role:', userRole);
      // Add a small delay to ensure role is properly set
      const redirectTimer = setTimeout(() => {
        if (userRole === 'Teacher') {
          console.log('Redirecting to teacher dashboard');
          router.replace('/dashboard/teacher');
        } else if (userRole === 'Student') {
          console.log('Redirecting to student dashboard');
          router.replace('/dashboard/student');
        }
      }, 500); // 500ms delay

      return () => clearTimeout(redirectTimer);
    }
  }, [user, userRole, router, isReady, skipAuth, authLoading]);

  // Show loading state while auth is loading (but not too long)
  if (authLoading && !skipAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Platform</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated or if we're skipping auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Quiz Platform
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Welcome to the secure quiz platform. Please sign in to continue.
          </p>
          {skipAuth && (
            <p className="text-center text-yellow-600 text-sm mb-4">
              Authentication system unavailable. Please sign in manually.
            </p>
          )}
        </div>
        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
