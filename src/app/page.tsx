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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-stone-50 to-amber-200">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
          {/* Accent Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100/80 to-teal-50/60 rounded-full flex items-center justify-center mb-6 shadow-sm backdrop-blur-sm">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Quiz Platform</h1>
          <p className="text-center text-gray-600 mb-6">
            Welcome to the secure quiz platform. Please sign in to continue.
          </p>
          {skipAuth && (
            <p className="text-center text-yellow-600 text-sm mb-4">
              Authentication system unavailable. Please sign in manually.
            </p>
          )}
          <div className="w-full space-y-4 mt-2">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-base font-semibold text-white bg-purple-500 hover:bg-purple-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-base font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-300"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
