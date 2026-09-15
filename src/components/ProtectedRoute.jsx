import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { MODULE_BY_ROUTE } from '../data/hotel.js';

/* Gate dashboard routes behind auth + optional role list. When a `module` is
   supplied (directly or via MODULE_BY_ROUTE for the current path), the role's
   server-configured module policy wins; admin always passes. A `roles` list is
   the fallback while policies are the authoritative gate, matching the API. */
export default function ProtectedRoute({ children, roles, module, redirectTo = '/dashboard' }) {
  const { user, isAuthed } = useAuth();
  const { rolePolicies } = useData();
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const moduleKey = module || MODULE_BY_ROUTE[location.pathname];
  const policy = moduleKey && user ? rolePolicies?.[user.role]?.[moduleKey] : undefined;
  let allowed;
  if (user.role === 'admin') {
    allowed = true;
  } else if (policy !== undefined) {
    allowed = policy === true;
  } else {
    allowed = roles ? roles.includes(user.role) : true;
  }
  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}