import { Link } from 'react-router-dom';
import { Droplet, Search, Heart, AlertTriangle, MapPin, ShieldCheck, Clock, Users, Building2 } from 'lucide-react';

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="badge badge-primary mb-4">
            <Heart size={13} /> Saving lives together
          </div>
          <h1>Find blood donors and centers near you — in minutes.</h1>
          <p>
            LifeFlow connects people who need blood with registered donors and nearby blood
            centers, matched by blood group, location, and real-time availability.
          </p>
          <div className="hero-actions">
            <Link to="/search" className="btn btn-primary btn-lg">
              <Search size={18} /> I Need Blood
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg">
              <Heart size={18} /> I Want to Donate
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            <div className="card card-hover">
              <div className="step-num" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                <Search size={22} />
              </div>
              <h3 style={{ marginBottom: 6 }}>Search Blood</h3>
              <p className="muted text-sm">Search by blood group and location to find matching available donors and nearby blood centers with live inventory.</p>
              <Link to="/search" className="btn btn-outline btn-sm mt-4">Find Blood</Link>
            </div>

            <div className="card card-hover">
              <div className="step-num" style={{ background: 'linear-gradient(135deg, var(--error-500), var(--error-600))' }}>
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ marginBottom: 6 }}>Emergency Request</h3>
              <p className="muted text-sm">Mark a request as emergency to prioritize matching and notify the nearest available donors and centers instantly.</p>
              <Link to="/emergency" className="btn btn-danger btn-sm mt-4">Emergency Request</Link>
            </div>

            <div className="card card-hover">
              <div className="step-num" style={{ background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-700))' }}>
                <Building2 size={22} />
              </div>
              <h3 style={{ marginBottom: 6 }}>Nearby Centers</h3>
              <p className="muted text-sm">Browse blood centers with live inventory of available units for every blood group, sorted by distance from you.</p>
              <Link to="/centers" className="btn btn-outline btn-sm mt-4">Find Nearby Center</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'white' }}>
        <div className="container">
          <h2 className="section-title">How LifeFlow Works</h2>
          <p className="section-sub">A simple three-step process connects blood seekers with donors and centers.</p>
          <div className="steps">
            <div className="card step">
              <div className="step-num">1</div>
              <h3>Register</h3>
              <p className="muted text-sm">Create an account as a blood seeker or donor. Donors add their blood group, area, and availability.</p>
            </div>
            <div className="card step">
              <div className="step-num">2</div>
              <h3>Search & Match</h3>
              <p className="muted text-sm">Seekers search by blood group and location. We match available donors and centers by distance.</p>
            </div>
            <div className="card step">
              <div className="step-num">3</div>
              <h3>Connect</h3>
              <p className="muted text-sm">Send a request to a matching donor. Donors accept or reject, and you get notified instantly.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-4">
            <div className="card stat-card">
              <Users size={22} style={{ color: 'var(--primary-600)' }} />
              <div className="stat-value">Live</div>
              <div className="stat-label">Donor network</div>
            </div>
            <div className="card stat-card">
              <MapPin size={22} style={{ color: 'var(--secondary-600)' }} />
              <div className="stat-value">Geo</div>
              <div className="stat-label">Distance matching</div>
            </div>
            <div className="card stat-card">
              <Clock size={22} style={{ color: 'var(--accent-600)' }} />
              <div className="stat-value">Real-time</div>
              <div className="stat-label">Availability updates</div>
            </div>
            <div className="card stat-card">
              <ShieldCheck size={22} style={{ color: 'var(--success-600)' }} />
              <div className="stat-value">Safe</div>
              <div className="stat-label">Protected donor info</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', color: 'white' }}>
        <div className="container text-center">
          <Droplet size={36} style={{ margin: '0 auto 16px', opacity: .9 }} />
          <h2 style={{ color: 'white', marginBottom: 12 }}>Every donation can save up to three lives.</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '55ch', margin: '0 auto 28px' }}>
            Join our community of donors and help ensure blood is always available when someone needs it most.
          </p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary-700)' }}>
            <Heart size={18} /> Register as Donor
          </Link>
        </div>
      </section>
    </>
  );
}
