'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signin } from '@/lib/actions/auth.actions';

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startDemo() {
      try {
        const res = await fetch('/api/auth/demo', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Erreur lors de la connexion démo');
          return;
        }
        const formData = new FormData();
        formData.set('email', data.email);
        formData.set('password', data.password);
        localStorage.setItem('cocorico-show-tour', 'true');
        const result = await signin(formData);
        if (result.error) {
          setError(result.error);
        } else {
          router.push('/today');
          router.refresh();
        }
      } catch {
        setError('Erreur lors de la connexion démo');
      }
    }
    startDemo();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-primary underline text-sm"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Préparation du restaurant démo...</p>
      </div>
    </div>
  );
}
