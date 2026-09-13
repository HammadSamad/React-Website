import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    useAuth.mockReturnValue({ isAuthed: false, user: null });
    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  });

  it('renders children when authenticated', () => {
    useAuth.mockReturnValue({ isAuthed: true, user: { role: 'admin' } });
    render(
      <ProtectedRoute>
        <div>Dashboard</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects when role not in allowed list', () => {
    useAuth.mockReturnValue({ isAuthed: true, user: { role: 'guest' } });
    render(
      <ProtectedRoute roles={['admin']}>
        <div>Admin Only</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
  });

  it('renders children when role matches', () => {
    useAuth.mockReturnValue({ isAuthed: true, user: { role: 'manager' } });
    render(
      <ProtectedRoute roles={['admin', 'manager']}>
        <div>Manager Panel</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Manager Panel')).toBeInTheDocument();
  });
});
