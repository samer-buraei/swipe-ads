import type { Metadata } from 'next';
import { Fraunces, Sora } from 'next/font/google';
import './globals.css';
import { Providers } from '@/app/providers';
import { AppShell } from '@/components/layout/AppShell';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body className={`${sora.variable} ${fraunces.variable} antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
