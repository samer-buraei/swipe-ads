'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoEmail, setDemoEmail] = useState('demo@swipemarket.rs');

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch {
      setError('Greška pri prijavi preko Google naloga');
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setIsLoading(true);

    // In demo mode, just redirect to home — the tRPC context
    // auto-creates a demo user when DEMO_MODE=true
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center h-16 w-16 rounded-[1.5rem] bg-primary text-primary-foreground shadow-2xl hover:scale-105 transition-transform mb-6">
            <span className="font-serif text-3xl font-bold">S</span>
          </Link>
          <h1 className="font-serif text-4xl font-bold tracking-tight">Dobrodošli nazad</h1>
          <p className="text-muted-foreground text-lg">Prijavite se da nastavite</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[2.5rem] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.05)] border border-black/5"
        >
          <div className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-2xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Demo Login */}
            <div className="space-y-4">
              <div className="text-center">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Demo režim
                </span>
              </div>

              <Input
                type="email"
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                placeholder="demo@swipemarket.rs"
              />

              <Button
                type="button"
                size="lg"
                className="w-full text-base"
                disabled={isLoading}
                onClick={handleDemoSignIn}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Uđi kao demo korisnik <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ili</span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full text-base"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Nastavi sa Google <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">Nemate nalog? </span>
            <Link href="/register" className="font-bold text-primary hover:underline">
              Registrujte se
            </Link>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground/50 max-w-xs mx-auto">
          Demo režim omogućava testiranje bez baze podataka.
        </p>
      </div>
    </div>
  );
}
