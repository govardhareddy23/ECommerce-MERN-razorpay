import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 420 }}>

        <div style={{
          background: '#fff', borderRadius: 18, padding: '2.25rem 2rem',
          border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              width: 48, height: 48,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 800, color: '#fff',
              margin: '0 auto 1rem', boxShadow: '0 6px 18px rgba(79,70,229,0.3)',
            }}>S</div>
            <h1 style={{ fontFamily: "'Manrope',sans-serif", fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: '0.2rem' }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" name="email" type="email" className="form-control"
                placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="login-password">Password</label>
              <input id="login-password" name="password" type={showPass ? 'text' : 'password'}
                className="form-control" placeholder="••••••••" value={form.password}
                onChange={handleChange} autoComplete="current-password" style={{ paddingRight: '2.8rem' }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: '0.7rem', top: '2.15rem',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem',
              }}>{showPass ? '🙈' : '👁️'}</button>
            </div>

            <button type="submit" className="btn btn-primary btn-lg"
              disabled={loading} style={{ width: '100%', marginTop: '0.25rem' }}>
              {loading ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.35rem', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            No account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>

        {/* Demo hint */}
        <div style={{
          marginTop: '0.85rem', background: 'rgba(79,70,229,0.06)',
          border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10,
          padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)',
          display: 'flex', gap: '0.5rem',
        }}>
          <span>ℹ️</span>
          <span><strong style={{ color: 'var(--accent)', fontWeight: 600 }}>Demo owner:</strong> owner@shop.com / owner@1234</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
