import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplet, MapPin, Calendar, ToggleLeft, ToggleRight, CheckCircle2, Clock, History, Inbox, CheckCircle, AlertTriangle, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Donor, BloodRequest, DonorRequest as DRL } from '../types';

export default function DonorDashboard() {
  const { session, profile } = useAuth();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [matchingRequests, setMatchingRequests] = useState<(BloodRequest & { seeker_name?: string })[]>([]);
  const [myResponses, setMyResponses] = useState<DRL[]>([]);
  const [historyReqs, setHistoryReqs] = useState<Record<string, BloodRequest & { seeker_name?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);

    const { data: d, error: dErr } = await supabase
      .from('donors')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (dErr) {
      setError('Unable to load donor information. Please try again.');
      setLoading(false);
      return;
    }
    setDonor(d as Donor | null);

    if (d) {
      const donorData = d as Donor;

      // Matching open requests for this donor's blood group
      const { data: reqs } = await supabase
        .from('blood_requests')
        .select('id, seeker_id, blood_group, required_units, area, city, latitude, longitude, emergency_level, request_status, notes, created_at')
        .eq('blood_group', donorData.blood_group)
        .eq('request_status', 'open')
        .order('created_at', { ascending: false });

      const seekerIds = (reqs || []).map((r: BloodRequest) => r.seeker_id);
      let nameMap: Record<string, string> = {};
      if (seekerIds.length) {
        const { data: profs } = await supabase.from('profiles').select('id, name').in('id', seekerIds);
        (profs || []).forEach((p: any) => { nameMap[p.id] = p.name; });
      }
      setMatchingRequests((reqs || []).map((r: BloodRequest) => ({ ...r, seeker_name: nameMap[r.seeker_id] || 'Seeker' })));

      // My responses (donor_requests targeting me)
      const { data: links } = await supabase
        .from('donor_requests')
        .select('id, blood_request_id, donor_id, status, response_time, created_at')
        .eq('donor_id', donorData.id)
        .order('created_at', { ascending: false });
      setMyResponses(links || []);

      // Build history map from linked requests
      const reqIds = (links || []).map((l: DRL) => l.blood_request_id);
      if (reqIds.length) {
        const { data: histReqs } = await supabase
          .from('blood_requests')
          .select('*')
          .in('id', reqIds);
        const histSeekerIds = (histReqs || []).map((r: BloodRequest) => r.seeker_id);
        let histNameMap: Record<string, string> = {};
        if (histSeekerIds.length) {
          const { data: hProfs } = await supabase.from('profiles').select('id, name').in('id', histSeekerIds);
          (hProfs || []).forEach((p: any) => { histNameMap[p.id] = p.name; });
        }
        const hMap: Record<string, BloodRequest & { seeker_name?: string }> = {};
        (histReqs || []).forEach((r: BloodRequest) => { hMap[r.id] = { ...r, seeker_name: histNameMap[r.seeker_id] || 'Seeker' }; });
        setHistoryReqs(hMap);
      } else {
        setHistoryReqs({});
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [session]);

  const toggleAvailability = async () => {
    if (!donor) return;
    setToggling(true);
    const { error } = await supabase
      .from('donors')
      .update({ availability_status: !donor.availability_status })
      .eq('id', donor.id);
    setToggling(false);
    if (error) {
      setError('Unable to update availability. Please try again.');
      return;
    }
    load();
  };

  const pendingCount = myResponses.filter((l) => l.status === 'pending').length;
  const acceptedCount = myResponses.filter((l) => l.status === 'accepted').length;

  const emergencyBadge = (l: string) => {
    if (l === 'emergency') return <span className="badge badge-error"><AlertTriangle size={12} /> Emergency</span>;
    if (l === 'urgent') return <span className="badge badge-warning">Urgent</span>;
    return <span className="badge badge-neutral">Normal</span>;
  };

  const statusBadge = (s: string) => {
    if (s === 'accepted') return <span className="badge badge-success">Accepted</span>;
    if (s === 'rejected') return <span className="badge badge-error">Rejected</span>;
    if (s === 'completed') return <span className="badge badge-secondary">Completed</span>;
    return <span className="badge badge-warning">Pending</span>;
  };

  return (
    <div className="page">
      <div className="container">
        <div className="flex-between wrap mb-6">
          <div>
            <div className="badge badge-primary mb-2"><Droplet size={13} /> Donor Dashboard</div>
            <h1>Welcome, {profile?.name || 'Donor'}</h1>
            <p className="muted">Manage your availability and respond to blood requests.</p>
          </div>
          <div className="flex gap-2 wrap">
            <Link to="/donor/requests" className="btn btn-outline btn-sm"><Inbox size={15} /> View Blood Requests</Link>
            <Link to="/donor-register" className="btn btn-outline btn-sm"><Pencil size={15} /> Update Profile</Link>
          </div>
        </div>

        {error && <div className="alert alert-error mb-6">{error}</div>}

        {loading && <div className="text-center" style={{ padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>}

        {!loading && !donor && (
          <div className="card empty-state">
            <Droplet size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
            <h3>Complete your donor profile</h3>
            <p className="text-sm mt-2">Add your blood group and location to start receiving matching requests.</p>
            <Link to="/donor-register" className="btn btn-primary btn-sm mt-4">Register as Donor</Link>
          </div>
        )}

        {!loading && donor && (
          <>
            {/* Info cards */}
            <div className="grid grid-3 mb-6">
              <div className="card">
                <div className="text-sm muted mb-2">Blood Group</div>
                <div className="flex gap-3" style={{ alignItems: 'center' }}>
                  <span className="bg-chip" style={{ fontSize: '1.3rem', padding: '8px 16px' }}>{donor.blood_group}</span>
                </div>
              </div>
              <div className="card">
                <div className="text-sm muted mb-2">Location</div>
                <div className="flex gap-2" style={{ alignItems: 'center' }}>
                  <MapPin size={16} style={{ color: 'var(--secondary-600)' }} />
                  <span style={{ fontWeight: 600 }}>{donor.area ? `${donor.area}, ` : ''}{donor.city || 'Not set'}</span>
                </div>
              </div>
              <div className="card">
                <div className="text-sm muted mb-2">Availability</div>
                <button
                  className="btn btn-sm"
                  style={{
                    background: donor.availability_status ? 'var(--success-100)' : 'var(--neutral-100)',
                    color: donor.availability_status ? 'var(--success-600)' : 'var(--neutral-600)',
                  }}
                  onClick={toggleAvailability}
                  disabled={toggling}
                >
                  {toggling ? <span className="spinner spinner-dark" /> : donor.availability_status ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {donor.availability_status ? 'Available' : 'Unavailable'}
                </button>
                <div className="text-xs muted mt-2">
                  {donor.availability_status ? 'Click to make unavailable' : 'Click to make available'}
                </div>
              </div>
            </div>

            {/* Last donation + stats */}
            <div className="grid grid-4 mb-6">
              <div className="card stat-card">
                <Calendar size={20} style={{ color: 'var(--accent-600)' }} />
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'Not set'}</div>
                <div className="stat-label">Last Donation</div>
              </div>
              <div className="card stat-card">
                <Clock size={20} style={{ color: 'var(--warning-600)' }} />
                <div className="stat-value">{pendingCount}</div>
                <div className="stat-label">Pending Requests</div>
              </div>
              <div className="card stat-card">
                <CheckCircle size={20} style={{ color: 'var(--success-600)' }} />
                <div className="stat-value">{acceptedCount}</div>
                <div className="stat-label">Accepted Requests</div>
              </div>
              <div className="card stat-card">
                <Inbox size={20} style={{ color: 'var(--secondary-600)' }} />
                <div className="stat-value">{matchingRequests.length}</div>
                <div className="stat-label">Matching Open Requests</div>
              </div>
            </div>

            {/* Matching blood requests */}
            <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Matching Blood Requests</h2>
            {matchingRequests.length === 0 ? (
              <div className="card empty-state mb-6">
                <Clock size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
                <h3>No matching requests right now</h3>
                <p className="text-sm mt-2">When a seeker creates a request for {donor.blood_group} blood, it will appear here.</p>
              </div>
            ) : (
              <div className="grid mb-8" style={{ gap: 12 }}>
                {matchingRequests.map((r) => {
                  const alreadyResponded = myResponses.some((l) => l.blood_request_id === r.id);
                  return (
                    <div key={r.id} className="result-row">
                      <div className="result-info">
                        <span className="bg-chip">{r.blood_group}</span>
                        <div className="result-meta">
                          <span className="result-name">{r.seeker_name} needs {r.required_units} unit(s)</span>
                          <span className="result-sub">{r.area ? `${r.area}, ` : ''}{r.city || ''} · {new Date(r.created_at).toLocaleString()}</span>
                        </div>
                        {emergencyBadge(r.emergency_level)}
                      </div>
                      <div className="result-actions">
                        {alreadyResponded ? (
                          <span className="badge badge-neutral"><CheckCircle2 size={13} /> Responded</span>
                        ) : (
                          <Link to="/donor/requests" className="btn btn-primary btn-sm">View</Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Donation / Request History */}
            <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}><History size={20} style={{ display: 'inline', marginRight: 8, color: 'var(--primary-600)' }} /> Donation / Request History</h2>
            {myResponses.length === 0 ? (
              <div className="card empty-state">
                <History size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
                <h3>No donation history yet</h3>
                <p className="text-sm mt-2">Your request responses and donations will appear here.</p>
              </div>
            ) : (
              <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'var(--neutral-500)' }}>Request ID</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'var(--neutral-500)' }}>Blood Group</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'var(--neutral-500)' }}>Requester</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'var(--neutral-500)' }}>Location</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'var(--neutral-500)' }}>Request Date</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'var(--neutral-500)' }}>Status</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'var(--neutral-500)' }}>Emergency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myResponses.map((l) => {
                      const req = historyReqs[l.blood_request_id];
                      if (!req) return null;
                      return (
                        <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem', fontFamily: 'monospace' }}>{l.blood_request_id.slice(0, 8)}…</td>
                          <td style={{ padding: '10px 12px' }}><span className="bg-chip" style={{ fontSize: '0.78rem', padding: '2px 8px' }}>{req.blood_group}</span></td>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{req.seeker_name || 'Seeker'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{req.area ? `${req.area}, ` : ''}{req.city || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '10px 12px' }}>{statusBadge(l.status)}</td>
                          <td style={{ padding: '10px 12px' }}>{emergencyBadge(req.emergency_level)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
