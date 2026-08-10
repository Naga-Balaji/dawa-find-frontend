import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import { setSession, homeFor } from '../auth.js';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', { name, email, password, phone, role });
      setSession(data.token, data.user);
      navigate(homeFor(data.user));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>

      <div className="role-toggle">
        <button
          type="button"
          className={`role-opt ${role === 'user' ? 'on' : ''}`}
          onClick={() => setRole('user')}
        >
          <strong>🔍 I'm looking for medicine</strong>
          <span>Search nearby shops</span>
        </button>
        <button
          type="button"
          className={`role-opt ${role === 'pharmacy' ? 'on' : ''}`}
          onClick={() => setRole('pharmacy')}
        >
          <strong>🏥 I run a medical shop</strong>
          <span>List your shop and manage stock</span>
        </button>
      </div>

      <form className="form" onSubmit={submit}>
        <input placeholder={role === 'pharmacy' ? 'Your name' : 'Name'} value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <button className="btn primary" type="submit">
          {role === 'pharmacy' ? 'Create partner account' : 'Create account'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
      <p>Have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
