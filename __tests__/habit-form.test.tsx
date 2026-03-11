import { render, screen, fireEvent } from '@testing-library/react';
import { HabitForm } from '@/components/habit-form';
import { describe, it, expect } from 'vitest';

describe('HabitForm', () => {
  it('renders all form fields', () => {
    render(<HabitForm />);

    expect(screen.getByLabelText('Habit Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority Level')).toBeInTheDocument();
    expect(screen.getByLabelText('Earliest Start Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Latest End Time')).toBeInTheDocument();
  });

  it('has correct default values', () => {
    render(<HabitForm />);

    expect(screen.getByLabelText('Duration (minutes)')).toHaveValue(45);
    expect(screen.getByLabelText('Earliest Start Time')).toHaveValue('11:30');
    expect(screen.getByLabelText('Latest End Time')).toHaveValue('13:30');
  });

  it('priority select has all four options', () => {
    render(<HabitForm />);

    const select = screen.getByLabelText('Priority Level');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(4);
    expect(options[0]).toHaveValue('critical');
    expect(options[1]).toHaveValue('high');
    expect(options[2]).toHaveValue('medium');
    expect(options[3]).toHaveValue('low');
  });

  it('renders submit button with "Save Habit" text', () => {
    render(<HabitForm />);

    const button = screen.getByRole('button', { name: 'Save Habit' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('form submission does not cause page navigation', () => {
    render(<HabitForm />);

    const form = screen.getByRole('button', { name: 'Save Habit' }).closest('form')!;
    const submitEvent = fireEvent.submit(form);

    // fireEvent.submit returns false when preventDefault was called
    expect(submitEvent).toBe(false);
  });
});
