import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-canvas">
      <Navbar />
      <main className="flex w-full flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
