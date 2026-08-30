import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Droplet, MapPin, Building2, Clock, Navigation, AlertTriangle, Send, Phone, User, Navigation2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { haversineKm, formatDistance, estimateTravelTimeMin } from '../lib/geo';
import type { BloodGroup, DonorWithProfile, CenterWithInventory, BloodInventory } from '../types';

export default function RequestConfirmation() {
  const [params] = useSearchParams();
  const { session, profile } = useAuth();
  const requestId = params.get('id') || '';
  const group = (params.get('group') || 'O+') as BloodGroup;
  const city = params.get('city') || '';
  const lat = params.get('lat') ? parseFloat(params.get('lat')!) : null;
  const lng = params.get('lng') ? parseFloat(params.get('lng')!) : null;
  const level = params.get('level') || 'normal';

  const [donors, setDonors] = useState<DonorWithProfile[]>([]);
  const [centers, setCenters] = useState<CenterWithInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      let donorQuery = supabase
        .from('donors')
        .select('id, user_id, blood_group, age, area, city, latitude, longitude, availability_status, last_donation_date, created_at, profiles!inner(name)')
        .eq('blood_group', group)
        .eq('availability_status', true);
      if (city) donorQuery = donorQuery.ilike('city', `%${city}%`);
      const { data: donorData } = await donorQuery;

      const donorsWithDist: DonorWithProfile[] = (donorData || []).map((d: any) => {
        const distance = lat !== null && lng !== null && d.latitude !== null && d.longitude !== null
          ? haversineKm(lat, lng, d.latitude, d.longitude)
          : undefined;
        return { ...d, distance_km: distance, profiles: d.profiles };
      }).sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
      setDonors(donorsWithDist);

      // Fetch ALL centers (not just by city) so we can find the nearest one
      const { data: centerData } = await supabase.from('blood_centers').select('*');
      const { data: invData } = await supabase
        .from('blood_inventory')
        .select('id, blood_center_id, blood_group, available_units, last_updated')
        .eq('blood_group', group);

      const invByCenter = new Map<string, BloodInventory[]>();
      (invData || []).forEach((inv: BloodInventory) => {
        const arr = invByCenter.get(inv.blood_center_id) || [];
        arr.push(inv);
        invByCenter.set(inv.blood_center_id, arr);
      });

      const centersWithDist: CenterWithInventory[] = (centerData || []).map((c: any) => {
        const distance = lat !== null && lng !== null && c.latitude !== null && c.longitude !== null
          ? haversineKm(lat, lng, c.latitude, c.longitude)
          : undefined;
        return { ...c, inventory: invByCenter.get(c.id) || [], distance_km: distance };
      }).sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
      setCenters(centersWithDist);
      setLoading(false);
    })();
  }, [group, city, lat, lng]);

  const levelBadge = () => {
    if (level === 'emergency') return <span className="badge badge-error"><AlertTriangle size={12} /> Emergency</span>;
    if (level === 'urgent') return <span className="badge badge-warning">Urgent</span>;
    return <span className="badge badge-neutral">Normal</span>;
  };

  const nearestCenter = centers.length > 0 ? centers[0] : null;
  const nearestCenterUnits = nearestCenter?.inventory?.find((i) => i.blood_group === group)?.available_units ?? 0;

  return (
    <div className="page">
      <div className="container">
        {/* Success banner */}
        <div className="card mb-6" style={{ borderColor: 'var(--success-200)', background: 'var(--success-50)' }}>
          <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
            <CheckCircle2 size={28} style={{ color: 'var(--success-600)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h1 style={{ marginBottom: 6 }}>Request Submitted Successfully</h1>
              <p className="muted" style={{ marginBottom: 12 }}>
                Your <strong>{group}</strong> blood request has been recorded. {level !== 'normal' && <>It is marked as <strong>{level}</strong> and matching donors have been notified. </>}
                Matching donors near {city || 'your location'} have been sent a notification.
              </p>
              <div className="flex gap-2 wrap">
                {levelBadge()}
                <span className="badge badge-secondary"><Droplet size={12} /> {group}</span>
                {city && <span className="badge badge-neutral"><MapPin size={12} /> {city}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Person info card */}
        <div className="card mb-6">
          <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={22} style={{ color: 'var(--primary-600)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Your Information</h2>
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div>
                  <div className="text-xs muted" style={{ marginBottom: 4 }}>Name</div>
                  <div style={{ fontWeight: 600 }}>{profile?.name || session?.user?.email || '—'}</div>
                </div>
                <div>
                  <div className="text-xs muted" style={{ marginBottom: 4 }}>Phone</div>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={14} style={{ color: 'var(--neutral-400)' }} />
                    {profile?.phone || 'Not set'}
                  </div>
                </div>
                <div>
                  <div className="text-xs muted" style={{ marginBottom: 4 }}>Blood Group Needed</div>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Droplet size={14} style={{ color: 'var(--error-600)' }} />
                    {group}
                  </div>
                </div>
                <div>
                  <div className="text-xs muted" style={{ marginBottom: 4 }}>Location</div>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} style={{ color: 'var(--neutral-400)' }} />
                    {city || 'Not specified'}
                    {lat !== null && lng !== null && <span className="text-xs muted">({lat.toFixed(2)}, {lng.toFixed(2)})</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nearest blood center - highlighted prominently */}
        {!loading && nearestCenter && (
          <div className="card mb-6" style={{ borderColor: 'var(--primary-300)', borderWidth: 2, background: 'linear-gradient(135deg, var(--primary-50, #f0f7ff) 0%, var(--surface) 100%)' }}>
            <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Navigation2 size={24} style={{ color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex gap-2 wrap mb-2">
                  <span className="badge badge-primary"><Building2 size={12} /> Nearest Blood Center</span>
                  {nearestCenter.distance_km !== undefined && (
                    <span className="badge badge-secondary"><Navigation size={12} /> {formatDistance(nearestCenter.distance_km)} away</span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: 6 }}>{nearestCenter.name}</h2>
                <div className="muted text-sm" style={{ marginBottom: 8 }}>
                  <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {nearestCenter.address ? `${nearestCenter.address}, ` : ''}
                  {nearestCenter.area ? `${nearestCenter.area}, ` : ''}
                  {nearestCenter.city || ''}
                </div>
                {nearestCenter.phone && (
                  <div className="muted text-sm" style={{ marginBottom: 8 }}>
                    <Phone size={13} style={{ display: 'inline', marginRight: 4 }} />
                    {nearestCenter.phone}
                  </div>
                )}
                <div className="flex gap-3 wrap" style={{ alignItems: 'center' }}>
                  <span className={`badge ${nearestCenterUnits > 0 ? 'badge-success' : 'badge-error'}`}>
                    <Droplet size={12} /> {group}: {nearestCenterUnits > 0 ? `${nearestCenterUnits} units available` : 'Out of stock'}
                  </span>
                  {nearestCenter.distance_km !== undefined && (
                    <span className="text-sm" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} style={{ color: 'var(--secondary-600)' }} /> Est. {estimateTravelTimeMin(nearestCenter.distance_km)} by road
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && <div className="text-center" style={{ padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>}

        {!loading && (
          <>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Nearby Available Donors ({donors.length})</h2>
            {donors.length === 0 ? (
              <div className="card empty-state mb-8">
                <AlertTriangle size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
                <h3>No matching available donors nearby</h3>
                <p className="text-sm mt-2">Try checking nearby blood centers below, or expanding your search area.</p>
              </div>
            ) : (
              <div className="grid mb-8" style={{ gap: 12 }}>
                {donors.map((d, idx) => (
                  <div key={d.id} className="result-row">
                    <div className="result-info">
                      <span className="bg-chip">{d.blood_group}</span>
                      <div className="result-meta">
                        <span className="result-name">{d.profiles?.name || `Donor ${idx + 1}`}</span>
                        <span className="result-sub">
                          {d.area ? `${d.area}, ` : ''}{d.city || 'Location not set'}
                        </span>
                      </div>
                      <span className="badge badge-success">Available</span>
                    </div>
                    <div className="result-actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span className="text-sm" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Navigation size={13} style={{ color: 'var(--secondary-600)' }} /> {formatDistance(d.distance_km)}
                      </span>
                      <span className="text-xs muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> Est. {estimateTravelTimeMin(d.distance_km)} by road
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>All Nearby Blood Centers ({centers.length})</h2>
            {centers.length === 0 ? (
              <div className="card empty-state">
                <Building2 size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
                <h3>No blood centers found</h3>
              </div>
            ) : (
              <div className="grid" style={{ gap: 12 }}>
                {centers.map((c, idx) => {
                  const inv = c.inventory?.find((i) => i.blood_group === group);
                  const units = inv?.available_units ?? 0;
                  return (
                    <div key={c.id} className="result-row" style={idx === 0 ? { borderColor: 'var(--primary-300)', borderWidth: 2 } : undefined}>
                      <div className="result-info">
                        <span className="bg-chip">{group}</span>
                        <div className="result-meta">
                          <span className="result-name">{c.name}</span>
                          <span className="result-sub">
                            {c.address ? `${c.address}, ` : ''}{c.city || ''}
                          </span>
                        </div>
                        <span className={`badge ${units > 0 ? 'badge-success' : 'badge-error'}`}>
                          {units > 0 ? `${units} units available` : 'Out of stock'}
                        </span>
                      </div>
                      <div className="result-actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span className="text-sm" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Navigation size={13} style={{ color: 'var(--secondary-600)' }} /> {formatDistance(c.distance_km)}
                        </span>
                        <span className="text-xs muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> Est. {estimateTravelTimeMin(c.distance_km)} by road
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="flex gap-2 wrap mt-6">
          <Link to="/seeker" className="btn btn-primary btn-sm">Go to My Requests</Link>
          <Link to="/search" className="btn btn-outline btn-sm">Search Again</Link>
        </div>
      </div>
    </div>
  );
}
