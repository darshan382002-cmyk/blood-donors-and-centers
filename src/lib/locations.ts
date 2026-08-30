import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface MaharashtraLocation {
  id: string;
  name: string;
  district: string | null;
  type: string;
  latitude: number | null;
  longitude: number | null;
}

export function useMaharashtraLocations() {
  const [locations, setLocations] = useState<MaharashtraLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('maharashtra_locations')
        .select('id, name, district, type, latitude, longitude')
        .order('name', { ascending: true });
      setLocations(data || []);
      setLoading(false);
    })();
  }, []);

  return { locations, loading };
}

export async function sendSmsNotification(
  requestId: string,
  bloodGroup: string,
  emergencyLevel: string,
  locationName: string,
  seekerPhone: string | null
): Promise<{ success: boolean; donorsNotified: number; message: string }> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms-notification`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        request_id: requestId,
        blood_group: bloodGroup,
        emergency_level: emergencyLevel,
        location_name: locationName,
        seeker_phone: seekerPhone,
      }),
    });
    if (!res.ok) throw new Error(`SMS notification failed (${res.status})`);
    const data = await res.json();
    return {
      success: data.success ?? false,
      donorsNotified: data.donors_notified ?? 0,
      message: data.message ?? 'Request submitted successfully.',
    };
  } catch {
    return { success: false, donorsNotified: 0, message: 'Request submitted, but notification delivery failed.' };
  }
}
