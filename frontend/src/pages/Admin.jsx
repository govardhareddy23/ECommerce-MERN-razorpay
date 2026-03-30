import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const statusConfig = {
  paid:    { label: 'Paid',    className: 'badge-paid'    },
  pending: { label: 'Pending', className: 'badge-pending' },
  failed:  { label: 'Failed',  className: 'badge-failed'  },
};

const Admin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, failed: 0, revenue: 0 });

  useEffect(() => {
    api.get(`/orders/admin/all${filter ? `?status=${filter}` : ''}`)
      .then(({ data }) => {
        setOrders(data.orders);
        // Compute stats from all (unfiltered) orders
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
      .catch(() => toast.error('Failed to load admin data.'))
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <div className="page-loader"><div className="spinner" style={{ color: 'var(--accent)', width: 36, height: 36 }} /></div>;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Admin Dashboard</h1>
        <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>Admin</span>
      </div>

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
    </div>
  );
};

export default Admin;
