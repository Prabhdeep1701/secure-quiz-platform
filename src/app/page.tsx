"use client";
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/auth/signin');
    } else if ((session.user as any).role === 'Teacher') {
      router.replace('/dashboard/teacher');
    } else if ((session.user as any).role === 'Student') {
      router.replace('/dashboard/student');
    }
  }, [session, status, router]);

  return null;
}
