import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Fitness', 'Stationery', 'Other'];

const OwnerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imgPreviewOk, setImgPreviewOk] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', price: '', image: '', category: '', stock: 100,
  });
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  // Reset preview whenever URL changes
  useEffect(() => { setImgPreviewOk(false); }, [form.image]);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, revenueRes] = await Promise.all([
        api.get('/products/owner'),
        api.get('/orders/owner/revenue'),
      ]);
      setProducts(productsRes.data.products);
      setRevenue(revenueRes.data.totalRevenue);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!form.image) return toast.error('Please provide an image URL.');
    setAddingProduct(true);
    try {
      await api.post('/products', form);
      toast.success('Product added!');
      setForm({ name: '', description: '', price: '', image: '', category: '', stock: 100 });
      setImgPreviewOk(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setAddingProduct(false);
    }
  };

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, color: 'var(--accent)' }} />
    </div>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '1.25rem 0' }}>
        <div className="container">
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Owner Panel
          </p>
          <h1 style={{ fontFamily: "'Manrope',sans-serif", fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            Dashboard
          </h1>
        </div>
      </div>

      <div className="container" style={{ padding: '1.75rem 1.5rem' }}>

        {/* Revenue card */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem', marginBottom: '1.75rem',
        }}>
          <StatCard
            icon="₹" label="Total Revenue"
            value={`₹${revenue.toLocaleString('en-IN')}`} color="var(--success)"
            bg="rgba(5,150,105,0.07)" border="rgba(5,150,105,0.18)"
          />
          <StatCard
            icon="📦" label="Total Products"
            value={products.length} color="var(--accent)"
            bg="var(--accent-light)" border="rgba(79,70,229,0.18)"
          />
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Add Product form ── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Manrope',sans-serif", fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text)' }}>
              Add New Product
            </h2>

            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label>Product name</label>
                <input name="name" className="form-control" placeholder="e.g. Wireless Headphones"
                  value={form.name} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" className="form-control" rows={3}
                  placeholder="Describe your product…"
                  value={form.description} onChange={handleChange} required
                  style={{ resize: 'vertical', minHeight: 80 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input name="price" type="number" min="1" className="form-control" placeholder="499"
                    value={form.price} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input name="stock" type="number" min="0" className="form-control" placeholder="100"
                    value={form.stock} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select name="category" className="form-control" value={form.category} onChange={handleChange} required>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Image URL + live preview */}
              <div className="form-group">
                <label>Image URL</label>
                <input
                  name="image" type="url" className="form-control"
                  placeholder="https://example.com/photo.jpg"
                  value={form.image} onChange={handleChange} required
                />

                {/* Live preview box */}
                {form.image && (
                  <div style={{
                    marginTop: '0.65rem', borderRadius: 10, overflow: 'hidden',
                    border: `2px solid ${imgPreviewOk ? 'rgba(5,150,105,0.35)' : 'var(--border)'}`,
                    background: 'var(--surface2)', position: 'relative',
                    height: 160,
                  }}>
                    {!imgPreviewOk && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem',
                      }}>
                        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, color: 'var(--accent)', borderColor: 'rgba(79,70,229,0.2)', borderTopColor: 'var(--accent)' }} />
                        Loading preview…
                      </div>
                    )}
                    <img
                      src={form.image}
                      alt="Product preview"
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        display: imgPreviewOk ? 'block' : 'none',
                      }}
                      onLoad={() => setImgPreviewOk(true)}
                      onError={() => {
                        setImgPreviewOk(false);
                        /* show error only if URL looks complete */
                        if (form.image.startsWith('http') && form.image.includes('.')) {
                          toast.error('Could not load image. Check the URL.', { id: 'img-err' });
                        }
                      }}
                    />
                    {imgPreviewOk && (
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        background: 'rgba(5,150,105,0.85)', color: '#fff',
                        fontSize: '0.65rem', fontWeight: 700, borderRadius: 99,
                        padding: '0.15rem 0.5rem',
                      }}>✓ Preview OK</span>
                    )}
                  </div>
                )}
              </div>

              <button className="btn btn-primary" type="submit"
                disabled={addingProduct} style={{ width: '100%', marginTop: '0.25rem' }}>
                {addingProduct
                  ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Adding…</>
                  : '+ Add Product'}
              </button>
            </form>
          </div>

          {/* ── My Products list ── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Manrope',sans-serif", fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text)' }}>
              My Products
              <span style={{
                marginLeft: '0.6rem', background: 'var(--accent-light)', color: 'var(--accent)',
                fontSize: '0.72rem', fontWeight: 700, borderRadius: 99, padding: '0.15rem 0.6rem',
              }}>{products.length}</span>
            </h2>

            {products.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📦</div>
                <h3>No products yet</h3>
                <p>Use the form to add your first product</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {products.map(product => (
                  <ProductRow key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, bg, border }) => (
  <div style={{
    background: bg, border: `1px solid ${border}`,
    borderRadius: 12, padding: '1.1rem 1.25rem',
    display: 'flex', alignItems: 'center', gap: '0.85rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 10,
      background: bg, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.1rem', flexShrink: 0,
    }}>{icon}</div>
    <div>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>{label}</p>
      <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: '1.3rem', fontWeight: 800, color, letterSpacing: '-0.03em' }}>{value}</p>
    </div>
  </div>
);

const ProductRow = ({ product }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '0.85rem', borderRadius: 10,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    transition: 'box-shadow 0.15s',
  }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.08)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
  >
    <img
      src={product.image} alt={product.name}
      style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0, background: '#e6e9f5' }}
      onError={e => { e.currentTarget.src = `https://placehold.co/52x52/e6e9f5/4f46e5?text=${encodeURIComponent(product.name[0])}`; }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>
        {product.name}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
        <span className="tag-pill" style={{ marginRight: '0.4rem', fontSize: '0.6rem' }}>{product.category}</span>
        Stock: {product.stock}
      </p>
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: '1rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>
        ₹{product.price.toLocaleString('en-IN')}
      </p>
    </div>
  </div>
);

export default OwnerDashboard;
