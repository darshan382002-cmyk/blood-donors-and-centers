import { Droplet, Heart, ShieldCheck, MapPin, Users, Building2 } from 'lucide-react';

export default function About() {
  return (
    <div className="page">
      <div className="container page-narrow">
        <div className="badge badge-primary mb-4"><Heart size={13} /> Our mission</div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: 16 }}>About LifeFlow</h1>
        <p className="muted" style={{ fontSize: '1.1rem', marginBottom: 32 }}>
          LifeFlow is a blood donor finder and emergency alert system that connects people who
          need blood with registered donors and nearby blood centers — matched by blood group,
          location, distance, and real-time availability.
        </p>

        <div className="card mb-6">
          <h3 style={{ marginBottom: 12 }}>What we do</h3>
          <p className="muted text-sm" style={{ marginBottom: 16 }}>
            When a blood seeker searches for blood, LifeFlow finds registered donors with the
            matching blood group, filters by availability, calculates distance, and sorts
            results by nearest first. We also check nearby blood center inventories so seekers
            can see where units are available.
          </p>
          <div className="grid grid-2">
            <div className="flex gap-3">
              <Droplet size={20} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <div><strong>Blood group matching</strong><div className="muted text-sm">Match donors and inventory by ABO/Rh type.</div></div>
            </div>
            <div className="flex gap-3">
              <MapPin size={20} style={{ color: 'var(--secondary-600)', flexShrink: 0 }} />
              <div><strong>Location & distance</strong><div className="muted text-sm">Sort results by distance from the seeker.</div></div>
            </div>
            <div className="flex gap-3">
              <Users size={20} style={{ color: 'var(--accent-600)', flexShrink: 0 }} />
              <div><strong>Donor availability</strong><div className="muted text-sm">Only available donors appear in results.</div></div>
            </div>
            <div className="flex gap-3">
              <Building2 size={20} style={{ color: 'var(--success-600)', flexShrink: 0 }} />
              <div><strong>Center inventory</strong><div className="muted text-sm">Live stock of units per blood group.</div></div>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h3 style={{ marginBottom: 12 }}>Privacy & safety</h3>
          <p className="muted text-sm" style={{ marginBottom: 12 }}>
            Donor contact information is protected. Seekers see a donor's name, blood group,
            area, and availability — but can only reach out through the request flow, not by
            viewing raw contact details in search results.
          </p>
          <div className="flex gap-3">
            <ShieldCheck size={20} style={{ color: 'var(--success-600)', flexShrink: 0 }} />
            <p className="muted text-sm">
              LifeFlow only coordinates donors and requests. Actual donation eligibility and
              safety must be confirmed by an authorized blood bank or medical professional.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Emergency alerts</h3>
          <p className="muted text-sm">
            Emergency requests are prioritized across the system. Matching donors and nearby
            centers are notified immediately so help can arrive as fast as possible.
          </p>
        </div>
      </div>
    </div>
  );
}
