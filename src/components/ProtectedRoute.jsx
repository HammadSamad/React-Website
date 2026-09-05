import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/* Gate dashboard routes behind auth + optional role list. */
export default function ProtectedRoute({ children, roles, redirectTo = '/dashboard' }) {
  const { user, isAuthed } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}
