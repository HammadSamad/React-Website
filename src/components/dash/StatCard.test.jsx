import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../dash/StatCard.jsx';

const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

beforeAll(() => {
  globalThis.IntersectionObserver = class {
    constructor() {}
    observe() { mockUnobserve(); }
    unobserve() { mockUnobserve(); }
    disconnect() { mockDisconnect(); }
  };
});

afterAll(() => {
  delete globalThis.IntersectionObserver;
});

describe('StatCard', () => {
  it('renders label', () => {
    render(<StatCard label="Revenue" value={50000} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders positive delta as up', () => {
    const { container } = render(<StatCard label="Occupancy" value={85} delta={5} />);
    const delta = container.querySelector('.stat-card__delta');
    expect(delta.className).toContain('is-up');
    expect(delta.textContent).toContain('+5%');
  });

  it('renders negative delta as down', () => {
    const { container } = render(<StatCard label="Revenue" value={100} delta={-3} />);
    const delta = container.querySelector('.stat-card__delta');
    expect(delta.className).toContain('is-down');
  });

  it('does not render delta when undefined', () => {
    const { container } = render(<StatCard label="Rooms" value={20} />);
    const delta = container.querySelector('.stat-card__delta');
    expect(delta).toBeNull();
  });

  it('applies tint class', () => {
    const { container } = render(<StatCard label="Test" value={0} tint="forest" />);
    expect(container.querySelector('.stat-card--forest')).toBeInTheDocument();
  });
});
