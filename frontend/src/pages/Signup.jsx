import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', isSeller: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields are required.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return toast.error('Passwords do not match.');

    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.isSeller);
      toast.success('Account created! Welcome to ShopFlow 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: '0 auto 1rem',
          }}>S</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Create account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join ShopFlow today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input name="name" type="text" className="form-control" placeholder="Jane Doe"
              value={form.name} onChange={handleChange} autoComplete="name" />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input name="email" type="email" className="form-control" placeholder="you@example.com"
              value={form.email} onChange={handleChange} autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" className="form-control" placeholder="Min. 6 characters"
              value={form.password} onChange={handleChange} autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input name="confirm" type="password" className="form-control" placeholder="••••••••"
              value={form.confirm} onChange={handleChange} autoComplete="new-password" />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input name="isSeller" type="checkbox" id="sellerCheck"
              checked={form.isSeller} onChange={handleChange} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
            <label htmlFor="sellerCheck" style={{ margin: 0, cursor: 'pointer' }}>I want to sign up as a seller</label>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? <><span className="spinner" />Creating account...</> : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
