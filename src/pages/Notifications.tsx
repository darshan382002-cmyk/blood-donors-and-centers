import { useEffect, useState } from 'react';
import { Bell, Check, AlertTriangle, Send, Heart, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Notification, NotificationType } from '../types';

const iconFor = (t: NotificationType) => {
  switch (t) {
    case 'emergency': return <AlertTriangle size={16} style={{ color: 'var(--error-600)' }} />;
    case 'request': return <Send size={16} style={{ color: 'var(--primary-600)' }} />;
    case 'accept': return <Check size={16} style={{ color: 'var(--success-600)' }} />;
    case 'reject': return <Heart size={16} style={{ color: 'var(--neutral-500)' }} />;
    case 'system': return <Info size={16} style={{ color: 'var(--secondary-600)' }} />;
    default: return <Bell size={16} style={{ color: 'var(--neutral-500)' }} />;
  }
};

export default function Notifications() {
  const { session } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [session]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    load();
  };

  const markAllRead = async () => {
    const unread = items.filter((i) => !i.is_read).map((i) => i.id);
    if (!unread.length) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unread);
    load();
  };

  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <div className="page">
      <div className="container page-narrow">
        <div className="flex-between wrap mb-6">
          <div>
            <div className="badge badge-primary mb-2"><Bell size={13} /> Notifications</div>
            <h1>Your alerts</h1>
            <p className="muted">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}.</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-outline btn-sm" onClick={markAllRead}>
              <Check size={15} /> Mark all read
            </button>
          )}
        </div>

        {loading && <div className="text-center" style={{ padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>}

        {!loading && items.length === 0 && (
          <div className="card empty-state">
            <Bell size={28} style={{ margin: '0 auto 12px', color: 'var(--neutral-400)' }} />
            <h3>No notifications yet</h3>
            <p className="text-sm mt-2">You'll be notified when donors respond to your requests or when emergency alerts are sent.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid" style={{ gap: 10 }}>
            {items.map((n) => (
              <div key={n.id} className={`card ${n.notification_type === 'emergency' && !n.is_read ? '' : ''}`} style={{
                padding: 16,
                borderColor: n.notification_type === 'emergency' && !n.is_read ? 'var(--error-200)' : 'var(--border)',
                background: !n.is_read ? (n.notification_type === 'emergency' ? 'var(--error-50)' : 'var(--primary-50)') : 'white',
              }}>
                <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
                  <span style={{ marginTop: 2 }}>{iconFor(n.notification_type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: n.is_read ? 500 : 600 }}>{n.message}</div>
                    <div className="text-xs muted mt-2">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {!n.is_read && (
                    <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.id)}>
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
