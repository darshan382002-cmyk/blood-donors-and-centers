import { useEffect, useState } from 'react';
import { Check, X, Droplet, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Donor, BloodRequest, DonorRequest } from '../types';

export default function DonorRequests() {
  const { session } = useAuth();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [links, setLinks] = useState<DonorRequest[]>([]);
  const [requests, setRequests] = useState<Record<string, BloodRequest & { seeker_name?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data: d } = await supabase.from('donors').select('*').eq('user_id', session.user.id).maybeSingle();
    setDonor(d as Donor | null);
    if (d) {
      const { data: lks } = await supabase
        .from('donor_requests')
        .select('id, blood_request_id, donor_id, status, response_time, created_at')
        .eq('donor_id', (d as Donor).id)
        .order('created_at', { ascending: false });
      setLinks(lks || []);

      const reqIds = (lks || []).map((l: DonorRequest) => l.blood_request_id);
      if (reqIds.length) {
        const { data: reqs } = await supabase
          .from('blood_requests')
          .select('*')
          .in('id', reqIds);
        const seekerIds = (reqs || []).map((r: BloodRequest) => r.seeker_id);
        let nameMap: Record<string, string> = {};
        if (seekerIds.length) {
          const { data: profs } = await supabase.from('profiles').select('id, name').in('id', seekerIds);
          (profs || []).forEach((p: any) => { nameMap[p.id] = p.name; });
        }
        const reqMap: Record<string, BloodRequest & { seeker_name?: string }> = {};
        (reqs || []).forEach((r: BloodRequest) => { reqMap[r.id] = { ...r, seeker_name: nameMap[r.seeker_id] || 'Seeker' }; });
        setRequests(reqMap);
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [session]);

  const respond = async (linkId: string, requestId: string, accept: boolean) => {
    setActing(linkId);
    await supabase
      .from('donor_requests')
      .update({ status: accept ? 'accepted' : 'rejected', response_time: new Date().toISOString() })
      .eq('id', linkId);

    // Notify seeker
    const req = requests[requestId];
    if (req) {
      await supabase.from('notifications').insert({
        user_id: req.seeker_id,
        message: accept
          ? `A donor has accepted your ${req.blood_group} blood request.`
          : `A donor has declined your ${req.blood_group} blood request.`,
        notification_type: accept ? 'accept' : 'reject',
      });
      if (accept) {
        await supabase.from('blood_requests').update({ request_status: 'matched' }).eq('id', requestId);
      }
    }
    setActing(null);
    load();
  };

  const emergencyBadge = (l: string) => {
    if (l === 'emergency') return <span className="badge badge-error"><AlertTriangle size={12} /> Emergency</span>;
    if (l === 'urgent') return <span className="badge badge-warning">Urgent</span>;
    return <span className="badge badge-neutral">Normal</span>;
  };

  return (
    <div className="page">
      <div className="container">
        <div className="badge badge-primary mb-2"><Droplet size={13} /> Donor requests</div>
        <h1 style={{ marginBottom: 8 }}>Blood requests for you</h1>
        <p className="muted mb-6">Accept or reject requests that match your blood group.</p>

        {loading && <div className="text-center" style={{ padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>}

        {!loading && links.length === 0 && (
          <div className="card empty-state">
            <Clock size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
            <h3>No requests yet</h3>
            <p className="text-sm mt-2">When a seeker sends you a blood request, it will appear here for you to accept or reject.</p>
          </div>
        )}

        {!loading && links.length > 0 && (
          <div className="grid" style={{ gap: 16 }}>
            {links.map((l) => {
              const req = requests[l.blood_request_id];
              if (!req) return null;
              return (
                <div key={l.id} className="card">
                  <div className="flex-between wrap mb-4">
                    <div className="flex gap-3" style={{ alignItems: 'center' }}>
                      <span className="bg-chip">{req.blood_group}</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>{req.seeker_name} needs {req.required_units} unit(s)</div>
                        <div className="text-sm muted">
                          <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                          {req.area ? `${req.area}, ` : ''}{req.city || 'Location not set'} · {new Date(req.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 wrap">
                      {emergencyBadge(req.emergency_level)}
                      <span className={`badge ${l.status === 'accepted' ? 'badge-success' : l.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{l.status}</span>
                    </div>
                  </div>
                  {req.notes && <div className="text-sm mb-4" style={{ color: 'var(--neutral-700)', background: 'var(--neutral-50)', padding: 12, borderRadius: 10 }}>{req.notes}</div>}
                  {l.status === 'pending' && (
                    <div className="flex gap-2">
                      <button className="btn btn-success btn-sm" disabled={acting === l.id} onClick={() => respond(l.id, l.blood_request_id, true)}>
                        {acting === l.id ? <span className="spinner" /> : <><Check size={15} /> Accept</>}
                      </button>
                      <button className="btn btn-outline btn-sm" disabled={acting === l.id} onClick={() => respond(l.id, l.blood_request_id, false)}>
                        <X size={15} /> Reject
                      </button>
                    </div>
                  )}
                  {l.response_time && (
                    <div className="text-xs muted mt-3">Responded {new Date(l.response_time).toLocaleString()}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
