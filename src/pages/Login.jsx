import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import { setSession, homeFor } from '../auth.js';

// Only ever bounce back to a path inside this app. A leading "//" or "/\" is
// read by browsers as protocol-relative, so those are open redirects, not paths.
function safeNext(value) {
  return typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : null;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  // Where to return to: ?next= (set by the 401 interceptor) or the location
  // state RequireRole passes when it blocks an unauthenticated visit.
  const next = safeNext(params.get('next')) || safeNext(location.state?.from);
  const expired = params.get('expired') === '1';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession(data.token, data.user);
      // Back to whatever they were doing, else the console for their role.
      navigate(next || homeFor(data.user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>

      {expired && (
        <div className="notice amber">
          <strong>Your session expired</strong>
          <p>Sign in again to pick up where you left off.</p>
        </div>
      )}

      <form className="form" onSubmit={submit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn" type="submit">Login</button>
        {error && <div className="error">{error}</div>}
      </form>
      <p>No account? <Link to="/register">Register</Link></p>
    </div>
  );
}
