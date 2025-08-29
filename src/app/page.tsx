
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to the dashboard.
        router.replace('/dashboard');
      } else {
        // User is signed out, redirect to the login page.
        router.replace('/login');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <Loader className="w-16 h-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  );
}
