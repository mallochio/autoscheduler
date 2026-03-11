import { render, screen } from '@testing-library/react';
import { RightPanel } from '@/components/right-panel';
import { describe, it, expect } from 'vitest';

describe('RightPanel', () => {
  it('renders "Priorities" heading', () => {
    render(<RightPanel />);

    expect(screen.getByRole('heading', { name: 'Priorities' })).toBeInTheDocument();
  });

  it('renders priority items', () => {
    render(<RightPanel />);

    expect(screen.getByText('Launch MVP')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Write Documentation')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority')).toBeInTheDocument();
  });

  it('renders "Tasks" heading', () => {
    render(<RightPanel />);

    expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
  });

  it('renders task checkboxes', () => {
    render(<RightPanel />);

    expect(screen.getByText('Review PRs')).toBeInTheDocument();
    expect(screen.getByText('Email Investors')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('checkboxes are unchecked by default', () => {
    render(<RightPanel />);

    const checkboxes = screen.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      expect(checkbox).not.toBeChecked();
    }
  });
});
