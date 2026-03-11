import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { RightPanel } from '@/components/right-panel';

export const metadata: Metadata = {
  title: 'Auto Google Calendar Scheduler',
  description: 'Local-first auto-scheduling calendar for Google Calendar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased bg-zinc-50 text-zinc-900 flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
        <RightPanel />
      </body>
    </html>
  );
}
