import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Plus, AlertTriangle, Clock, XCircle, CheckCircle2, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { BloodRequest, DonorRequest, Donor } from '../types';

export default function SeekerDashboard() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donorLinks, setDonorLinks] = useState<Record<string, DonorRequest[]>>({});
  const [donorNames, setDonorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data: reqs } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('seeker_id', session.user.id)
      .order('created_at', { ascending: false });
    setRequests(reqs || []);

    const linksMap: Record<string, DonorRequest[]> = {};
    const donorIds = new Set<string>();
    if (reqs && reqs.length) {
      const { data: links } = await supabase
        .from('donor_requests')
        .select('id, blood_request_id, donor_id, status, response_time, created_at')
        .in('blood_request_id', reqs.map((r) => r.id))
        .order('created_at', { ascending: false });
      (links || []).forEach((l: DonorRequest) => {
        const arr = linksMap[l.blood_request_id] || [];
        arr.push(l);
        linksMap[l.blood_request_id] = arr;
        donorIds.add(l.donor_id);
      });
      setDonorLinks(linksMap);

      if (donorIds.size) {
        const { data: donors } = await supabase
          .from('donors')
          .select('id, user_id')
          .in('id', Array.from(donorIds));
        const userIds = (donors || []).map((d: any) => d.user_id);
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        const nameMap: Record<string, string> = {};
        (donors || []).forEach((d: any) => {
          const prof = (profs || []).find((p: any) => p.id === d.user_id);
          nameMap[d.id] = prof?.name || 'Donor';
        });
        setDonorNames(nameMap);
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [session]);

  const cancelRequest = async (id: string) => {
    setCancelling(id);
    await supabase.from('blood_requests').update({ request_status: 'cancelled' }).eq('id', id);
    setCancelling(null);
    load();
  };

  const statusBadge = (s: string) => {
    if (s === 'open') return <span className="badge badge-warning"><Clock size={12} /> Open</span>;
    if (s === 'matched') return <span className="badge badge-success"><CheckCircle2 size={12} /> Matched</span>;
    if (s === 'fulfilled') return <span className="badge badge-success"><CheckCircle2 size={12} /> Fulfilled</span>;
    return <span className="badge badge-neutral"><XCircle size={12} /> Cancelled</span>;
  };

  const emergencyBadge = (l: string) => {
    if (l === 'emergency') return <span className="badge badge-error"><AlertTriangle size={12} /> Emergency</span>;
    if (l === 'urgent') return <span className="badge badge-warning">Urgent</span>;
    return <span className="badge badge-neutral">Normal</span>;
  };

  return (
    <div className="page">
      <div className="container">
        <div className="flex-between wrap mb-6">
          <div>
            <div className="badge badge-primary mb-2"><Droplet size={13} /> Seeker dashboard</div>
            <h1>Your blood requests</h1>
            <p className="muted">Track your requests and donor responses.</p>
          </div>
          <div className="flex gap-2 wrap">
            <Link to="/request" className="btn btn-primary btn-sm"><Plus size={15} /> New Request</Link>
            <Link to="/emergency" className="btn btn-danger btn-sm"><AlertTriangle size={15} /> Emergency</Link>
            <Link to="/search" className="btn btn-outline btn-sm">Find Blood</Link>
          </div>
        </div>

        {loading && <div className="text-center" style={{ padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>}

        {!loading && requests.length === 0 && (
          <div className="card empty-state">
            <Droplet size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
            <h3>No blood requests yet</h3>
            <p className="text-sm mt-2">Create a blood request to start finding matching donors.</p>
            <Link to="/request" className="btn btn-primary btn-sm mt-4"><Plus size={15} /> Create Request</Link>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="grid" style={{ gap: 16 }}>
            {requests.map((r) => (
              <div key={r.id} className="card">
                <div className="flex-between wrap mb-4">
                  <div className="flex gap-3" style={{ alignItems: 'center' }}>
                    <span className="bg-chip">{r.blood_group}</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{r.required_units} unit(s) needed</div>
                      <div className="text-sm muted">{r.area ? `${r.area}, ` : ''}{r.city || 'Location not set'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 wrap">
                    {emergencyBadge(r.emergency_level)}
                    {statusBadge(r.request_status)}
                  </div>
                </div>
                <div className="text-sm muted">Created {new Date(r.created_at).toLocaleString()}</div>
                {r.notes && <div className="text-sm mt-2" style={{ color: 'var(--neutral-700)' }}>{r.notes}</div>}

                <div className="divider" />

                <div>
                  <div className="text-sm" style={{ fontWeight: 600, marginBottom: 10 }}>Donor responses:</div>
                  {(donorLinks[r.id] || []).length === 0 ? (
                    <div className="text-sm muted">No donors contacted yet for this request.</div>
                  ) : (
                    <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
                      {(donorLinks[r.id] || []).map((l) => (
                        <div key={l.id} className="flex-between" style={{ padding: '8px 12px', background: 'var(--neutral-50)', borderRadius: 10 }}>
                          <span className="text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Send size={13} style={{ color: 'var(--primary-600)' }} />
                            {donorNames[l.donor_id] || 'Donor'}
                          </span>
                          <span className={`badge ${l.status === 'accepted' ? 'badge-success' : l.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                            {l.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {r.request_status === 'open' && (
                  <div className="mt-4">
                    <button className="btn btn-outline btn-sm" disabled={cancelling === r.id} onClick={() => cancelRequest(r.id)}>
                      {cancelling === r.id ? <span className="spinner spinner-dark" /> : <><XCircle size={14} /> Cancel Request</>}
                    </button>
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
