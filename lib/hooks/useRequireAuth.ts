'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!isMounted) return;

        if (!user) {
          setUser(null);
          setIsLoading(false);
          router.push('/login');
          return;
        }

        setUser(user);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setUser(null);
        setIsLoading(false);
        router.push('/login');
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  return { user, isLoading };
}
