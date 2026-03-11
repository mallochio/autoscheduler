'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ListTodo, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Planner', href: '/', icon: Calendar },
  { name: 'Priorities', href: '/priorities', icon: ListTodo },
  { name: 'Stats', href: '/stats', icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col h-full shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-semibold tracking-tight">Auto Scheduler</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
