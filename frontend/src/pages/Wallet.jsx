import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Wallet = () => {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/wallet');
      setTransactions(data.transactions);
    } catch {
      toast.error('Failed to load wallet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const amount = Number(addAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount.');
    setAdding(true);
    try {
      const { data } = await api.post('/wallet/add-funds', { amount });
      toast.success(data.message);
      setAddAmount('');
      await refreshUser();
      await fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add funds.');
    } finally {
      setAdding(false);
    }
  };

  const totalDebits = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);

  if (loading) return <div className="page-loader"><div className="spinner" style={{ color: 'var(--accent)', width: 36, height: 36 }} /></div>;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>Wallet</h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Current Balance" value={`₹${user?.walletBalance?.toLocaleString('en-IN') ?? 0}`} color="var(--accent)" />
        <StatCard label="Total Spent" value={`₹${totalDebits.toLocaleString('en-IN')}`} color="var(--danger)" />
        <StatCard label="Total Added" value={`₹${totalCredits.toLocaleString('en-IN')}`} color="var(--success)" />
        <StatCard label="Transactions" value={transactions.length} color="var(--warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Transaction history */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Transaction History</h2>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💳</div>
              <h3>No transactions yet</h3>
              <p>Your purchase history will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {transactions.map((tx) => (
                <TxRow key={tx._id} tx={tx} />
              ))}
            </div>
          )}
        </div>

        {/* Add funds panel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Add Funds</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Simulation only — no real money is charged.
          </p>
          <form onSubmit={handleAddFunds}>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" className="form-control" placeholder="e.g. 5000"
                value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
                min="1" max="100000" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {[500, 1000, 5000, 10000].map((amt) => (
                <button key={amt} type="button" className="btn btn-outline btn-sm"
                  onClick={() => setAddAmount(String(amt))}>
                  +₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            <button type="submit" className="btn btn-primary" disabled={adding} style={{ width: '100%' }}>
              {adding ? <><span className="spinner" />Adding...</> : 'Add Funds'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="card" style={{ padding: '1.25rem' }}>
    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 700, color }}>{value}</div>
  </div>
);

const TxRow = ({ tx }) => (
  <div className="card fade-in" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tx.type === 'debit' ? 'var(--danger-light)' : 'var(--success-light)',
      fontSize: '1rem',
    }}>
      {tx.type === 'debit' ? '↓' : '↑'}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{tx.description}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {new Date(tx.createdAt).toLocaleString('en-IN')}
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontWeight: 700, color: tx.type === 'debit' ? 'var(--danger)' : 'var(--success)' }}>
        {tx.type === 'debit' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bal: ₹{tx.balanceAfter.toLocaleString('en-IN')}</div>
    </div>
  </div>
);

export default Wallet;
