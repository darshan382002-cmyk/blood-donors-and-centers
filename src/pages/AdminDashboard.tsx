import { useEffect, useState } from 'react';
import { Users, Droplet, AlertTriangle, Building2, Heart, Activity, Trash2, MapPin, Phone, Plus, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BLOOD_GROUPS, type BloodGroup, type Profile, type Donor, type BloodRequest, type BloodCenter, type BloodInventory } from '../types';

interface Stats {
  totalUsers: number;
  totalDonors: number;
  availableDonors: number;
  totalRequests: number;
  emergencyRequests: number;
  totalCenters: number;
  totalUnits: number;
}

type Tab = 'overview' | 'users' | 'donors' | 'requests' | 'centers';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [centers, setCenters] = useState<BloodCenter[]>([]);
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCenterForm, setShowCenterForm] = useState(false);
  const [editingCenter, setEditingCenter] = useState<BloodCenter | null>(null);
  const [invModal, setInvModal] = useState<BloodCenter | null>(null);

  const load = async () => {
    setLoading(true);
    const [u, d, r, c, inv] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('donors').select('*').order('created_at', { ascending: false }),
      supabase.from('blood_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('blood_centers').select('*').order('created_at', { ascending: false }),
      supabase.from('blood_inventory').select('*'),
    ]);
    setUsers((u.data as Profile[]) || []);
    setDonors((d.data as Donor[]) || []);
    setRequests((r.data as BloodRequest[]) || []);
    setCenters((c.data as BloodCenter[]) || []);
    setInventory((inv.data as BloodInventory[]) || []);

    const allDonors = (d.data as Donor[]) || [];
    const allReqs = (r.data as BloodRequest[]) || [];
    const allInv = (inv.data as BloodInventory[]) || [];
    setStats({
      totalUsers: (u.data as Profile[])?.length || 0,
      totalDonors: allDonors.length,
      availableDonors: allDonors.filter((x) => x.availability_status).length,
      totalRequests: allReqs.length,
      emergencyRequests: allReqs.filter((x) => x.emergency_level === 'emergency').length,
      totalCenters: (c.data as BloodCenter[])?.length || 0,
      totalUnits: allInv.reduce((sum, i) => sum + i.available_units, 0),
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteCenter = async (id: string) => {
    if (!confirm('Delete this blood center and its inventory?')) return;
    await supabase.from('blood_centers').delete().eq('id', id);
    load();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'donors', label: 'Donors' },
    { key: 'requests', label: 'Requests' },
    { key: 'centers', label: 'Centers' },
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="badge badge-primary mb-2"><Activity size={13} /> Admin</div>
        <h1 style={{ marginBottom: 8 }}>Admin Dashboard</h1>
        <p className="muted mb-6">Monitor and manage users, donors, requests, and blood centers.</p>

        {loading && <div className="text-center" style={{ padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>}

        {!loading && stats && (
          <>
            <div className="grid grid-4 mb-6">
              <div className="card stat-card">
                <Users size={20} style={{ color: 'var(--primary-600)' }} />
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total users</div>
              </div>
              <div className="card stat-card">
                <Heart size={20} style={{ color: 'var(--error-600)' }} />
                <div className="stat-value">{stats.totalDonors}</div>
                <div className="stat-label">Registered donors ({stats.availableDonors} available)</div>
              </div>
              <div className="card stat-card">
                <Droplet size={20} style={{ color: 'var(--secondary-600)' }} />
                <div className="stat-value">{stats.totalRequests}</div>
                <div className="stat-label">Blood requests ({stats.emergencyRequests} emergency)</div>
              </div>
              <div className="card stat-card">
                <Building2 size={20} style={{ color: 'var(--success-600)' }} />
                <div className="stat-value">{stats.totalCenters}</div>
                <div className="stat-label">Centers · {stats.totalUnits} units</div>
              </div>
            </div>

            <div className="flex gap-2 wrap mb-6">
              {tabs.map((t) => (
                <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-2">
                <div className="card">
                  <h3 style={{ marginBottom: 16 }}>Emergency Requests</h3>
                  {requests.filter((r) => r.emergency_level === 'emergency').length === 0 ? (
                    <p className="muted text-sm">No emergency requests.</p>
                  ) : (
                    <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
                      {requests.filter((r) => r.emergency_level === 'emergency').slice(0, 5).map((r) => (
                        <div key={r.id} className="flex-between" style={{ padding: '8px 12px', background: 'var(--error-50)', borderRadius: 10 }}>
                          <span className="text-sm"><span className="bg-chip" style={{ fontSize: '0.8rem', padding: '2px 8px' }}>{r.blood_group}</span> {r.required_units}u · {r.city || '—'}</span>
                          <span className={`badge ${r.request_status === 'open' ? 'badge-error' : 'badge-neutral'}`}>{r.request_status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card">
                  <h3 style={{ marginBottom: 16 }}>Donor availability</h3>
                  <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
                    {BLOOD_GROUPS.map((g) => {
                      const count = donors.filter((d) => d.blood_group === g && d.availability_status).length;
                      const total = donors.filter((d) => d.blood_group === g).length;
                      return (
                        <div key={g} className="flex-between text-sm" style={{ padding: '6px 0' }}>
                          <span><span className="bg-chip" style={{ fontSize: '0.78rem', padding: '2px 8px' }}>{g}</span></span>
                          <span className="muted">{count} available / {total} total</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div className="card">
                <div className="grid" style={{ gap: 10 }}>
                  {users.map((u) => (
                    <div key={u.id} className="flex-between" style={{ padding: '10px 14px', background: 'var(--neutral-50)', borderRadius: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div className="text-sm muted">{u.phone || 'No phone'}</div>
                      </div>
                      <span className={`badge ${u.role === 'admin' ? 'badge-error' : u.role === 'donor' ? 'badge-primary' : 'badge-secondary'}`}>{u.role}</span>
                    </div>
                  ))}
                  {users.length === 0 && <p className="muted text-sm">No users registered.</p>}
                </div>
              </div>
            )}

            {tab === 'donors' && (
              <div className="card">
                <div className="grid" style={{ gap: 10 }}>
                  {donors.map((d) => (
                    <div key={d.id} className="flex-between wrap" style={{ padding: '10px 14px', background: 'var(--neutral-50)', borderRadius: 10 }}>
                      <div className="flex gap-3" style={{ alignItems: 'center' }}>
                        <span className="bg-chip" style={{ fontSize: '0.85rem', padding: '4px 10px' }}>{d.blood_group}</span>
                        <div>
                          <div className="text-sm" style={{ fontWeight: 600 }}>{d.area ? `${d.area}, ` : ''}{d.city || 'Location not set'}</div>
                          {d.age && <div className="text-xs muted">Age {d.age}</div>}
                        </div>
                      </div>
                      <span className={`badge ${d.availability_status ? 'badge-success' : 'badge-neutral'}`}>
                        {d.availability_status ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  ))}
                  {donors.length === 0 && <p className="muted text-sm">No donors registered.</p>}
                </div>
              </div>
            )}

            {tab === 'requests' && (
              <div className="card">
                <div className="grid" style={{ gap: 10 }}>
                  {requests.map((r) => (
                    <div key={r.id} className="flex-between wrap" style={{ padding: '10px 14px', background: 'var(--neutral-50)', borderRadius: 10 }}>
                      <div className="flex gap-3" style={{ alignItems: 'center' }}>
                        <span className="bg-chip" style={{ fontSize: '0.85rem', padding: '4px 10px' }}>{r.blood_group}</span>
                        <div>
                          <div className="text-sm" style={{ fontWeight: 600 }}>{r.required_units} unit(s) · {r.area ? `${r.area}, ` : ''}{r.city || '—'}</div>
                          <div className="text-xs muted">{new Date(r.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 wrap">
                        <span className={`badge ${r.emergency_level === 'emergency' ? 'badge-error' : r.emergency_level === 'urgent' ? 'badge-warning' : 'badge-neutral'}`}>{r.emergency_level}</span>
                        <span className={`badge ${r.request_status === 'open' ? 'badge-warning' : r.request_status === 'matched' ? 'badge-success' : 'badge-neutral'}`}>{r.request_status}</span>
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && <p className="muted text-sm">No blood requests.</p>}
                </div>
              </div>
            )}

            {tab === 'centers' && (
              <>
                <div className="flex-between mb-4">
                  <h3 style={{ fontSize: '1.15rem' }}>Blood centers & inventory</h3>
                  <button className="btn btn-primary btn-sm" onClick={() => { setEditingCenter(null); setShowCenterForm(true); }}>
                    <Plus size={15} /> Add Center
                  </button>
                </div>
                <div className="grid" style={{ gap: 16 }}>
                  {centers.map((c) => {
                    const inv = inventory.filter((i) => i.blood_center_id === c.id);
                    return (
                      <div key={c.id} className="card">
                        <div className="flex-between wrap mb-4">
                          <div>
                            <h3 style={{ marginBottom: 4 }}>{c.name}</h3>
                            <div className="text-sm muted"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />{c.address ? `${c.address}, ` : ''}{c.area ? `${c.area}, ` : ''}{c.city || ''}</div>
                            {c.phone && <div className="text-sm muted"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />{c.phone}</div>}
                          </div>
                          <div className="flex gap-2">
                            <button className="btn btn-outline btn-sm" onClick={() => setInvModal(c)}>Inventory</button>
                            <button className="btn btn-outline btn-sm" onClick={() => { setEditingCenter(c); setShowCenterForm(true); }}>Edit</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => deleteCenter(c.id)}><Trash2 size={15} style={{ color: 'var(--error-600)' }} /></button>
                          </div>
                        </div>
                        <div className="flex wrap gap-2">
                          {BLOOD_GROUPS.map((g) => {
                            const item = inv.find((i) => i.blood_group === g);
                            const units = item?.available_units ?? 0;
                            return (
                              <div key={g} style={{
                                padding: '6px 10px', borderRadius: 8, minWidth: 48, textAlign: 'center',
                                background: units > 0 ? 'var(--success-50)' : 'var(--neutral-50)',
                                border: `1px solid ${units > 0 ? 'var(--success-100)' : 'var(--border)'}`,
                              }}>
                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: units > 0 ? 'var(--success-600)' : 'var(--neutral-400)' }}>{g}</div>
                                <div className="text-xs muted">{units}u</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {centers.length === 0 && <p className="muted text-sm">No blood centers registered.</p>}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showCenterForm && (
        <CenterFormModal
          center={editingCenter}
          onClose={() => { setShowCenterForm(false); setEditingCenter(null); }}
          onSaved={() => { setShowCenterForm(false); setEditingCenter(null); load(); }}
        />
      )}

      {invModal && (
        <InventoryModal
          center={invModal}
          inventory={inventory.filter((i) => i.blood_center_id === invModal.id)}
          onClose={() => setInvModal(null)}
          onSaved={() => { setInvModal(null); load(); }}
        />
      )}
    </div>
  );
}

function CenterFormModal({ center, onClose, onSaved }: { center: BloodCenter | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(center?.name || '');
  const [address, setAddress] = useState(center?.address || '');
  const [area, setArea] = useState(center?.area || '');
  const [city, setCity] = useState(center?.city || '');
  const [phone, setPhone] = useState(center?.phone || '');
  const [latitude, setLatitude] = useState(center?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(center?.longitude?.toString() || '');
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name, address: address || null, area: area || null, city: city || null, phone: phone || null,
      latitude: latitude ? parseFloat(latitude) : null, longitude: longitude ? parseFloat(longitude) : null,
    };
    if (center) {
      await supabase.from('blood_centers').update(payload).eq('id', center.id);
    } else {
      const { data } = await supabase.from('blood_centers').insert(payload).select('id').single();
      if (data) {
        // Seed empty inventory for all groups
        const invRows = BLOOD_GROUPS.map((g) => ({ blood_center_id: data.id, blood_group: g, available_units: 0 }));
        await supabase.from('blood_inventory').insert(invRows);
      }
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 20 }} onClick={onClose}>
      <div className="card" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex-between mb-4">
          <h3>{center ? 'Edit center' : 'Add blood center'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={save}>
          <div className="form-group">
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Address</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Area</label>
              <input className="input" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">City</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Latitude</label>
              <input className="input" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Longitude</label>
            <input className="input" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? <span className="spinner" /> : <><Save size={16} /> {center ? 'Update' : 'Create'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function InventoryModal({ center, inventory, onClose, onSaved }: { center: BloodCenter; inventory: BloodInventory[]; onClose: () => void; onSaved: () => void }) {
  const [units, setUnits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const m: Record<string, string> = {};
    BLOOD_GROUPS.forEach((g) => {
      const inv = inventory.find((i) => i.blood_group === g);
      m[g] = inv?.available_units?.toString() || '0';
    });
    setUnits(m);
  }, [inventory]);

  const save = async () => {
    setSaving(true);
    for (const g of BLOOD_GROUPS) {
      const inv = inventory.find((i) => i.blood_group === g);
      const val = parseInt(units[g] || '0', 10);
      if (inv) {
        await supabase.from('blood_inventory').update({ available_units: val, last_updated: new Date().toISOString() }).eq('id', inv.id);
      } else {
        await supabase.from('blood_inventory').insert({ blood_center_id: center.id, blood_group: g as BloodGroup, available_units: val });
      }
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 20 }} onClick={onClose}>
      <div className="card" style={{ maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex-between mb-4">
          <div>
            <h3>Update inventory</h3>
            <div className="text-sm muted">{center.name}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          {BLOOD_GROUPS.map((g) => (
            <div key={g} className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">{g} units</label>
              <input type="number" min={0} className="input" value={units[g] || '0'} onChange={(e) => setUnits({ ...units, [g]: e.target.value })} />
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-block mt-4" onClick={save} disabled={saving}>
          {saving ? <span className="spinner" /> : <><Save size={16} /> Save inventory</>}
        </button>
      </div>
    </div>
  );
}
