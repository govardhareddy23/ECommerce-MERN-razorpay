import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const statusConfig = {
  paid:    { label: 'Paid',    className: 'badge-paid'    },
  pending: { label: 'Pending', className: 'badge-pending' },
  failed:  { label: 'Failed',  className: 'badge-failed'  },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/orders/my-orders')
      .then(({ data }) => setOrders(data.orders))
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <div className="page-loader"><div className="spinner" style={{ color: 'var(--accent)', width: 36, height: 36 }} /></div>;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>My Orders</h1>
          <p style={{ color: 'var(--text-muted)' }}>{orders.length} total orders</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.3rem' }}>
          {['all', 'paid', 'pending', 'failed'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '0.35rem 0.9rem', border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: filter === s ? 600 : 400, transition: 'all 0.2s',
                background: filter === s ? 'var(--accent)' : 'transparent',
                color: filter === s ? '#fff' : 'var(--text-muted)',
              }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <h3>No orders found</h3>
          <p>Orders you place will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((order) => (
            <OrderRow key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

const OrderRow = ({ order }) => {
  const cfg = statusConfig[order.status] || statusConfig.pending;
  const snap = order.productSnapshot || {};

  return (
    <div className="card fade-in" style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Product image */}
      <div style={{ width: 70, height: 70, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--surface2)' }}>
        <img src={snap.image || order.product?.image}
          alt={snap.name || order.product?.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/70x70/1a1d27/6c63ff?text=?'; }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{snap.name || order.product?.name}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {order.razorpayOrderId}
        </div>
        {order.razorpayPaymentId && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            Payment: {order.razorpayPaymentId}
          </div>
        )}
      </div>

      {/* Amount */}
      <div style={{ textAlign: 'right', minWidth: 100 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>₹{order.amount?.toLocaleString('en-IN')}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Status */}
      <span className={`badge ${cfg.className}`}>{cfg.label}</span>
    </div>
  );
};

export default Orders;
