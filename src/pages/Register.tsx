import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, User, Mail, Lock, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('seeker');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone, role } },
    });
    setLoading(false);
    if (error) {
      setError(error.message || 'Registration failed.');
      return;
    }
    if (data.user) {
      if (role === 'donor') {
        navigate('/donor-register');
      } else {
        navigate('/seeker');
      }
    }
  };

  return (
    <div className="page">
      <div className="container auth-wrap">
        <div className="text-center mb-6">
          <div className="brand-mark" style={{ margin: '0 auto 14px', width: 52, height: 52, fontSize: 24 }}>
            <Droplet size={26} />
          </div>
          <h1>Create your account</h1>
          <p className="muted">Join LifeFlow as a seeker or donor.</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">I want to register as</label>
              <div className="auth-tabs" style={{ marginBottom: 0 }}>
                <button type="button" className={`auth-tab ${role === 'seeker' ? 'active' : ''}`} onClick={() => setRole('seeker')}>
                  Blood Seeker
                </button>
                <button type="button" className={`auth-tab ${role === 'donor' ? 'active' : ''}`} onClick={() => setRole('donor')}>
                  Blood Donor
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Full name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required style={{ paddingLeft: 38 }} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                  <input type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: 38 }} autoComplete="email" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                  <input className="input" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ paddingLeft: 38 }} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                <input type="password" className="input" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingLeft: 38 }} autoComplete="new-password" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create account'}
            </button>
          </form>
          <p className="text-sm muted text-center mt-4">
            Already have an account? <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
