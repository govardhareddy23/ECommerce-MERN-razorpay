import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useRazorpay from './useRazorpay';
import toast from 'react-hot-toast';

const CartDrawer = ({ onClose }) => {
  const { cart, removeFromCart, clearCart, cartTotal } = useCart();
  const { user } = useAuth();
  const { initiateCartPayment } = useRazorpay();
  const navigate = useNavigate();

  const walletBalance = user?.walletBalance ?? 0;
  const canAfford = walletBalance >= cartTotal;

  const handleCheckout = async () => {
    if (!user) {
      onClose();
      return navigate('/login');
    }

    // ── Wallet validation ─────────────────────────────────────────────────
    if (!canAfford) {
      toast.error(
        `Insufficient wallet balance.\nYou need ₹${cartTotal.toLocaleString('en-IN')} but have ₹${walletBalance.toLocaleString('en-IN')}.`,
        { duration: 5000, icon: '💳' }
      );
      return;
    }

    await initiateCartPayment(cart, () => {
      clearCart();
      onClose();
      navigate('/orders');
    });
  };

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Drawer panel */}
      <div className="drawer">

        {/* Header */}
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff',
        }}>
          <div>
            <h2 style={{ fontFamily: "'Manrope',sans-serif", fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>
              Your Cart
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.05rem' }}>
              {cart.length} item{cart.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 7, padding: '0.3rem 0.55rem',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; }}
          >✕</button>
        </div>

        {/* Items list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.2rem', background: 'var(--bg)' }}>
          {cart.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: '0.85rem',
              color: 'var(--text-muted)', paddingTop: '4rem',
            }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.25">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p style={{ fontSize: '0.88rem', fontWeight: 500 }}>Cart is empty</p>
              <button className="btn btn-primary btn-sm" onClick={onClose}>Start Shopping</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {cart.map(item => <CartItem key={item._id} item={item} onRemove={removeFromCart} />)}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '1.1rem 1.4rem',
            borderTop: '1px solid var(--border)',
            background: '#fff',
          }}>
            {/* Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>Total</span>
              <span style={{
                fontFamily: "'Manrope',sans-serif",
                fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)',
                letterSpacing: '-0.03em',
              }}>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>

            {/* Wallet balance status */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem 0.75rem', borderRadius: 8, marginBottom: '0.85rem',
              background: canAfford ? 'rgba(5,150,105,0.07)' : 'rgba(220,38,38,0.07)',
              border: `1px solid ${canAfford ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`,
              fontSize: '0.78rem',
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Wallet balance</span>
              <span style={{ fontWeight: 700, color: canAfford ? 'var(--success)' : 'var(--danger)' }}>
                ₹{walletBalance.toLocaleString('en-IN')}
                {!canAfford && ` (need ₹${(cartTotal - walletBalance).toLocaleString('en-IN')} more)`}
              </span>
            </div>

            {/* Checkout button */}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.9rem' }}
              onClick={handleCheckout}
              disabled={!canAfford}
              title={!canAfford ? 'Add funds to wallet first' : ''}
            >
              {canAfford
                ? <>Checkout — ₹{cartTotal.toLocaleString('en-IN')}</>
                : '💳 Insufficient Balance'}
            </button>

            <button className="btn btn-ghost" style={{ width: '100%', fontSize: '0.78rem', color: 'var(--danger)' }}
              onClick={() => clearCart()}>
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const CartItem = ({ item, onRemove }) => (
  <div style={{
    display: 'flex', gap: '0.75rem', alignItems: 'center',
    padding: '0.75rem', borderRadius: 10,
    background: '#fff', border: '1px solid var(--border)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s',
  }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.08)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
  >
    <img
      src={item.image} alt={item.name}
      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 7, flexShrink: 0, background: 'var(--surface2)' }}
      onError={e => { e.currentTarget.src = `https://placehold.co/48x48/e6e9f5/4f46e5?text=${encodeURIComponent(item.name[0])}`; }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontWeight: 600, fontSize: '0.83rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>
        {item.name}
      </p>
      <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', marginTop: '0.1rem' }}>
        ₹{item.price.toLocaleString('en-IN')}
      </p>
    </div>
    <button onClick={() => onRemove(item._id)} style={{
      background: 'var(--danger-light)', border: '1px solid rgba(220,38,38,0.15)',
      color: 'var(--danger)', borderRadius: 7,
      padding: '0.28rem 0.48rem', cursor: 'pointer', fontSize: '0.72rem',
      transition: 'all 0.15s', flexShrink: 0,
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.16)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--danger-light)'}
      title="Remove"
    >✕</button>
  </div>
);

export default CartDrawer;
