'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignUp = async () => {
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
      setError('Greška pri registraciji preko Google naloga');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center h-16 w-16 rounded-[1.5rem] bg-secondary text-foreground hover:bg-secondary/80 transition-colors mb-6">
            <span className="font-serif text-3xl font-bold">S</span>
          </Link>
          <h1 className="font-serif text-4xl font-bold tracking-tight">Napravi nalog</h1>
          <p className="text-muted-foreground text-lg">Registracija preko Google naloga</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[2.5rem] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.05)] border border-black/5"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleGoogleSignUp();
            }}
            className="space-y-5"
          >
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-2xl text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full text-base mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Nastavi sa Google <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">Već imate nalog? </span>
            <Link href="/login" className="font-bold text-primary hover:underline">
              Prijavite se
            </Link>
          </div>
        </motion.div>
        <p className="text-center text-xs text-muted-foreground/50 max-w-xs mx-auto">
          Registracija je dostupna samo putem Google naloga.
        </p>
      </div>
    </div>
  );
}
