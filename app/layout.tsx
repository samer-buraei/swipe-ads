import type { Metadata } from 'next';
import { Fraunces, Sora } from 'next/font/google';
import './globals.css';
import { Providers } from '@/app/providers';
import { AppShell } from '@/components/layout/AppShell';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const sora = Sora({
  variable: '--font-body',
  subsets: ['latin'],
});

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SwipeMarket — Oglasi na novi način',
  description: 'Kupi i prodaj listanjem kao na Tinderu',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="sr">
      <body className={`${sora.variable} ${fraunces.variable} antialiased`}>
        <Providers>
          <AppShell user={user}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
