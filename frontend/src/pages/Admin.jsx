import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const statusConfig = {
  paid:    { label: 'Paid',    className: 'badge-paid'    },
  pending: { label: 'Pending', className: 'badge-pending' },
  failed:  { label: 'Failed',  className: 'badge-failed'  },
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState('orders');
  
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, failed: 0, revenue: 0 });

  const [pendingProducts, setPendingProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (activeTab === 'orders') {
      setLoadingOrders(true);
      api.get(`/orders/admin/all${filter ? `?status=${filter}` : ''}`)
        .then(({ data }) => {
          setOrders(data.orders);
          return api.get('/orders/admin/all?limit=1000');
        })
        .then(({ data }) => {
          const all = data.orders;
          setStats({
            total: all.length,
            paid: all.filter((o) => o.status === 'paid').length,
            pending: all.filter((o) => o.status === 'pending').length,
            failed: all.filter((o) => o.status === 'failed').length,
            revenue: all.filter((o) => o.status === 'paid').reduce((s, o) => s + o.amount, 0),
          });
        })
        .catch(() => toast.error('Failed to load orders.'))
        .finally(() => setLoadingOrders(false));
    } else {
      setLoadingProducts(true);
      api.get('/products/admin/pending')
        .then(({ data }) => setPendingProducts(data.products))
        .catch(() => toast.error('Failed to load pending products.'))
        .finally(() => setLoadingProducts(false));
    }
  }, [activeTab, filter]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/products/${id}/approve`);
      toast.success('Product approved!');
      setPendingProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      toast.error('Failed to approve product.');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject and delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product rejected.');
      setPendingProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      toast.error('Failed to reject product.');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Admin Dashboard</h1>
        <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>Admin</span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('orders')}
          className="tab-button"
          style={{
            padding: '0.8rem 1.2rem', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1rem', fontWeight: 600, color: activeTab === 'orders' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: activeTab === 'orders' ? '2px solid var(--accent)' : '2px solid transparent'
          }}>
          Orders Overview
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          className="tab-button"
          style={{
            padding: '0.8rem 1.2rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '1rem', fontWeight: 600, color: activeTab === 'products' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: activeTab === 'products' ? '2px solid var(--accent)' : '2px solid transparent'
          }}>
          Product Approvals
          {pendingProducts.length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem' }}>{pendingProducts.length}</span>}
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="fade-in">
          {loadingOrders ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Total Orders', value: stats.total, color: 'var(--text)' },
                  { label: 'Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, color: 'var(--success)' },
                  { label: 'Paid', value: stats.paid, color: 'var(--success)' },
                  { label: 'Pending', value: stats.pending, color: 'var(--warning)' },
                  { label: 'Failed', value: stats.failed, color: 'var(--danger)' },
                ].map((s) => (
                  <div key={s.label} className="card" style={{ padding: '1.1rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.3rem', width: 'fit-content' }}>
                {[['', 'All'], ['paid', 'Paid'], ['pending', 'Pending'], ['failed', 'Failed']].map(([val, label]) => (
                  <button key={val} onClick={() => setFilter(val)}
                    style={{
                      padding: '0.35rem 0.9rem', border: 'none', borderRadius: 8, cursor: 'pointer',
                      fontSize: '0.82rem', fontWeight: filter === val ? 600 : 400, transition: 'all 0.2s',
                      background: filter === val ? 'var(--accent)' : 'transparent',
                      color: filter === val ? '#fff' : 'var(--text-muted)',
                    }}>{label}</button>
                ))}
              </div>

              {/* Orders table */}
              <div className="card" style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['User', 'Product', 'Amount', 'Razorpay Order ID', 'Status', 'Date'].map((h) => (
                        <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No orders found</td></tr>
                    ) : orders.map((o) => {
                      const cfg = statusConfig[o.status] || statusConfig.pending;
                      return (
                        <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 500 }}>{o.user?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.user?.email}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {o.productSnapshot?.name || o.product?.name}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>₹{o.amount?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {o.razorpayOrderId}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}><span className={`badge ${cfg.className}`}>{cfg.label}</span></td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="fade-in">
          {loadingProducts ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : (
            <div className="card" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Image', 'Product Name', 'Seller', 'Price', 'Category', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingProducts.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No pending products to approve</td></tr>
                  ) : pendingProducts.map((p) => (
                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <img src={p.image} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 500 }}>{p.seller?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.seller?.email}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>₹{p.price.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{p.category}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleApprove(p._id)} style={{ padding: '0.4rem 0.8rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Approve</button>
                          <button onClick={() => handleReject(p._id)} style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
