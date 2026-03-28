import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Add Product Form State
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    stock: 100,
  });
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, revenueRes] = await Promise.all([
        api.get('/products/seller'),
        api.get('/orders/seller/revenue')
      ]);
      setProducts(productsRes.data.products);
      setRevenue(revenueRes.data.totalRevenue);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAddingProduct(true);
    try {
      await api.post('/products', form);
      toast.success('Product added! Waiting for admin approval.');
      setForm({ name: '', description: '', price: '', image: '', category: '', stock: 100 });
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setAddingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Seller Dashboard</h1>
      
      <div className="card fade-in" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.02))' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Revenue</h2>
        <div style={{ fontSize: '3rem', fontWeight: 700, color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '2rem', opacity: 0.8 }}>₹</span>
          {revenue.toLocaleString('en-IN')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        {/* Add Product Form */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Add New Product</h3>
          <form onSubmit={handleAddProduct}>
            <div className="form-group">
              <label>Name</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" className="form-control" value={form.description} onChange={handleChange} required rows={3} />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input name="price" type="number" min="1" className="form-control" value={form.price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input name="image" type="url" className="form-control" value={form.image} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input name="category" className="form-control" value={form.category} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Initial Stock</label>
              <input name="stock" type="number" min="0" className="form-control" value={form.stock} onChange={handleChange} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={addingProduct} style={{ width: '100%' }}>
              {addingProduct ? 'Adding...' : 'Add Product'}
            </button>
          </form>
        </div>

        {/* Product List */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>My Products</h3>
          {products.length === 0 ? (
            <div className="empty-state">
              <p>You haven't added any products yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {products.map(product => (
                <div key={product._id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={product.image} alt={product.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                    <div>
                      <h4 style={{ margin: 0 }}>{product.name}</h4>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        ₹{product.price} • Stock: {product.stock}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: 99,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    backgroundColor: product.isApproved ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    color: product.isApproved ? '#22c55e' : '#eab308'
                  }}>
                    {product.isApproved ? 'Approved' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
