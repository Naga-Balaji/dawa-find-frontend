import { Routes, Route, Link, useNavigate, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PharmacyDetail from './pages/PharmacyDetail.jsx';
import PartnerShop from './pages/PartnerShop.jsx';
import PartnerInventory from './pages/PartnerInventory.jsx';
import AdminPharmacies from './pages/AdminPharmacies.jsx';
import RequireRole from './components/RequireRole.jsx';
import api from './api/client.js';
import Logo from './components/Logo.jsx';
import { clearSession, getToken, getUser } from './auth.js';

function Navbar() {
  const navigate = useNavigate();
  const token = getToken();
  const user = getUser();

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearSession();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Logo size={34} />
      </Link>
      <div>
        <NavLink to="/">Map</NavLink>
        {user?.role === 'pharmacy' && (
          <>
            <NavLink to="/partner">My shop</NavLink>
            <NavLink to="/partner/inventory">Stock board</NavLink>
          </>
        )}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        {token ? (
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
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

        <Route path="/partner" element={
          <RequireRole roles={['pharmacy']}><PartnerShop /></RequireRole>
        } />
        <Route path="/partner/inventory" element={
          <RequireRole roles={['pharmacy']}><PartnerInventory /></RequireRole>
        } />
        <Route path="/admin" element={
          <RequireRole roles={['admin']}><AdminPharmacies /></RequireRole>
        } />
      </Routes>
    </>
  );
}
