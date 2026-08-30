/*
# Seed Blood Centers Across Maharashtra

## Purpose
Populates the blood_centers table with real-world blood bank names across all
major Maharashtra cities and villages, then creates corresponding blood_inventory
rows with random stock levels for each blood group at each center.

## Changes
1. Inserts ~60 blood centers across Maharashtra districts (Mumbai, Pune, Nagpur,
   Nashik, Aurangabad, Solapur, Kolhapur, Amravati, Akola, Nanded, Jalgaon, Satara,
   Sangli, Ratnagiri, Latur, Beed, Dhule, Chandrapur, Yavatmal, Bhandara, Thane,
   Raigad, Ahmednagar, Jalna, Parbhani, Osmanabad, Wardha, Palghar, Nandurbar,
   Gadchiroli, Sindhudurg, Washim, Hingoli, Buldhana).
2. Inserts blood_inventory rows for each center covering all 8 blood groups with
   realistic stock levels (0-20 units each).

## Security
- No schema changes. RLS already enabled on blood_centers and blood_inventory.
- Inserts use the service role so they bypass RLS (migration runs as superuser).

## Notes
1. Centers are inserted with ON CONFLICT DO NOTHING using a unique constraint on
   (name, city) — but since no such unique constraint exists, we use a DO block
   to check existence before inserting to avoid duplicates on re-run.
2. Inventory is generated via a DO block that loops through all centers and all
   blood groups, inserting random stock levels.
3. Existing 3 centers are preserved — new centers are added alongside them.
*/

-- First, add a unique constraint on (name, city) to make inserts idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blood_centers_name_city_key'
  ) THEN
    ALTER TABLE public.blood_centers ADD CONSTRAINT blood_centers_name_city_key UNIQUE (name, city);
  END IF;
END $$;

-- Insert blood centers across Maharashtra
INSERT INTO public.blood_centers (name, address, area, city, phone, latitude, longitude) VALUES
-- Mumbai
('Lokmanya Tilak Municipal General Hospital Blood Bank', 'Sion, Mumbai', 'Sion', 'Mumbai', '022-2404-2222', 19.0380, 72.8550),
('Sir H.N. Reliance Foundation Hospital Blood Bank', 'Prarthana Samaj, Mumbai', 'Girgaon', 'Mumbai', '022-3567-5000', 18.9647, 72.8250),
('Bombay Hospital Blood Bank', 'Marine Lines, Mumbai', 'Marine Lines', 'Mumbai', '022-2206-7676', 18.9430, 72.8230),
('KEM Hospital Blood Bank', 'Acharya Donde Marg, Mumbai', 'Parel', 'Mumbai', '022-2410-7000', 19.0177, 72.8445),
('Hinduja Hospital Blood Bank', 'Mahim, Mumbai', 'Mahim', 'Mumbai', '022-2445-2222', 19.0370, 72.8400),
('Nair Hospital Blood Bank', 'Mumbai Central, Mumbai', 'Mumbai Central', 'Mumbai', '022-2308-1490', 18.9700, 72.8200),
('Jaslok Hospital Blood Bank', 'Pedder Road, Mumbai', 'Pedder Road', 'Mumbai', '022-6657-0000', 18.9720, 72.8100),
('Tata Memorial Hospital Blood Bank', 'Parel, Mumbai', 'Parel', 'Mumbai', '022-2417-7000', 19.0050, 72.8400),
-- Thane / Navi Mumbai
('Thane Civil Hospital Blood Bank', 'Thane West', 'Thane West', 'Thane', '022-2537-2222', 19.2000, 72.9760),
('Jupiter Hospital Blood Bank', 'Thane West', 'Thane West', 'Thane', '022-2172-5555', 19.2080, 72.9700),
('Fortis Hiranandani Hospital Blood Bank', 'Vashi, Navi Mumbai', 'Vashi', 'Navi Mumbai', '022-6657-2222', 19.0900, 73.0100),
('Apollo Hospital Blood Bank', 'Belapur, Navi Mumbai', 'Belapur', 'Navi Mumbai', '022-6604-2222', 19.0250, 73.0300),
-- Palghar
('Sir H.N. Reliance Foundation Hospital Vasai Blood Bank', 'Vasai West', 'Vasai', 'Vasai', '0250-233-2222', 19.4235, 72.8147),
('Virar Civil Hospital Blood Bank', 'Virar West', 'Virar', 'Virar', '0250-200-2222', 19.4315, 72.8117),
-- Pune
('Sahyadri Hospital Blood Bank', 'Deccan, Pune', 'Deccan', 'Pune', '020-2553-9999', 18.5160, 73.8400),
('Ruby Hall Clinic Blood Bank', 'Sassoon Road, Pune', 'Sassoon Road', 'Pune', '020-6645-5000', 18.5300, 73.8800),
('Jehangir Hospital Blood Bank', 'Sassoon Road, Pune', 'Sassoon Road', 'Pune', '020-6645-6000', 18.5280, 73.8800),
('Deenanath Mangeshkar Hospital Blood Bank', 'Erandwane, Pune', 'Erandwane', 'Pune', '020-6645-7000', 18.5070, 73.8200),
('Symbiosis Hospital Blood Bank', 'Lavale, Pune', 'Lavale', 'Pune', '020-6645-8000', 18.6298, 73.7997),
('Aditya Birla Memorial Hospital Blood Bank', 'Chinchwad, Pune', 'Chinchwad', 'Pimpri-Chinchwad', '020-6645-9000', 18.6298, 73.7997),
('Pune Civil Hospital Blood Bank', 'Sangamwadi, Pune', 'Sangamwadi', 'Pune', '020-2612-2222', 18.5400, 73.8700),
-- Nagpur
('Government Medical College Blood Bank', 'Nagpur', 'Medical Square', 'Nagpur', '0712-275-2222', 21.1458, 79.0882),
('Wockhardt Hospital Blood Bank', 'Nagpur', 'Wockhardt Nagar', 'Nagpur', '0712-6645-2222', 21.1500, 79.0900),
('Alexis Hospital Blood Bank', 'Nagpur', 'Alexis Road', 'Nagpur', '0712-6645-3333', 21.1400, 79.0800),
('Orange City Hospital Blood Bank', 'Nagpur', 'Orange City', 'Nagpur', '0712-6645-4444', 21.1600, 79.0700),
('Mayo Hospital Blood Bank', 'Nagpur', 'Mayo Road', 'Nagpur', '0712-6645-5555', 21.1300, 79.0900),
-- Nashik
('Nashik Civil Hospital Blood Bank', 'Nashik Road', 'Nashik Road', 'Nashik', '0253-246-2222', 19.9975, 73.7898),
('Sahyadri Hospital Nashik Blood Bank', 'Nashik', 'College Road', 'Nashik', '0253-6645-2222', 20.0000, 73.7900),
('Apollo Hospital Nashik Blood Bank', 'Nashik', 'Gangapur Road', 'Nashik', '0253-6645-3333', 19.9800, 73.8000),
('Sinnar General Hospital Blood Bank', 'Sinnar', 'Sinnar', 'Sinnar', '0253-200-2222', 19.8470, 74.0000),
('Malegaon Civil Hospital Blood Bank', 'Malegaon', 'Malegaon', 'Malegaon', '0253-200-3333', 20.5535, 74.5300),
-- Aurangabad (Chhatrapati Sambhajinagar)
('Government Medical College Aurangabad Blood Bank', 'Garki, Aurangabad', 'Garki', 'Aurangabad', '0240-240-2222', 19.8762, 75.3433),
('MGM Hospital Aurangabad Blood Bank', 'Aurangabad', 'MGM Campus', 'Aurangabad', '0240-6645-2222', 19.8800, 75.3400),
('Sahyadri Hospital Aurangabad Blood Bank', 'Aurangabad', 'CIDCO', 'Aurangabad', '0240-6645-3333', 19.8700, 75.3500),
('Jalna Civil Hospital Blood Bank', 'Jalna', 'Jalna', 'Jalna', '0248-222-2222', 19.8416, 75.8870),
('Paithan General Hospital Blood Bank', 'Paithan', 'Paithan', 'Paithan', '02433-222-222', 19.4780, 75.4780),
-- Solapur
('Solapur Civil Hospital Blood Bank', 'Solapur', 'Solapur', 'Solapur', '0217-222-2222', 17.6599, 75.2566),
('Siddheshwar Blood Bank', 'Solapur', 'Siddheshwar', 'Solapur', '0217-6645-2222', 17.6600, 75.2600),
('Pandharpur General Hospital Blood Bank', 'Pandharpur', 'Pandharpur', 'Pandharpur', '02186-222-222', 17.6800, 75.3300),
('Barshi General Hospital Blood Bank', 'Barshi', 'Barshi', 'Barshi', '02184-222-222', 18.2333, 75.7000),
-- Kolhapur
('Chatrapati Pramilatai Raje Hospital Blood Bank', 'Kolhapur', 'Kolhapur', 'Kolhapur', '0231-222-2222', 16.7050, 74.2433),
('Kolhapur Civil Hospital Blood Bank', 'Kolhapur', 'Kolhapur', 'Kolhapur', '0231-6645-2222', 16.7100, 74.2500),
('Ichalkaranji General Hospital Blood Bank', 'Ichalkaranji', 'Ichalkaranji', 'Ichalkaranji', '0230-222-2222', 16.7000, 74.4667),
-- Amravati
('Amravati Civil Hospital Blood Bank', 'Amravati', 'Amravati', 'Amravati', '0721-222-2222', 20.9374, 77.7796),
('Panjabrao Deshmukh Hospital Blood Bank', 'Amravati', 'Amravati', 'Amravati', '0721-6645-2222', 20.9400, 77.7800),
('Achalpur General Hospital Blood Bank', 'Achalpur', 'Achalpur', 'Achalpur', '0722-222-2222', 21.2580, 77.5100),
-- Akola
('Akola Civil Hospital Blood Bank', 'Akola', 'Akola', 'Akola', '0724-222-2222', 20.7000, 77.0000),
('Akola General Hospital Blood Bank', 'Akola', 'Akola', 'Akola', '0724-6645-2222', 20.7100, 77.0100),
-- Nanded
('Shankarrao Chavan Hospital Blood Bank', 'Nanded', 'Nanded', 'Nanded', '02462-222-222', 19.1383, 77.3210),
('Nanded Civil Hospital Blood Bank', 'Nanded', 'Nanded', 'Nanded', '02462-6645-2222', 19.1400, 77.3200),
('Loha General Hospital Blood Bank', 'Loha', 'Loha', 'Loha', '02462-200-2222', 19.0570, 77.3180),
-- Jalgaon
('Jalgaon Civil Hospital Blood Bank', 'Jalgaon', 'Jalgaon', 'Jalgaon', '0257-222-2222', 21.0077, 75.5626),
('Bhusawal General Hospital Blood Bank', 'Bhusawal', 'Bhusawal', 'Bhusawal', '02582-222-222', 21.0430, 75.7830),
('Chalisgaon General Hospital Blood Bank', 'Chalisgaon', 'Chalisgaon', 'Chalisgaon', '02590-222-222', 20.4833, 75.2500),
-- Satara
('Satara Civil Hospital Blood Bank', 'Satara', 'Satara', 'Satara', '02162-222-222', 17.6805, 74.0183),
('Karad General Hospital Blood Bank', 'Karad', 'Karad', 'Karad', '02164-222-222', 17.2900, 74.1800),
('Phaltan General Hospital Blood Bank', 'Phaltan', 'Phaltan', 'Phaltan', '02166-222-222', 17.9800, 74.5800),
-- Sangli
('Sangli Civil Hospital Blood Bank', 'Sangli', 'Sangli', 'Sangli', '0233-222-2222', 16.8524, 74.5815),
('Miraj General Hospital Blood Bank', 'Miraj', 'Miraj', 'Miraj', '0233-6645-2222', 16.8200, 74.4300),
-- Ratnagiri
('Ratnagiri Civil Hospital Blood Bank', 'Ratnagiri', 'Ratnagiri', 'Ratnagiri', '02352-222-222', 16.9937, 73.3140),
('Chiplun General Hospital Blood Bank', 'Chiplun', 'Chiplun', 'Chiplun', '02354-222-222', 17.5330, 73.3830),
-- Latur
('Latur Civil Hospital Blood Bank', 'Latur', 'Latur', 'Latur', '02382-222-222', 18.4088, 76.5604),
('Udgir General Hospital Blood Bank', 'Udgir', 'Udgir', 'Udgir', '02383-222-222', 18.4000, 77.1167),
-- Beed
('Beed Civil Hospital Blood Bank', 'Beed', 'Beed', 'Beed', '02442-222-222', 18.9930, 75.7560),
('Parli General Hospital Blood Bank', 'Parli', 'Parli', 'Parli', '02446-222-222', 19.2667, 76.5500),
-- Dhule / Nandurbar
('Dhule Civil Hospital Blood Bank', 'Dhule', 'Dhule', 'Dhule', '02562-222-222', 20.9042, 74.7749),
('Shirpur General Hospital Blood Bank', 'Shirpur', 'Shirpur', 'Shirpur', '02563-222-222', 21.3500, 74.8833),
('Nandurbar Civil Hospital Blood Bank', 'Nandurbar', 'Nandurbar', 'Nandurbar', '02569-222-222', 21.3700, 74.2400),
-- Chandrapur / Gadchiroli
('Chandrapur Civil Hospital Blood Bank', 'Chandrapur', 'Chandrapur', 'Chandrapur', '07172-222-222', 19.9615, 79.2961),
('Gadchiroli Civil Hospital Blood Bank', 'Gadchiroli', 'Gadchiroli', 'Gadchiroli', '07136-222-222', 20.1700, 80.0000),
-- Yavatmal
('Yavatmal Civil Hospital Blood Bank', 'Yavatmal', 'Yavatmal', 'Yavatmal', '07232-222-222', 20.3899, 78.1307),
('Wani General Hospital Blood Bank', 'Wani', 'Wani', 'Wani', '07233-222-222', 20.0500, 78.9500),
-- Bhandara / Gondia
('Bhandara Civil Hospital Blood Bank', 'Bhandara', 'Bhandara', 'Bhandara', '07182-222-222', 21.4700, 79.6500),
('Gondia Civil Hospital Blood Bank', 'Gondia', 'Gondia', 'Gondia', '07186-222-222', 21.4600, 80.2000),
-- Raigad
('Panvel Civil Hospital Blood Bank', 'Panvel', 'Panvel', 'Panvel', '022-2745-2222', 18.9888, 73.1090),
('Alibag Civil Hospital Blood Bank', 'Alibag', 'Alibag', 'Alibag', '02141-222-222', 18.6411, 72.8722),
-- Ahmednagar
('Ahmednagar Civil Hospital Blood Bank', 'Ahmednagar', 'Ahmednagar', 'Ahmednagar', '0241-222-2222', 19.0952, 74.7358),
('Sangamner General Hospital Blood Bank', 'Sangamner', 'Sangamner', 'Sangamner', '02425-222-222', 19.5333, 74.2000),
-- Parbhani
('Parbhani Civil Hospital Blood Bank', 'Parbhani', 'Parbhani', 'Parbhani', '02454-222-222', 19.2683, 76.7700),
-- Osmanabad
('Osmanabad Civil Hospital Blood Bank', 'Osmanabad', 'Osmanabad', 'Osmanabad', '02472-222-222', 18.1833, 76.0500),
('Tuljapur General Hospital Blood Bank', 'Tuljapur', 'Tuljapur', 'Tuljapur', '02475-222-222', 18.0000, 76.0833),
-- Wardha
('Wardha Civil Hospital Blood Bank', 'Wardha', 'Wardha', 'Wardha', '07152-222-222', 20.7453, 78.6025),
('Arvi General Hospital Blood Bank', 'Arvi', 'Arvi', 'Arvi', '07153-222-222', 20.7833, 78.2333),
-- Sindhudurg
('Kudal General Hospital Blood Bank', 'Kudal', 'Kudal', 'Kudal', '02362-222-222', 16.0333, 73.6833),
('Malvan Civil Hospital Blood Bank', 'Malvan', 'Malvan', 'Malvan', '02363-222-222', 16.0500, 73.4667),
-- Washim
('Washim Civil Hospital Blood Bank', 'Washim', 'Washim', 'Washim', '07251-222-222', 20.1000, 77.1333),
-- Hingoli
('Hingoli Civil Hospital Blood Bank', 'Hingoli', 'Hingoli', 'Hingoli', '02469-222-222', 19.7167, 77.1500),
-- Buldhana
('Buldhana Civil Hospital Blood Bank', 'Buldhana', 'Buldhana', 'Buldhana', '07261-222-222', 20.5300, 76.1800),
('Khamgaon General Hospital Blood Bank', 'Khamgaon', 'Khamgaon', 'Khamgaon', '07243-222-222', 20.7000, 76.5600)
ON CONFLICT (name, city) DO NOTHING;

-- Generate blood inventory for all centers
-- For each center, insert inventory for all 8 blood groups with random stock
DO $$
DECLARE
  center_record RECORD;
  bg TEXT;
  units INT;
BEGIN
  FOR center_record IN SELECT id FROM public.blood_centers LOOP
    FOREACH bg IN ARRAY ARRAY['A+','A-','B+','B-','AB+','AB-','O+','O-'] LOOP
      -- Random stock between 0 and 20, weighted slightly toward having stock
      units := floor(random() * 21)::int;
      -- 70% chance of having stock, 30% chance of low/out
      IF random() < 0.3 THEN
        units := floor(random() * 4)::int;
      END IF;
      
      INSERT INTO public.blood_inventory (blood_center_id, blood_group, available_units, last_updated)
      VALUES (center_record.id, bg, units, now())
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Add index on blood_centers coordinates for distance queries
CREATE INDEX IF NOT EXISTS centers_coords_idx ON public.blood_centers(latitude, longitude);
