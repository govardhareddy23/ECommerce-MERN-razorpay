import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import CartDrawer from './CartDrawer';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [prevCount, setPrevCount] = useState(cartCount);
  const cartRef = useRef(null);

  useEffect(() => {
    if (cartCount > prevCount && cartRef.current) {
      cartRef.current.classList.remove('cart-bounce');
      void cartRef.current.offsetWidth;
      cartRef.current.classList.add('cart-bounce');
    }
    setPrevCount(cartCount);
  }, [cartCount]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const isActive = (path) => pathname === path;
  const isUser  = user?.role === 'user';
  const isOwner = user?.role === 'owner';

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div className="container" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 60,
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.95rem', fontWeight: 800, color: '#fff',
              boxShadow: '0 3px 10px rgba(79,70,229,0.35)',
            }}>S</div>
            <span style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em', color: 'var(--text)',
            }}>ShopFlow</span>
          </Link>

          {/* Center nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
            <NavLink to="/" active={isActive('/')}>Shop</NavLink>
            {user && <>
              <NavLink to="/orders" active={isActive('/orders')}>Orders</NavLink>
              <NavLink to="/wallet" active={isActive('/wallet')}>Wallet</NavLink>
              {isOwner && <NavLink to="/owner-dashboard" active={isActive('/owner-dashboard')}>Dashboard</NavLink>}
            </>}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            {user ? (
              <>
                {/* Balance */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.28rem 0.75rem',
                  background: 'var(--accent-light)',
                  borderRadius: 99, fontSize: '0.8rem', color: 'var(--accent)',
                  fontWeight: 700, border: '1px solid rgba(79,70,229,0.15)',
                }}>
                  ₹{(user.walletBalance ?? 0).toLocaleString('en-IN')}
                </div>

                {/* Cart — users only */}
                {isUser && (
                  <button ref={cartRef} onClick={() => setCartOpen(true)} style={{
                    position: 'relative',
                    background: 'var(--surface2)', border: '1.5px solid var(--border)',
                    borderRadius: 8, padding: '0.38rem 0.6rem',
                    display: 'flex', alignItems: 'center', cursor: 'pointer',
                    transition: 'all 0.18s', color: 'var(--text-muted)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface3)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    title="Cart"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    {cartCount > 0 && (
                      <span style={{
                        position: 'absolute', top: -5, right: -5,
                        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                        color: '#fff', borderRadius: '50%',
                        width: 17, height: 17, fontSize: '0.62rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff',
                      }}>
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Avatar */}
                <div title={user.name} style={{
                  width: 32, height: 32,
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.78rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>

                <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login"  className="btn btn-outline btn-sm">Login</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {cartOpen && isUser && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  );
};

const NavLink = ({ to, active, children }) => (
  <Link to={to} style={{
    padding: '0.38rem 0.8rem', borderRadius: 7,
    fontSize: '0.85rem', fontWeight: active ? 600 : 500,
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    background: active ? 'var(--accent-light)' : 'transparent',
    border: active ? '1px solid rgba(79,70,229,0.15)' : '1px solid transparent',
    transition: 'all 0.15s',
  }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface2)'; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; } }}
  >
    {children}
  </Link>
);

export default Navbar;
