import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', isOwner: false });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields are required.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.isOwner);
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 440 }}>

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
              Create account
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Join ShopFlow — it's free</p>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Password</label>
                <input name="password" type={showPass ? 'text' : 'password'}
                  className="form-control" placeholder="Min 6 chars"
                  value={form.password} onChange={handleChange} autoComplete="new-password"
                  style={{ paddingRight: '2.4rem' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: '0.6rem', top: '2.1rem',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem',
                }}>{showPass ? '🙈' : '👁️'}</button>
              </div>
              <div className="form-group">
                <label>Confirm</label>
                <input name="confirm" type="password" className="form-control" placeholder="Repeat"
                  value={form.confirm} onChange={handleChange} autoComplete="new-password" />
              </div>
            </div>

            {/* Owner toggle */}
            <div
              onClick={() => setForm({ ...form, isOwner: !form.isOwner })}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.8rem 1rem', borderRadius: 10, cursor: 'pointer', marginBottom: '1.15rem',
                background: form.isOwner ? 'rgba(79,70,229,0.06)' : 'var(--surface2)',
                border: `1.5px solid ${form.isOwner ? 'rgba(79,70,229,0.3)' : 'var(--border)'}`,
                transition: 'all 0.18s',
              }}
            >
              {/* Toggle pill */}
              <div style={{
                width: 36, height: 20, borderRadius: 99, flexShrink: 0,
                background: form.isOwner ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : '#d1d5db',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: form.isOwner ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: form.isOwner ? 'var(--accent)' : 'var(--text)', lineHeight: 1.2 }}>
                  Register as Owner
                </p>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  List products & earn from sales
                </p>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg"
              disabled={loading} style={{ width: '100%' }}>
              {loading ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Creating…</> : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
