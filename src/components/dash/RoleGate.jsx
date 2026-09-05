import { useAuth } from '../../context/AuthContext.jsx';

/* Render children only if the current user's role is allowed. */
export default function RoleGate({ roles, children, fallback = null }) {
  const { user } = useAuth();
  if (!user || (roles && !roles.includes(user.role))) return fallback;
  return children;
}

export function useHasRole(roles) {
  const { user } = useAuth();
  return !!user && (!roles || roles.includes(user.role));
}
