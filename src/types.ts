export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type EmergencyLevel = 'normal' | 'urgent' | 'emergency';
export type RequestStatus = 'open' | 'matched' | 'fulfilled' | 'cancelled';
export type UserRole = 'seeker' | 'donor' | 'admin';
export type DonorRequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
export type NotificationType = 'info' | 'request' | 'accept' | 'reject' | 'emergency' | 'system';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  role: UserRole;
  area: string | null;
  city: string | null;
  bio: string | null;
  created_at: string;
}

export interface Donor {
  id: string;
  user_id: string;
  blood_group: BloodGroup;
  age: number | null;
  area: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  availability_status: boolean;
  last_donation_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface BloodRequest {
  id: string;
  seeker_id: string;
  blood_group: BloodGroup;
  required_units: number;
  area: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  emergency_level: EmergencyLevel;
  request_status: RequestStatus;
  notes: string | null;
  created_at: string;
}

export interface BloodCenter {
  id: string;
  name: string;
  address: string | null;
  area: string | null;
  city: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface BloodInventory {
  id: string;
  blood_center_id: string;
  blood_group: BloodGroup;
  available_units: number;
  last_updated: string;
}

export interface DonorRequest {
  id: string;
  blood_request_id: string;
  donor_id: string;
  status: DonorRequestStatus;
  response_time: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface DonorWithProfile extends Donor {
  profiles?: { name: string } | null;
  distance_km?: number;
}

export interface CenterWithInventory extends BloodCenter {
  inventory?: BloodInventory[];
  distance_km?: number;
}
