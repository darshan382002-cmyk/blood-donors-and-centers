import { useEffect, useState } from 'react';
import { User, Mail, Phone, Droplet, Save, MapPin, Calendar, FileText, Pencil, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BLOOD_GROUPS, type BloodGroup, type Donor } from '../types';

export default function Profile() {
  const { session, profile, refreshProfile } = useAuth();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loadingDonor, setLoadingDonor] = useState(true);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [area, setArea] = useState(profile?.area || '');
  const [city, setCity] = useState(profile?.city || '');
  const [bio, setBio] = useState(profile?.bio || '');
  // Donor edit fields
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [available, setAvailable] = useState(true);
  const [lastDonation, setLastDonation] = useState('');
  const [donorArea, setDonorArea] = useState('');
  const [donorCity, setDonorCity] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isDonor = profile?.role === 'donor';

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setArea(profile.area || '');
      setCity(profile.city || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  useEffect(() => {
    (async () => {
      if (!session?.user) return;
      setLoadingDonor(true);
      const { data } = await supabase
        .from('donors')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (data) {
        const d = data as Donor;
        setDonor(d);
        setBloodGroup(d.blood_group);
        setAvailable(d.availability_status);
        setLastDonation(d.last_donation_date || '');
        setDonorArea(d.area || '');
        setDonorCity(d.city || '');
      } else {
        setDonor(null);
      }
      setLoadingDonor(false);
    })();
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setError(null);
    setSaving(true);

    // Update profile
    const { error: pErr } = await supabase
      .from('profiles')
      .update({ name, phone, area: area || null, city: city || null, bio: bio || null })
      .eq('id', session.user.id);
    if (pErr) {
      setSaving(false);
      setError(pErr.message);
      return;
    }

    // If donor, update donor record too
    if (isDonor && donor) {
      const { error: dErr } = await supabase
        .from('donors')
        .update({
          blood_group: bloodGroup,
          availability_status: available,
          last_donation_date: lastDonation || null,
          area: donorArea || null,
          city: donorCity || null,
        })
        .eq('id', donor.id);
      if (dErr) {
        setSaving(false);
        setError(dErr.message);
        return;
      }
    }

    await refreshProfile();
    // Reload donor locally
    const { data: refreshedDonor } = await supabase
      .from('donors')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (refreshedDonor) {
      const d = refreshedDonor as Donor;
      setDonor(d);
      setBloodGroup(d.blood_group);
      setAvailable(d.availability_status);
      setLastDonation(d.last_donation_date || '');
      setDonorArea(d.area || '');
      setDonorCity(d.city || '');
    }

    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    // Reset to current values
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setArea(profile.area || '');
      setCity(profile.city || '');
      setBio(profile.bio || '');
    }
    if (donor) {
      setBloodGroup(donor.blood_group);
      setAvailable(donor.availability_status);
      setLastDonation(donor.last_donation_date || '');
      setDonorArea(donor.area || '');
      setDonorCity(donor.city || '');
    }
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set';

  return (
    <div className="page">
      <div className="container page-narrow">
        <div className="flex-between wrap mb-6">
          <div>
            <div className="badge badge-primary mb-2"><User size={13} /> Profile</div>
            <h1>Your profile</h1>
            <p className="muted">View and update your personal information.</p>
          </div>
          {!editing && (
            <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
              <Pencil size={15} /> Edit Profile
            </button>
          )}
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}
        {saved && <div className="alert alert-success mb-4"><Check size={16} /> Profile updated successfully.</div>}

        {/* ===== VIEW MODE ===== */}
        {!editing && (
          <>
            <div className="card mb-6">
              <div className="flex gap-3" style={{ alignItems: 'center', marginBottom: 24 }}>
                <div className="brand-mark" style={{ width: 56, height: 56, fontSize: 26 }}>
                  <Droplet size={28} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{profile?.name || '—'}</div>
                  <div className="text-sm muted">Role: <span className="badge badge-primary">{profile?.role || '—'}</span></div>
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: 16 }}>
                <div>
                  <div className="text-sm muted mb-1">Full Name</div>
                  <div style={{ fontWeight: 600 }}><User size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--neutral-400)' }} />{profile?.name || '—'}</div>
                </div>
                <div>
                  <div className="text-sm muted mb-1">Email</div>
                  <div style={{ fontWeight: 600 }}><Mail size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--neutral-400)' }} />{session?.user?.email || '—'}</div>
                </div>
                <div>
                  <div className="text-sm muted mb-1">Phone Number</div>
                  <div style={{ fontWeight: 600 }}><Phone size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--neutral-400)' }} />{profile?.phone || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-sm muted mb-1">Account Created</div>
                  <div style={{ fontWeight: 600 }}><Calendar size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--neutral-400)' }} />{profile?.created_at ? fmtDate(profile.created_at) : '—'}</div>
                </div>
                <div>
                  <div className="text-sm muted mb-1">Area</div>
                  <div style={{ fontWeight: 600 }}><MapPin size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--neutral-400)' }} />{profile?.area || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-sm muted mb-1">City</div>
                  <div style={{ fontWeight: 600 }}><MapPin size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--neutral-400)' }} />{profile?.city || 'Not set'}</div>
                </div>
              </div>

              {profile?.bio && (
                <div className="mt-4">
                  <div className="text-sm muted mb-1">About</div>
                  <div style={{ color: 'var(--neutral-700)' }}><FileText size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--neutral-400)' }} />{profile.bio}</div>
                </div>
              )}
            </div>

            {/* Donor info section */}
            {isDonor && (
              <div className="card">
                <div className="flex gap-3" style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Droplet size={20} style={{ color: 'var(--primary-600)' }} />
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Donor Information</h3>
                </div>

                {loadingDonor ? (
                  <div className="text-center" style={{ padding: 20 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>
                ) : !donor ? (
                  <div className="empty-state" style={{ padding: 20 }}>
                    <p className="text-sm muted">You haven't completed your donor registration yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-2" style={{ gap: 16 }}>
                    <div>
                      <div className="text-sm muted mb-1">Blood Group</div>
                      <div className="flex gap-2" style={{ alignItems: 'center' }}>
                        <span className="bg-chip">{donor.blood_group}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm muted mb-1">Donor Availability</div>
                      <span className={`badge ${donor.availability_status ? 'badge-success' : 'badge-neutral'}`}>
                        {donor.availability_status ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm muted mb-1">Last Donation Date</div>
                      <div style={{ fontWeight: 600 }}>{fmtDate(donor.last_donation_date)}</div>
                    </div>
                    <div>
                      <div className="text-sm muted mb-1">Donor Status</div>
                      <span className={`badge ${donor.availability_status ? 'badge-success' : 'badge-warning'}`}>
                        {donor.availability_status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {donor.area && (
                      <div>
                        <div className="text-sm muted mb-1">Donor Area</div>
                        <div style={{ fontWeight: 600 }}>{donor.area}</div>
                      </div>
                    )}
                    {donor.city && (
                      <div>
                        <div className="text-sm muted mb-1">Donor City</div>
                        <div style={{ fontWeight: 600 }}>{donor.city}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ===== EDIT MODE ===== */}
        {editing && (
          <div className="card">
            <form onSubmit={handleSave}>
              <div className="flex-between mb-6">
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Edit Profile</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}><X size={16} /> Cancel</button>
              </div>

              <div className="form-group">
                <label className="label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ paddingLeft: 38 }} required />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ paddingLeft: 38 }} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Area</label>
                  <input className="input" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Your area / locality" />
                </div>
                <div className="form-group">
                  <label className="label">City</label>
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Profile information / About</label>
                <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio about yourself" />
              </div>

              {/* Donor-specific editable fields */}
              {isDonor && donor && (
                <>
                  <hr className="divider" />
                  <h3 style={{ fontSize: '1.05rem', marginBottom: 16, color: 'var(--primary-700)' }}>Donor Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">Blood Group</label>
                      <select className="select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}>
                        {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="label">Availability Status</label>
                      <select className="select" value={available ? 'yes' : 'no'} onChange={(e) => setAvailable(e.target.value === 'yes')}>
                        <option value="yes">Available to donate</option>
                        <option value="no">Not available right now</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">Donor Area</label>
                      <input className="input" value={donorArea} onChange={(e) => setDonorArea(e.target.value)} placeholder="Area for donor matching" />
                    </div>
                    <div className="form-group">
                      <label className="label">Donor City</label>
                      <input className="input" value={donorCity} onChange={(e) => setDonorCity(e.target.value)} placeholder="City for donor matching" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Last Donation Date</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--neutral-400)' }} />
                      <input type="date" className="input" value={lastDonation} onChange={(e) => setLastDonation(e.target.value)} style={{ paddingLeft: 38 }} />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={saving}>
                {saving ? <span className="spinner" /> : <><Save size={18} /> Save Changes</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
