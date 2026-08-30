import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Droplet, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BLOOD_GROUPS, type BloodGroup, type EmergencyLevel } from '../types';
import { getBrowserLocation } from '../lib/geo';
import { useMaharashtraLocations, sendSmsNotification } from '../lib/locations';

export default function BloodRequest() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { preGroup?: BloodGroup; preDonorId?: string } | null;
  const { locations } = useMaharashtraLocations();

  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(state?.preGroup || 'O+');
  const [units, setUnits] = useState('1');
  const [area, setArea] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [emergency, setEmergency] = useState<EmergencyLevel>('normal');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);

  const useMyLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const { lat, lng } = await getBrowserLocation();
      setLat(lat); setLng(lng);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get location.');
    } finally { setLocating(false); }
  };

  const handleLocationSelect = (locId: string) => {
    setSelectedLocation(locId);
    const loc = locations.find((l) => l.id === locId);
    if (loc) {
      setCity(loc.name);
      setLat(loc.latitude);
      setLng(loc.longitude);
    }
  };

  const [city, setCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!session?.user) return;
    setLoading(true);
    setSmsStatus(null);

    const locationName = selectedLocation
      ? locations.find((l) => l.id === selectedLocation)?.name || city
      : city;

    const { data, error: err } = await supabase
      .from('blood_requests')
      .insert({
        seeker_id: session.user.id,
        blood_group: bloodGroup,
        required_units: parseInt(units, 10) || 1,
        area: area || null,
        city: city || null,
        latitude: lat,
        longitude: lng,
        emergency_level: emergency,
        request_status: 'open',
        notes: notes || null,
      })
      .select('id')
      .single();
    if (err) { setError(err.message); setLoading(false); return; }

    if (state?.preDonorId) {
      await supabase.from('donor_requests').insert({
        blood_request_id: data.id,
        donor_id: state.preDonorId,
        status: 'pending',
      });
    }

    // Send SMS notification to matching donors
    const smsResult = await sendSmsNotification(data.id, bloodGroup, emergency, locationName, profile?.phone || null);
    setSmsStatus(smsResult.message);

    setLoading(false);
    const q = new URLSearchParams({ id: data.id, group: bloodGroup, level: emergency });
    if (city) q.set('city', city);
    if (lat !== null) q.set('lat', lat.toString());
    if (lng !== null) q.set('lng', lng.toString());
    navigate(`/request-confirmation?${q.toString()}`);
  };

  return (
    <div className="page">
      <div className="container page-narrow">
        <div className="badge badge-primary mb-4"><Droplet size={13} /> Blood request</div>
        <h1 style={{ marginBottom: 8 }}>Create a blood request</h1>
        <p className="muted mb-6">Tell us what you need. Matching donors will see your request and can accept or reject it.</p>

        <div className="card">
          {error && <div className="alert alert-error mb-4">{error}</div>}
          {smsStatus && <div className="alert alert-success mb-4">{smsStatus}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Required blood group</label>
                <select className="select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Number of units</label>
                <input type="number" min={1} className="input" value={units} onChange={(e) => setUnits(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Select your city / village in Maharashtra</label>
              <select className="select" value={selectedLocation} onChange={(e) => handleLocationSelect(e.target.value)}>
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
              <input className="input" placeholder="Your specific area" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="label">Your location (coordinates)</label>
              <div className="flex gap-2 wrap">
                <input className="input" placeholder="Latitude" value={lat ?? ''} onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)} style={{ flex: 1, minWidth: 120 }} />
                <input className="input" placeholder="Longitude" value={lng ?? ''} onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : null)} style={{ flex: 1, minWidth: 120 }} />
                <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation} disabled={locating}>
                  <MapPin size={15} /> {locating ? 'Locating…' : 'Use my location'}
                </button>
              </div>
              <div className="text-xs muted mt-2">Selecting a city auto-fills coordinates. You can also use your device location.</div>
            </div>

            <div className="form-group">
              <label className="label">Emergency level</label>
              <div className="flex gap-2 wrap">
                {(['normal', 'urgent', 'emergency'] as EmergencyLevel[]).map((lvl) => (
                  <button type="button" key={lvl} className={`btn btn-sm ${emergency === lvl ? (lvl === 'emergency' ? 'btn-danger' : lvl === 'urgent' ? 'btn-primary' : 'btn-outline') : 'btn-outline'}`} onClick={() => setEmergency(lvl)}>
                    {lvl === 'emergency' && <AlertTriangle size={14} />} {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Notes (optional)</label>
              <textarea className="textarea" placeholder="Any additional details for donors or centers" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
