import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => pathname === path;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(15,17,23,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 700, color: '#fff',
          }}>S</div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>ShopFlow</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <NavLink to="/" active={isActive('/')}>Products</NavLink>
          {user && (
            <>
              <NavLink to="/orders" active={isActive('/orders')}>My Orders</NavLink>
              <NavLink to="/wallet" active={isActive('/wallet')}>Wallet</NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" active={isActive('/admin')}>Admin</NavLink>
              )}
            </>
          )}
        </div>

        {/* Auth actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0.85rem', background: 'var(--accent-light)',
                borderRadius: 99, fontSize: '0.82rem', color: 'var(--accent)',
              }}>
                <span>₹</span>
                <span style={{ fontWeight: 600 }}>{user.walletBalance?.toLocaleString('en-IN') ?? 0}</span>
              </div>
              <div style={{
                width: 32, height: 32, background: 'var(--accent)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, active, children }) => (
  <Link to={to} style={{
    padding: '0.4rem 0.85rem', borderRadius: 8,
    fontSize: '0.88rem', fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    background: active ? 'var(--accent-light)' : 'transparent',
    transition: 'all 0.2s',
  }}>{children}</Link>
);

export default Navbar;
