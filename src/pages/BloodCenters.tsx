import { useEffect, useState } from 'react';
import { MapPin, Phone, Building2, Droplet, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { haversineKm, formatDistance, getBrowserLocation } from '../lib/geo';
import { BLOOD_GROUPS, type BloodCenter, type BloodInventory, type BloodGroup } from '../types';

export default function BloodCenters() {
  const { session } = useAuth();
  const [centers, setCenters] = useState<(BloodCenter & { inventory?: BloodInventory[]; distance_km?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<BloodGroup | 'all'>('all');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cs } = await supabase.from('blood_centers').select('*');
      const { data: inv } = await supabase.from('blood_inventory').select('*');
      const invMap = new Map<string, BloodInventory[]>();
      (inv || []).forEach((i: BloodInventory) => {
        const arr = invMap.get(i.blood_center_id) || [];
        arr.push(i);
        invMap.set(i.blood_center_id, arr);
      });
      const withData = (cs || []).map((c: BloodCenter) => {
        const distance = lat !== null && lng !== null && c.latitude !== null && c.longitude !== null
          ? haversineKm(lat, lng, c.latitude, c.longitude) : undefined;
        return { ...c, inventory: invMap.get(c.id) || [], distance_km: distance };
      }).sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
      setCenters(withData);
      setLoading(false);
    })();
  }, [lat, lng]);

  const useMyLocation = async () => {
    try {
      const { lat, lng } = await getBrowserLocation();
      setLat(lat); setLng(lng);
    } catch { /* ignore */ }
  };

  const filtered = centers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !(c.city || '').toLowerCase().includes(q) && !(c.area || '').toLowerCase().includes(q)) return false;
    }
    if (filterGroup !== 'all') {
      const has = c.inventory?.some((i) => i.blood_group === filterGroup && i.available_units > 0);
      if (!has) return false;
    }
    return true;
  });

  return (
    <div className="page">
      <div className="container">
        <div className="flex-between wrap mb-6">
          <div>
            <div className="badge badge-primary mb-2"><Building2 size={13} /> Blood centers</div>
            <h1>Nearby Blood Centers</h1>
            <p className="muted">Browse centers and their live blood inventory.</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={useMyLocation}>
            <MapPin size={15} /> Sort by my location
          </button>
        </div>

        <div className="card mb-6">
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                <input className="input" placeholder="Center name, city, or area" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Filter by blood group</label>
              <select className="select" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value as BloodGroup | 'all')}>
                <option value="all">All groups</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading && <div className="text-center" style={{ padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>}

        {!loading && filtered.length === 0 && (
          <div className="card empty-state">
            <Building2 size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
            <h3>No blood centers found</h3>
            <p className="text-sm mt-2">Try adjusting your search or filter.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid" style={{ gap: 16 }}>
            {filtered.map((c) => (
              <div key={c.id} className="card">
                <div className="flex-between wrap mb-4">
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{c.name}</h3>
                    <div className="text-sm muted">
                      <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
                      {c.address ? `${c.address}, ` : ''}{c.area ? `${c.area}, ` : ''}{c.city || ''}
                    </div>
                    {c.phone && (
                      <div className="text-sm muted mt-2">
                        <Phone size={13} style={{ display: 'inline', marginRight: 4 }} />
                        {c.phone}
                      </div>
                    )}
                  </div>
                  {c.distance_km !== undefined && (
                    <span className="badge badge-secondary">{formatDistance(c.distance_km)}</span>
                  )}
                </div>
                <div className="divider" />
                <div className="text-sm" style={{ fontWeight: 600, marginBottom: 12 }}>
                  <Droplet size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--primary-600)' }} />
                  Available blood units
                </div>
                <div className="flex wrap gap-2">
                  {BLOOD_GROUPS.map((g) => {
                    const inv = c.inventory?.find((i) => i.blood_group === g);
                    const units = inv?.available_units ?? 0;
                    return (
                      <div key={g} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: '8px 12px', borderRadius: 10,
                        background: units > 0 ? 'var(--success-50)' : 'var(--neutral-50)',
                        border: `1px solid ${units > 0 ? 'var(--success-100)' : 'var(--border)'}`,
                        minWidth: 56,
                      }}>
                        <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: units > 0 ? 'var(--success-600)' : 'var(--neutral-400)' }}>{g}</span>
                        <span className="text-xs muted">{units} u</span>
                      </div>
                    );
                  })}
                </div>
                {c.inventory && c.inventory.length > 0 && (
                  <div className="text-xs muted mt-3">
                    Last updated {new Date(c.inventory[0].last_updated).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
