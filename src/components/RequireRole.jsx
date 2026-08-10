import { Navigate, useLocation } from 'react-router-dom';
import { getToken, getUser } from '../auth.js';

// Client-side gate only — the API enforces roles independently via restrictTo().
export default function RequireRole({ roles, children }) {
  const location = useLocation();
  const token = getToken();
  const user = getUser();

  if (!token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  if (roles && !roles.includes(user?.role)) {
    return (
      <div className="container">
        <div className="notice error">
          <strong>Wrong account type.</strong>
          <p>
            This page needs a <code>{roles.join(' or ')}</code> account — you are signed in as{' '}
            <code>{user?.role || 'unknown'}</code>.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
