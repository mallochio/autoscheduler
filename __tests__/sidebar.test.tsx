import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
  });

  it('renders "Auto Scheduler" title', () => {
    render(<Sidebar />);
    expect(screen.getByText('Auto Scheduler')).toBeInTheDocument();
  });

  it('renders all three nav items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Planner')).toBeInTheDocument();
    expect(screen.getByText('Priorities')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });

  it('marks Planner as active when pathname is "/"', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<Sidebar />);
    const link = screen.getByText('Planner').closest('a');
    expect(link).toHaveClass('bg-zinc-100');
  });

  it('marks Priorities as active when pathname is "/priorities"', () => {
    vi.mocked(usePathname).mockReturnValue('/priorities');
    render(<Sidebar />);
    const link = screen.getByText('Priorities').closest('a');
    expect(link).toHaveClass('bg-zinc-100');
  });

  it('marks Stats as active when pathname is "/stats"', () => {
    vi.mocked(usePathname).mockReturnValue('/stats');
    render(<Sidebar />);
    const link = screen.getByText('Stats').closest('a');
    expect(link).toHaveClass('bg-zinc-100');
  });

  it('applies text-zinc-600 to non-active links', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<Sidebar />);
    const prioritiesLink = screen.getByText('Priorities').closest('a');
    const statsLink = screen.getByText('Stats').closest('a');
    expect(prioritiesLink).toHaveClass('text-zinc-600');
    expect(statsLink).toHaveClass('text-zinc-600');
  });

  it('renders links with correct href attributes', () => {
    render(<Sidebar />);
    expect(screen.getByText('Planner').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Priorities').closest('a')).toHaveAttribute('href', '/priorities');
    expect(screen.getByText('Stats').closest('a')).toHaveAttribute('href', '/stats');
  });
});
