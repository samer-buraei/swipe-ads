import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-12">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 animate-fade-in">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
