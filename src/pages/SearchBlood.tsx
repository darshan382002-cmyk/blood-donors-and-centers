import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Droplet, AlertTriangle } from 'lucide-react';
import { BLOOD_GROUPS, type BloodGroup } from '../types';
import { getBrowserLocation } from '../lib/geo';
import { useMaharashtraLocations } from '../lib/locations';

export default function SearchBlood() {
  const navigate = useNavigate();
  const { locations } = useMaharashtraLocations();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const useMyLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const { lat, lng } = await getBrowserLocation();
      setLat(lat);
      setLng(lng);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get location.');
    } finally {
      setLocating(false);
    }
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('group', bloodGroup);
    if (city) params.set('city', city);
    if (lat !== null) params.set('lat', lat.toString());
    if (lng !== null) params.set('lng', lng.toString());
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="page">
      <div className="container page-narrow">
        <div className="badge badge-primary mb-4"><Search size={13} /> Find blood</div>
        <h1 style={{ marginBottom: 8 }}>Search for blood</h1>
        <p className="muted mb-6">Enter the required blood group and your location. We'll find matching available donors and nearby blood centers sorted by distance.</p>

        <div className="card">
          {error && <div className="alert alert-error mb-4">{error}</div>}
          <form onSubmit={handleSearch}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Required blood group</label>
                <select className="select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">City / Village in Maharashtra</label>
                <select className="select" value={selectedLocation} onChange={(e) => handleLocationSelect(e.target.value)}>
                  <option value="">— Select a city or village —</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}{l.district ? ` (${l.district})` : ''} — {l.type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Your location (for distance sorting)</label>
              <div className="flex gap-2 wrap">
                <input className="input" placeholder="Latitude" value={lat ?? ''} onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)} style={{ flex: 1, minWidth: 120 }} />
                <input className="input" placeholder="Longitude" value={lng ?? ''} onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : null)} style={{ flex: 1, minWidth: 120 }} />
                <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation} disabled={locating}>
                  <MapPin size={15} /> {locating ? 'Locating…' : 'Use my location'}
                </button>
              </div>
              <div className="text-xs muted mt-2">Selecting a city auto-fills coordinates. You can also use your device location.</div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg">
              <Search size={18} /> Find Blood
            </button>
          </form>
        </div>

        <div className="grid grid-2 mt-6">
          <div className="card card-hover" style={{ borderColor: 'var(--error-100)' }}>
            <AlertTriangle size={22} style={{ color: 'var(--error-600)' }} />
            <h3 style={{ marginTop: 10, marginBottom: 6 }}>Emergency?</h3>
            <p className="muted text-sm" style={{ marginBottom: 14 }}>Create an emergency request to alert matching donors and centers immediately.</p>
            <a href="/emergency" className="btn btn-danger btn-sm" onClick={(e) => { e.preventDefault(); navigate('/emergency'); }}>Emergency Request</a>
          </div>
          <div className="card card-hover">
            <Droplet size={22} style={{ color: 'var(--primary-600)' }} />
            <h3 style={{ marginTop: 10, marginBottom: 6 }}>Browse centers</h3>
            <p className="muted text-sm" style={{ marginBottom: 14 }}>See all blood centers and their live inventory of available units.</p>
            <a href="/centers" className="btn btn-outline btn-sm" onClick={(e) => { e.preventDefault(); navigate('/centers'); }}>Find Nearby Center</a>
          </div>
        </div>
      </div>
    </div>
  );
}
