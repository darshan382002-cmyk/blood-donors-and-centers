import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Droplet } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message || 'Invalid email or password.');
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="page">
      <div className="container auth-wrap">
        <div className="text-center mb-6">
          <div className="brand-mark" style={{ margin: '0 auto 14px', width: 52, height: 52, fontSize: 24 }}>
            <Droplet size={26} />
          </div>
          <h1>Welcome back</h1>
          <p className="muted">Log in to continue saving lives.</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email</label>
              <div className="flex gap-2" style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                <input
                  type="email" className="input" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                  style={{ paddingLeft: 38 }} autoComplete="email"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <div className="flex gap-2" style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                <input
                  type="password" className="input" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                  style={{ paddingLeft: 38 }} autoComplete="current-password"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Log in'}
            </button>
          </form>
          <p className="text-sm muted text-center mt-4">
            New here? <Link to="/register" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
