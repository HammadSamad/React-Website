import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Stars from './Stars.jsx';

describe('Stars', () => {
  it('renders 5 star icons', () => {
    const { container } = render(<Stars value={3} />);
    const icons = container.querySelectorAll('svg');
    expect(icons).toHaveLength(5);
  });

  it('sets correct aria-label', () => {
    render(<Stars value={4} />);
    expect(screen.getByLabelText('4 out of 5')).toBeInTheDocument();
  });

  it('defaults to value 5', () => {
    render(<Stars />);
    expect(screen.getByLabelText('5 out of 5')).toBeInTheDocument();
  });
});
