import { createContext, useContext, useEffect, useState } from 'react';
import { roleLabels } from '../data/hotel.js';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'luxurystay.auth';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed.user ? { user: parsed.user } : { user: parsed };
    } catch {
      return null;
    }
  });
  const user = session?.user || null;

  useEffect(() => {
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore storage errors */
    }
  }, [session]);

  // The browser sends the HTTP-only cookie; use the server as the source of
  // truth whenever the app starts and never persist the JWT in JavaScript.
  useEffect(() => {
    let active = true;
    api('/users/me').then((account) => {
      if (active) setSession({ user: { ...account, id: account.id || account._id, name: account.username, roleLabel: roleLabels[account.role] || 'Guest' } });
    }).catch(() => { if (active) setSession(null); });
    return () => { active = false; };
  }, []);

  const startSession = (account) => {
    const nextUser = { ...account, name: account.name || account.username, roleLabel: roleLabels[account.role] || 'Guest' };
    setSession({ user: nextUser });
    api('/users/me').then((fullUser) => {
      setSession({ user: { ...fullUser, id: fullUser.id || fullUser._id, name: fullUser.username, roleLabel: roleLabels[fullUser.role] || 'Guest' } });
    }).catch(() => {});
    return nextUser;
  };

  // Demo staff accounts accept any password; registered accounts check theirs.
  async function login(email, password) {
    try {
      const result = await api('/auth/login', { method: 'POST', body: { email, password } });
      return { ok: true, user: startSession(result.user) };
    } catch (error) { return { ok: false, error: error.message, code: error.code }; }
  }

  // Create a new guest account, then sign in.
  async function signup({ name, email, password, phone }) {
    try { return { ok: true, ...(await api('/auth/register', { method: 'POST', body: { username: name, email, password, phone } })) }; }
    catch (error) { return { ok: false, error: error.message }; }
  }

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* the local session must still end */ }
    setSession(null);
  }

  // Keep the active session and a locally-created account in sync. Demo users
  // are session-only, which matches the rest of this frontend demo.
  async function updateProfile(patch) {
    try {
      const result = await api('/users/profile', { method: 'PUT', body: { username: patch.name, email: patch.email, phone: patch.phone, address: patch.address, city: patch.city, country: patch.country, preferences: patch.preferences?.join(', ') } });
      const next = { ...user, ...result.user, name: result.user.username, roleLabel: user.roleLabel };
      setSession((current) => ({ ...current, user: next }));
      return { ok: true, user: next, verificationRequired: result.verificationRequired };
    } catch (error) { return { ok: false, error: error.message }; }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateProfile, isAuthed: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
