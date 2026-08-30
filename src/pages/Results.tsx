import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Droplet, Building2, Search, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { haversineKm, formatDistance } from '../lib/geo';
import type { Donor, BloodCenter, BloodInventory, BloodGroup, DonorWithProfile, CenterWithInventory } from '../types';

export default function Results() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const group = (params.get('group') || 'O+') as BloodGroup;
  const city = params.get('city') || '';
  const lat = params.get('lat') ? parseFloat(params.get('lat')!) : null;
  const lng = params.get('lng') ? parseFloat(params.get('lng')!) : null;

  const [donors, setDonors] = useState<DonorWithProfile[]>([]);
  const [centers, setCenters] = useState<CenterWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Donors: matching group, available
      let donorQuery = supabase
        .from('donors')
        .select('id, user_id, blood_group, age, area, city, latitude, longitude, availability_status, last_donation_date, created_at, profiles!inner(name)')
        .eq('blood_group', group)
        .eq('availability_status', true);
      if (city) donorQuery = donorQuery.ilike('city', `%${city}%`);
      const { data: donorData, error: dErr } = await donorQuery;
      if (dErr) console.error(dErr);

      const donorsWithDist: DonorWithProfile[] = (donorData || []).map((d: any) => {
        const distance = lat !== null && lng !== null && d.latitude !== null && d.longitude !== null
          ? haversineKm(lat, lng, d.latitude, d.longitude)
          : undefined;
        return { ...d, distance_km: distance, profiles: d.profiles };
      }).sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
      setDonors(donorsWithDist);

      // Centers + inventory — fetch ALL centers so nearest ones show even if city doesn't match
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

      const centersWithDist: CenterWithInventory[] = (centerData || []).map((c: BloodCenter) => {
        const distance = lat !== null && lng !== null && c.latitude !== null && c.longitude !== null
          ? haversineKm(lat, lng, c.latitude, c.longitude)
          : undefined;
        return { ...c, inventory: invByCenter.get(c.id) || [], distance_km: distance };
      }).sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
      setCenters(centersWithDist);
      setLoading(false);
    })();
  }, [group, city, lat, lng]);

  const sendRequest = async (donorId: string) => {
    if (!session) {
      navigate('/login', { state: { from: '/results' } });
      return;
    }
    if (profile?.role !== 'seeker') {
      navigate('/request', { state: { preGroup: group, preDonorId: donorId } });
      return;
    }
    setSendingTo(donorId);
    // Create a blood request first, then link donor
    const { data: reqData, error: reqErr } = await supabase
      .from('blood_requests')
      .insert({
        blood_group: group,
        required_units: 1,
        city: city || null,
        latitude: lat,
        longitude: lng,
        emergency_level: 'normal',
        request_status: 'open',
      })
      .select('id')
      .single();
    if (reqErr) {
      setSendingTo(null);
      alert('Could not create request: ' + reqErr.message);
      return;
    }
    const { error: linkErr } = await supabase
      .from('donor_requests')
      .insert({ blood_request_id: reqData.id, donor_id: donorId, status: 'pending' });
    setSendingTo(null);
    if (linkErr) {
      alert('Could not send request to donor: ' + linkErr.message);
      return;
    }
    setSent(donorId);
  };

  const groupUnits = (c: CenterWithInventory) => {
    const inv = c.inventory?.find((i) => i.blood_group === group);
    return inv?.available_units ?? 0;
  };

  return (
    <div className="page">
      <div className="container">
        <div className="flex-between wrap mb-6">
          <div>
            <div className="badge badge-primary mb-2"><Droplet size={13} /> Search results</div>
            <h1 style={{ marginBottom: 6 }}>Blood Group: {group}</h1>
            <p className="muted">
              {city && <>Location: {city} · </>}
              {lat !== null && <>Coordinates: {lat.toFixed(2)}, {lng?.toFixed(2)} · </>}
              Sorted by nearest distance
            </p>
          </div>
          <Link to="/search" className="btn btn-outline btn-sm"><Search size={15} /> New search</Link>
        </div>

        {loading && <div className="text-center" style={{ padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>}

        {!loading && (
          <>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Available Nearby Donors</h2>
            {donors.length === 0 ? (
              <div className="card empty-state mb-8">
                <AlertTriangle size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
                <h3>No matching donor is currently available nearby.</h3>
                <p className="text-sm mt-2">Try expanding the search area, checking nearby blood centers, or creating an emergency request.</p>
                <div className="flex gap-2 wrap mt-4" style={{ justifyContent: 'center' }}>
                  <Link to="/search" className="btn btn-outline btn-sm">Expand search</Link>
                  <Link to="/emergency" className="btn btn-danger btn-sm">Emergency request</Link>
                </div>
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
                          {d.area ? `${d.area}, ` : ''}{d.city || 'Location not set'} · Distance: {formatDistance(d.distance_km)}
                        </span>
                      </div>
                      <span className={`badge ${d.availability_status ? 'badge-success' : 'badge-neutral'}`}>
                        {d.availability_status ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="result-actions">
                      {sent === d.id ? (
                        <span className="badge badge-success"><Send size={13} /> Request sent</span>
                      ) : (
                        <button className="btn btn-primary btn-sm" disabled={sendingTo === d.id} onClick={() => sendRequest(d.id)}>
                          {sendingTo === d.id ? <span className="spinner" /> : <><Send size={14} /> Send Request</>}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Nearby Blood Centers</h2>
            {centers.length === 0 ? (
              <div className="card empty-state">
                <Building2 size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
                <h3>No blood centers found{city ? ` in ${city}` : ''}.</h3>
              </div>
            ) : (
              <div className="grid" style={{ gap: 12 }}>
                {centers.map((c) => {
                  const units = groupUnits(c);
                  const available = units > 0;
                  return (
                    <div key={c.id} className="result-row">
                      <div className="result-info">
                        <span className="bg-chip">{group}</span>
                        <div className="result-meta">
                          <span className="result-name">{c.name}</span>
                          <span className="result-sub">
                            {c.address ? `${c.address}, ` : ''}{c.city || ''} · Distance: {formatDistance(c.distance_km)}
                          </span>
                        </div>
                        <span className={`badge ${available ? 'badge-success' : 'badge-error'}`}>
                          {available ? `${units} units available` : 'Out of stock'}
                        </span>
                      </div>
                      <div className="result-actions">
                        <Link to="/centers" className="btn btn-outline btn-sm"><MapPin size={14} /> View Details</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
