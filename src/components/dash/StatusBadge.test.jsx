import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../dash/StatusBadge.jsx';

describe('StatusBadge', () => {
  it('renders with mapped label for known status', () => {
    render(<StatusBadge status="available" />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders with custom label override', () => {
    render(<StatusBadge status="available" label="Ready" />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('renders raw status string for unknown status', () => {
    render(<StatusBadge status="custom-unknown" />);
    expect(screen.getByText('custom-unknown')).toBeInTheDocument();
  });

  it('applies correct badge class', () => {
    const { container } = render(<StatusBadge status="occupied" />);
    const badge = container.querySelector('.badge');
    expect(badge.className).toContain('badge--occupied');
  });

  it('uses the dedicated cancelled badge style', () => {
    const { container } = render(<StatusBadge status="cancelled" />);
    const badge = container.querySelector('.badge');
    expect(badge.className).toContain('badge--cancelled');
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('uses the dedicated refunded badge style', () => {
    const { container } = render(<StatusBadge status="refunded" />);
    const badge = container.querySelector('.badge');
    expect(badge.className).toContain('badge--refunded');
    expect(screen.getByText('Refunded')).toBeInTheDocument();
  });

  it('hides dot when dot=false', () => {
    const { container } = render(<StatusBadge status="available" dot={false} />);
    const dot = container.querySelector('.dot');
    expect(dot).toBeNull();
  });

  it('shows dot by default', () => {
    const { container } = render(<StatusBadge status="available" />);
    const dot = container.querySelector('.dot');
    expect(dot).toBeInTheDocument();
  });
});
