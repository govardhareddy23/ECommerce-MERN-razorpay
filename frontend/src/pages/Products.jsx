import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useRazorpay from '../components/useRazorpay';

const CATEGORIES = ['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Fitness', 'Stationery'];

const Products = () => {
  const { user } = useAuth();
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

  const handleBuyNow = async (productId) => {
    if (!user) {
      toast('Please log in to purchase.', { icon: '🔒' });
      return navigate('/login');
    }
    setPayingId(productId);
    await initiatePayment(productId, () => navigate('/orders'));
    setPayingId(null);
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Products</h1>
        <p style={{ color: 'var(--text-muted)' }}>{products.length} items available</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
        {/* Search */}
        <input
          className="form-control"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              style={{
                padding: '0.35rem 0.9rem', borderRadius: 99, border: 'none',
                fontSize: '0.82rem', fontWeight: category === c ? 600 : 400, cursor: 'pointer',
                background: category === c ? 'var(--accent)' : 'var(--surface2)',
                color: category === c ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select className="form-control" value={sort} onChange={(e) => setSort(e.target.value)}
          style={{ maxWidth: 180, marginLeft: 'auto' }}>
          <option value="">Sort: Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="page-loader"><div className="spinner" style={{ color: 'var(--accent)', width: 36, height: 36 }} /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: '1.25rem',
        }}>
          {products.map((p) => (
            <ProductCard key={p._id} product={p} onBuy={handleBuyNow} paying={payingId === p._id} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product, onBuy, paying }) => (
  <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
    {/* Image */}
    <div style={{ height: 200, overflow: 'hidden', background: 'var(--surface2)' }}>
      <img src={product.image} alt={product.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = ''}
        onError={(e) => { e.currentTarget.src = `https://placehold.co/400x200/1a1d27/6c63ff?text=${encodeURIComponent(product.name)}`; }}
      />
    </div>

    {/* Body */}
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ marginBottom: '0.35rem' }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--accent)', background: 'var(--accent-light)', padding: '0.2rem 0.55rem', borderRadius: 4,
        }}>{product.category}</span>
      </div>

      <h3 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.4, flex: 1 }}>
        {product.name}
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {product.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div>
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => onBuy(product._id)} disabled={paying}>
          {paying ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Processing</> : 'Buy Now'}
        </button>
      </div>
    </div>
  </div>
);

export default Products;
