import { createContext, useContext, useEffect, useState } from 'react';
import { demoAccounts, roleLabels } from '../data/hotel.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'luxurystay.auth';
const REGISTRY_KEY = 'luxurystay.accounts';

/* Locally-registered accounts (created via the signup page). Stored
   separately from the active session so a sign-out doesn't lose them.
   This mirrors what a real /auth/register + /auth/login pair would do. */
function loadRegistry() {
  try {
    const saved = localStorage.getItem(REGISTRY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [registry, setRegistry] = useState(loadRegistry);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore storage errors */
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
    } catch {
      /* ignore storage errors */
    }
  }, [registry]);

  const startSession = (account) => {
    const session = { ...account, roleLabel: roleLabels[account.role] || 'Guest' };
    delete session.password;
    setUser(session);
    return session;
  };

  // Demo staff accounts accept any password; registered accounts check theirs.
  function login(email, password) {
    const clean = String(email).trim().toLowerCase();
    const demo = demoAccounts.find((a) => a.email.toLowerCase() === clean);
    if (demo) return { ok: true, user: startSession(demo) };

    const account = registry.find((a) => a.email.toLowerCase() === clean);
    if (!account) {
      return { ok: false, error: 'No account found for that email. Create one, or try a demo account.' };
    }
    if (account.password !== password) {
      return { ok: false, error: 'That password does not match our records.' };
    }
    return { ok: true, user: startSession(account) };
  }

  // Create a new guest account, then sign in.
  function signup({ name, email, password }) {
    const clean = String(email).trim().toLowerCase();
    if (!name?.trim() || !clean || !password) {
      return { ok: false, error: 'Please complete every field to continue.' };
    }
    const taken =
      demoAccounts.some((a) => a.email.toLowerCase() === clean) ||
      registry.some((a) => a.email.toLowerCase() === clean);
    if (taken) {
      return { ok: false, error: 'An account with that email already exists. Try signing in.' };
    }
    const account = {
      email: clean,
      password,
      role: 'guest',
      name: name.trim(),
      title: 'Guest',
    };
    setRegistry((r) => [...r, account]);
    return { ok: true, user: startSession(account) };
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthed: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
