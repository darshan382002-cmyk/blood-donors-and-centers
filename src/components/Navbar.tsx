import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Droplet, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { session, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const links: { to: string; label: string }[] = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/search', label: 'Find Blood' },
    { to: '/centers', label: 'Blood Centers' },
  ];
  if (profile?.role === 'seeker') {
    links.push({ to: '/seeker', label: 'Dashboard' });
    links.push({ to: '/emergency', label: 'Emergency' });
  }
  if (profile?.role === 'donor') {
    links.push({ to: '/donor', label: 'Dashboard' });
    links.push({ to: '/donor/requests', label: 'Requests' });
  }
  if (profile?.role === 'admin') {
    links.push({ to: '/admin', label: 'Admin' });
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark"><Droplet size={20} /></span>
          LifeFlow
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          {session && (
            <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Bell size={15} /> Alerts
              </span>
            </NavLink>
          )}
        </nav>

        <div className="nav-cta">
          {session ? (
            <>
              <Link to="/profile" className="btn btn-outline btn-sm" style={{ display: window.innerWidth < 560 ? 'none' : 'inline-flex' }}>
                {profile?.name?.split(' ')[0] || 'Profile'}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleSignOut} aria-label="Sign out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ display: window.innerWidth < 560 ? 'none' : 'inline-flex' }}>Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
          <button className="menu-toggle btn btn-ghost btn-sm" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
