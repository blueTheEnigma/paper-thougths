"use client";
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function JoinRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const ref = params.get('ref');
    
    // Persist referral code in localStorage
    if (ref && typeof window !== 'undefined') {
      localStorage.setItem('pt_ref_code', ref);
    }

    const targetUrl = params.toString() ? `/sign-up?${params.toString()}` : '/sign-up';
    router.replace(targetUrl);
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 size={32} className="text-burgundy animate-spin" />
        <h2 className="font-display text-2xl text-burgundy font-bold">Entering the Clubhouse...</h2>
        <p className="font-sans text-xs text-ink/60 uppercase tracking-widest">
          Redirecting to unified registration
        </p>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 size={32} className="text-burgundy animate-spin" />
      </main>
    }>
      <JoinRedirectContent />
    </Suspense>
  );
}
