import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useRazorpay from '../components/useRazorpay';

const CATEGORIES = ['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Fitness', 'Stationery'];

const Products = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { initiatePayment } = useRazorpay();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');
  const [search, setSearch] = useState('');
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== 'All') params.set('category', category);
        if (sort) params.set('sort', sort);
        if (search) params.set('search', search);
        const { data } = await api.get(`/products?${params}`, { signal: controller.signal });
        setProducts(data.products);
      } catch (err) {
        if (err.name !== 'CanceledError') toast.error('Failed to load products.');
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchProducts, 300);
    return () => { clearTimeout(debounce); controller.abort(); };
  }, [category, sort, search]);

  const handleBuyNow = async (product) => {
    if (!user) {
      toast('Please log in to purchase.', { icon: '🔒' });
      return navigate('/login');
    }
    if (user.role === 'owner') {
      toast.error('Owners cannot purchase products.');
      return;
    }
    // ── Wallet balance check ──────────────────────────────────────────────
    if ((user.walletBalance ?? 0) < product.price) {
      toast.error(
        `Insufficient wallet balance. You need ₹${product.price.toLocaleString('en-IN')} but have ₹${(user.walletBalance ?? 0).toLocaleString('en-IN')}.`,
        { duration: 5000, icon: '💳' }
      );
      return;
    }
    setPayingId(product._id);
    await initiatePayment(product._id, () => navigate('/orders'));
    setPayingId(null);
  };

  const handleAddToCart = (product) => {
    if (!user) {
      toast('Please log in to add to cart.', { icon: '🔒' });
      return navigate('/login');
    }
    if (user.role === 'owner') {
      toast.error('Owners cannot add items to cart.');
      return;
    }
    addToCart(product);
  };

  const isOwner = user?.role === 'owner';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Page header strip */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        padding: '1.5rem 0',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              ShopFlow Store
            </p>
            <h1 style={{ fontFamily: "'Manrope',sans-serif", fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
              Browse Products
            </h1>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {products.length} item{products.length !== 1 ? 's' : ''} available
          </span>
        </div>
      </div>

      <div className="container" style={{ padding: '1.75rem 1.5rem' }}>

        {/* Filters bar */}
        <div style={{
          display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center',
          marginBottom: '1.75rem',
          padding: '0.9rem 1.1rem',
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="form-control"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.1rem', width: 200, fontSize: '0.85rem' }}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', flex: 1 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '0.28rem 0.78rem', borderRadius: 99,
                border: category === c ? '1.5px solid rgba(79,70,229,0.35)' : '1.5px solid var(--border)',
                fontSize: '0.77rem', fontWeight: category === c ? 700 : 500, cursor: 'pointer',
                background: category === c ? 'var(--accent-light)' : 'var(--surface2)',
                color: category === c ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>
                {c}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select className="form-control" value={sort} onChange={e => setSort(e.target.value)}
            style={{ maxWidth: 170, fontSize: '0.83rem', flexShrink: 0 }}>
            <option value="">Newest first</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="page-loader">
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, color: 'var(--accent)', margin: '0 auto' }} />
              <p style={{ color: 'var(--text-muted)', marginTop: '0.85rem', fontSize: '0.85rem' }}>Loading products…</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))',
            gap: '1.2rem',
          }}>
            {products.map((p, i) => (
              <ProductCard
                key={p._id} product={p}
                onBuy={handleBuyNow}
                onAddToCart={handleAddToCart}
                paying={payingId === p._id}
                isOwner={isOwner}
                index={i}
                walletBalance={user?.walletBalance ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductCard = ({ product, onBuy, onAddToCart, paying, isOwner, index, walletBalance }) => {
  const canAfford = walletBalance === null || walletBalance >= product.price;

  return (
    <div className="card fade-in" style={{
      display: 'flex', flexDirection: 'column',
      animationDelay: `${Math.min(index * 0.035, 0.4)}s`,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.11)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Image */}
      <div className="product-img-wrap" style={{ height: 196, background: 'var(--surface2)', position: 'relative', flexShrink: 0 }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.currentTarget.src = `https://placehold.co/400x196/e6e9f5/4f46e5?text=${encodeURIComponent(product.name)}`; }}
        />
        {product.stock > 0 && product.stock < 10 && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(220,38,38,0.9)', color: '#fff',
            borderRadius: 99, fontSize: '0.62rem', fontWeight: 700,
            padding: '0.18rem 0.55rem',
          }}>
            Only {product.stock} left
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.45rem' }}>
        <span className="tag-pill">{product.category}</span>

        <h3 style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.38, letterSpacing: '-0.01em',
          color: 'var(--text)',
        }}>
          {product.name}
        </h3>

        <p style={{
          fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.description}
        </p>

        {product.owner?.name && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
            by <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>{product.owner.name}</span>
          </p>
        )}

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', gap: '0.5rem' }}>
          <div>
            <span style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '1.18rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em',
            }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {/* Insufficient balance hint */}
            {walletBalance !== null && !canAfford && !isOwner && (
              <div style={{ fontSize: '0.65rem', color: 'var(--danger)', marginTop: '0.1rem', fontWeight: 500 }}>
                Need ₹{(product.price - walletBalance).toLocaleString('en-IN')} more
              </div>
            )}
          </div>

          {!isOwner && (
            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
              {/* Add to cart */}
              <button
                onClick={() => onAddToCart(product)}
                title="Add to cart"
                style={{
                  background: 'var(--surface2)',
                  border: '1.5px solid var(--border-hover)',
                  borderRadius: 7, padding: '0.38rem 0.5rem',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--surface2)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </button>

              {/* Buy Now */}
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onBuy(product)}
                disabled={paying}
                title={!canAfford ? 'Insufficient wallet balance' : ''}
                style={{
                  fontSize: '0.78rem', padding: '0.38rem 0.9rem',
                  opacity: !canAfford ? 0.55 : 1,
                }}
              >
                {paying
                  ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Wait</>
                  : canAfford ? 'Buy Now' : '💳 Insufficient'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
