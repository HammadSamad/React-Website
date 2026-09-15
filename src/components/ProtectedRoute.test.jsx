import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../context/DataContext.jsx', () => ({
  useData: vi.fn(() => ({ rolePolicies: {} })),
}));

import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuth.mockReset();
    useData.mockReturnValue({ rolePolicies: {} });
  });

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

  it('blocks a role whose module policy is false', () => {
    useAuth.mockReturnValue({ isAuthed: true, user: { role: 'housekeeping' } });
    useData.mockReturnValue({ rolePolicies: { housekeeping: { rooms: false } } });
    render(
      <ProtectedRoute module="rooms">
        <div>Rooms</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Rooms')).not.toBeInTheDocument();
  });

  it('allows a role whose module policy is true (granted)', () => {
    useAuth.mockReturnValue({ isAuthed: true, user: { role: 'housekeeping' } });
    useData.mockReturnValue({ rolePolicies: { housekeeping: { rooms: true } } });
    render(
      <ProtectedRoute module="rooms">
        <div>Rooms</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Rooms')).toBeInTheDocument();
  });

  it('always allows admin regardless of module policy', () => {
    useAuth.mockReturnValue({ isAuthed: true, user: { role: 'admin' } });
    useData.mockReturnValue({ rolePolicies: { admin: { rooms: false } } });
    render(
      <ProtectedRoute module="rooms">
        <div>Rooms</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Rooms')).toBeInTheDocument();
  });
});