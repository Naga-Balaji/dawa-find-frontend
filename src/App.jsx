import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PharmacyDetail from './pages/PharmacyDetail.jsx';
import api from './api/client.js';
import Logo from './components/Logo.jsx';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  return (
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Logo size={34} />
      </Link>
      <div>
        <Link to="/">Map</Link>
        {token ? (
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pharmacy/:id" element={<PharmacyDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}
