import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BLOOD_GROUPS, type BloodGroup } from '../types';
import { useMaharashtraLocations } from '../lib/locations';

export default function DonorRegister() {
  const { session, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [age, setAge] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);
  const [lastDonation, setLastDonation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const { locations } = useMaharashtraLocations();

  useEffect(() => {
    (async () => {
      if (!session?.user) return;
      const { data } = await supabase
        .from('donors')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (data) {
        setExisting(true);
        setBloodGroup(data.blood_group);
        setAge(data.age?.toString() || '');
        setArea(data.area || '');
        setCity(data.city || '');
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setAvailable(data.availability_status);
        setLastDonation(data.last_donation_date || '');
      }
    })();
  }, [session]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      (err) => setError(err.message || 'Could not get location.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!session?.user) return;
    setLoading(true);
    const payload = {
      user_id: session.user.id,
      blood_group: bloodGroup,
      age: age ? parseInt(age, 10) : null,
      area: area || null,
      city: city || null,
      latitude,
      longitude,
      availability_status: available,
      last_donation_date: lastDonation || null,
    };
    let errorObj;
    if (existing) {
      ({ error: errorObj } = await supabase.from('donors').update(payload).eq('user_id', session.user.id));
    } else {
      ({ error: errorObj } = await supabase.from('donors').insert(payload));
    }
    setLoading(false);
    if (errorObj) {
      setError(errorObj.message);
      return;
    }
    if (profile?.role !== 'donor') {
      await supabase.from('profiles').update({ role: 'donor' }).eq('id', session.user.id);
      await refreshProfile();
    }
    navigate('/donor');
  };

  return (
    <div className="page">
      <div className="container page-narrow">
        <div className="badge badge-primary mb-4"><Droplet size={13} /> Donor profile</div>
        <h1 style={{ marginBottom: 8 }}>{existing ? 'Update donor details' : 'Register as a donor'}</h1>
        <p className="muted mb-6">Your blood group and location help seekers find you when they need blood most.</p>

        <div className="card">
          {error && <div className="alert alert-error mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Blood group</label>
                <select className="select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Age</label>
                <input type="number" min={18} max={65} className="input" placeholder="18-65" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Select your city / village in Maharashtra</label>
              <select className="select" value={selectedLocation} onChange={(e) => {
                setSelectedLocation(e.target.value);
                const loc = locations.find((l) => l.id === e.target.value);
                if (loc) {
                  setCity(loc.name);
                  setLatitude(loc.latitude);
                  setLongitude(loc.longitude);
                }
              }}>
                <option value="">— Select a city or village —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}{l.district ? ` (${l.district})` : ''} — {l.type}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Area (optional)</label>
              <input className="input" placeholder="Your area / locality" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="label">Location (latitude / longitude)</label>
              <div className="flex gap-2 wrap">
                <input className="input" placeholder="Latitude" value={latitude ?? ''} onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : null)} style={{ flex: 1, minWidth: 120 }} />
                <input className="input" placeholder="Longitude" value={longitude ?? ''} onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : null)} style={{ flex: 1, minWidth: 120 }} />
                <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation}>
                  <MapPin size={15} /> Use my location
                </button>
              </div>
              <p className="text-xs muted mt-2">We use your location only to calculate distance to seekers. Your exact address is never shown.</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Availability</label>
                <select className="select" value={available ? 'yes' : 'no'} onChange={(e) => setAvailable(e.target.value === 'yes')}>
                  <option value="yes">Available to donate</option>
                  <option value="no">Not available right now</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Last donation date (optional)</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                  <input type="date" className="input" value={lastDonation} onChange={(e) => setLastDonation(e.target.value)} style={{ paddingLeft: 38 }} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : existing ? 'Update profile' : 'Register as donor'}
            </button>
          </form>
        </div>

        <div className="alert alert-info mt-4 text-sm">
          LifeFlow only coordinates donors and requests. Actual donation eligibility and safety must be confirmed by an authorized blood bank or medical professional.
        </div>

        <p className="text-sm muted text-center mt-4">
          <Link to="/" style={{ color: 'var(--primary-600)' }}>Back to home</Link>
        </p>
      </div>
    </div>
  );
}
