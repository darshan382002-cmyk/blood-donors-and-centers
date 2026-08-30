import { Link } from 'react-router-dom';
import { Droplet, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ color: 'white', marginBottom: 12 }}>
              <span className="brand-mark"><Droplet size={20} /></span>
              LifeFlow
            </div>
            <p style={{ maxWidth: '40ch', fontSize: '0.9rem' }}>
              Connecting blood seekers, donors, and nearby blood centers through real-time
              matching by blood group, location, and availability.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', marginBottom: 12 }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.88rem' }}>
              <Link to="/search">Find Blood</Link>
              <Link to="/centers">Blood Centers</Link>
              <Link to="/register">Register as Donor</Link>
              <Link to="/about">About</Link>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', marginBottom: 12 }}>Emergency</h4>
            <p style={{ fontSize: '0.88rem' }}>
              For life-threatening emergencies, create an emergency blood request to alert
              matching donors and nearby centers immediately.
            </p>
          </div>
        </div>
        <div className="footer-bottom flex-between">
          <span>© {new Date().getFullYear()} LifeFlow. All rights reserved.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Made with <Heart size={13} fill="currentColor" style={{ color: 'var(--primary-500)' }} /> for donors
          </span>
        </div>
      </div>
    </footer>
  );
}
