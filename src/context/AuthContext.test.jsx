import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../lib/api.js', () => ({
  api: vi.fn(() => Promise.reject(new Error('no session'))),
  apiForm: vi.fn(),
}));

import { AuthProvider, useAuth } from './AuthContext.jsx';

describe('useAuth', () => {
  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
  });

  it('provides isAuthed false when no session', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthed).toBe(false);
  });
});
