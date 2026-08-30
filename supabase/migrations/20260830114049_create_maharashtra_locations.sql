/*
# Maharashtra Locations Directory

## Purpose
Creates a reference table of all major cities and villages in Maharashtra, India,
with their coordinates. This allows blood request and search forms to use a
dropdown of known locations instead of free-text, enabling accurate distance
sorting and matching.

## New Tables
1. `maharashtra_locations`
   - `id` (uuid, primary key)
   - `name` (text, not null) — city or village name
   - `district` (text) — district name
   - `type` (text) — 'city' or 'village'
   - `latitude` (double precision)
   - `longitude` (double precision)
   - `created_at` (timestamptz)

## Security
- RLS enabled.
- Readable by all (anon + authenticated) — this is reference data.
- Only admin can insert/update/delete.

## Notes
1. Seeded with ~100+ major Maharashtra cities and villages across all districts.
2. Unique constraint on (name, district) to prevent duplicates.
*/

CREATE TABLE IF NOT EXISTS public.maharashtra_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district text,
  type text NOT NULL DEFAULT 'city' CHECK (type IN ('city','village')),
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, district)
);

ALTER TABLE public.maharashtra_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_select_all" ON public.maharashtra_locations;
CREATE POLICY "locations_select_all"
  ON public.maharashtra_locations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "locations_insert_admin" ON public.maharashtra_locations;
CREATE POLICY "locations_insert_admin"
  ON public.maharashtra_locations FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "locations_update_admin" ON public.maharashtra_locations;
CREATE POLICY "locations_update_admin"
  ON public.maharashtra_locations FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "locations_delete_admin" ON public.maharashtra_locations;
CREATE POLICY "locations_delete_admin"
  ON public.maharashtra_locations FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE INDEX IF NOT EXISTS locations_name_idx ON public.maharashtra_locations(name);
CREATE INDEX IF NOT EXISTS locations_district_idx ON public.maharashtra_locations(district);

-- Seed data: major cities and villages across Maharashtra districts
INSERT INTO public.maharashtra_locations (name, district, type, latitude, longitude) VALUES
-- Mumbai
('Mumbai','Mumbai','city',19.0760,72.8777),
('Andheri','Mumbai','city',19.1197,72.8468),
('Borivali','Mumbai','city',19.2307,72.8567),
('Dadar','Mumbai','city',19.0177,72.8445),
('Bandra','Mumbai','city',19.0690,72.8450),
('Goregaon','Mumbai','city',19.1663,72.8526),
('Kurla','Mumbai','city',19.0720,72.8845),
('Powai','Mumbai','city',19.1176,72.9060),
('Vasai','Palghar','city',19.4235,72.8147),
('Virar','Palghar','city',19.4315,72.8117),
-- Pune
('Pune','Pune','city',18.5204,73.8567),
('Kothrud','Pune','city',18.5074,73.8077),
('Hadapsar','Pune','city',18.5089,73.9317),
('Kharadi','Pune','city',18.5580,73.9430),
('Aundh','Pune','city',18.5588,73.7773),
('Pimpri','Pune','city',18.6298,73.7997),
('Chinchwad','Pune','city',18.6298,73.7997),
('Lonavala','Pune','city',18.7546,73.4062),
('Shirur','Pune','city',18.8296,74.3789),
('Junnar','Pune','city',19.1189,73.8825),
-- Nagpur
('Nagpur','Nagpur','city',21.1458,79.0882),
('Wardha','Wardha','city',20.7453,78.6025),
('Kamptee','Nagpur','city',21.2236,79.1803),
('Hinganghat','Wardha','city',20.5625,78.8436),
('Katol','Nagpur','city',21.2740,78.5920),
('Ramtek','Nagpur','city',21.4000,79.2700),
-- Nashik
('Nashik','Nashik','city',19.9975,73.7898),
('Sinnar','Nashik','city',19.8470,74.0000),
('Niphad','Nashik','city',20.1530,74.0930),
('Malegaon','Nashik','city',20.5535,74.5300),
('Igatpuri','Nashik','city',19.6960,73.5680),
('Kalwan','Nashik','city',20.6667,73.9833),
-- Aurangabad (Chhatrapati Sambhajinagar)
('Aurangabad','Aurangabad','city',19.8762,75.3433),
('Jalna','Jalna','city',19.8416,75.8870),
('Paithan','Aurangabad','city',19.4780,75.4780),
('Vaijapur','Aurangabad','city',19.9400,74.7300),
('Khultabad','Aurangabad','city',20.0167,75.1667),
-- Solapur
('Solapur','Solapur','city',17.6599,75.2566),
('Barshi','Solapur','city',18.2333,75.7000),
('Kurduvadi','Solapur','city',18.0833,75.0833),
('Pandharpur','Solapur','city',17.6800,75.3300),
('Akkalkot','Solapur','city',17.5167,76.2000),
-- Kolhapur
('Kolhapur','Kolhapur','city',16.7050,74.2433),
('Ichalkaranji','Kolhapur','city',16.7000,74.4667),
('Jaysingpur','Kolhapur','city',16.8400,74.5500),
('Panhala','Kolhapur','city',16.8100,74.1100),
('Gargoti','Kolhapur','city',16.1667,74.0000),
-- Amravati
('Amravati','Amravati','city',20.9374,77.7796),
('Achalpur','Amravati','city',21.2580,77.5100),
('Morshi','Amravati','city',21.3180,77.9970),
('Chandur','Amravati','city',20.8333,77.7500),
('Anjangaon','Amravati','city',21.1667,77.3000),
-- Akola
('Akola','Akola','city',20.7000,77.0000),
('Akot','Akola','city',21.0970,77.0500),
('Murtijapur','Akola','city',20.7580,77.3830),
('Telhara','Akola','city',21.3500,76.6833),
-- Nanded
('Nanded','Nanded','city',19.1383,77.3210),
('Loha','Nanded','city',19.0570,77.3180),
('Kandhar','Nanded','city',19.1333,77.4500),
('Mukhed','Nanded','city',18.7000,77.3667),
('Bhokar','Nanded','city',19.2833,77.4667),
-- Jalgaon
('Jalgaon','Jalgaon','city',21.0077,75.5626),
('Bhusawal','Jalgaon','city',21.0430,75.7830),
('Chalisgaon','Jalgaon','city',20.4833,75.2500),
('Amalner','Jalgaon','city',21.0500,75.0667),
('Pachora','Jalgaon','city',20.6700,75.3500),
-- Satara
('Satara','Satara','city',17.6805,74.0183),
('Karad','Satara','city',17.2900,74.1800),
('Phaltan','Satara','city',17.9800,74.5800),
('Wai','Satara','city',17.9200,73.9000),
('Koregaon','Satara','city',17.9833,74.0000),
-- Sangli
('Sangli','Sangli','city',16.8524,74.5815),
('Miraj','Sangli','city',16.8200,74.4300),
('Tasgaon','Sangli','city',17.0333,74.6000),
('Jath','Sangli','city',17.0500,75.1667),
('Kavthemahakal','Sangli','city',16.7000,74.3500),
-- Ratnagiri
('Ratnagiri','Ratnagiri','city',16.9937,73.3140),
('Chiplun','Ratnagiri','city',17.5330,73.3830),
('Khed','Ratnagiri','city',17.7167,73.3833),
('Dapoli','Ratnagiri','city',17.7600,73.1800),
('Guhagar','Ratnagiri','city',17.4833,73.1833),
-- Latur
('Latur','Latur','city',18.4088,76.5604),
('Udgir','Latur','city',18.4000,77.1167),
('Ahmedpur','Latur','city',18.7333,76.3833),
('Ausar','Latur','city',18.5000,76.5000),
('Nilanga','Latur','city',18.6333,76.7667),
-- Beed
('Beed','Beed','city',18.9930,75.7560),
('Parli','Beed','city',19.2667,76.5500),
('Georai','Beed','city',19.2500,75.7500),
('Ashti','Beed','city',19.0833,75.4167),
('Majalgaon','Beed','city',19.1667,76.2000),
-- Dhule
('Dhule','Dhule','city',20.9042,74.7749),
('Shirpur','Dhule','city',21.3500,74.8833),
('Sakri','Dhule','city',21.0833,74.0833),
('Nandurbar','Nandurbar','city',21.3700,74.2400),
('Shahada','Nandurbar','city',21.5500,74.4700),
-- Chandrapur
('Chandrapur','Chandrapur','city',19.9615,79.2961),
('Gadchiroli','Gadchiroli','city',20.1700,80.0000),
('Warora','Chandrapur','city',20.2333,79.0000),
('Ballarpur','Chandrapur','city',19.9500,79.4333),
('Mul','Chandrapur','city',20.0667,79.7500),
-- Yavatmal
('Yavatmal','Yavatmal','city',20.3899,78.1307),
('Wani','Yavatmal','city',20.0500,78.9500),
('Pusad','Yavatmal','city',19.9000,77.5667),
('Digras','Yavatmal','city',20.0667,77.7167),
('Ner','Yavatmal','city',20.1167,77.7000),
-- Bhandara
('Bhandara','Bhandara','city',21.4700,79.6500),
('Gondia','Gondia','city',21.4600,80.2000),
('Tumsar','Bhandara','city',21.4700,79.7300),
('Sakoli','Bhandara','city',21.0500,80.0500),
('Arjuni','Gondia','city',20.9167,80.4167),
-- Washim
('Washim','Washim','city',20.1000,77.1333),
('Risod','Washim','city',20.0333,76.7833),
('Mangrulpir','Washim','city',20.3000,77.3500),
('Malegaon','Washim','city',20.2500,77.2667),
('Karanja','Washim','city',20.4833,77.0833),
-- Hingoli
('Hingoli','Hingoli','city',19.7167,77.1500),
('Basmath','Hingoli','city',19.6667,77.3333),
('Kalamnuri','Hingoli','city',19.6667,77.0333),
('Aundha','Hingoli','city',19.9000,77.0500),
('Sengaon','Hingoli','city',19.9500,76.8500),
-- Buldhana
('Buldhana','Buldhana','city',20.5300,76.1800),
('Khamgaon','Buldhana','city',20.7000,76.5600),
('Malkapur','Buldhana','city',20.9000,76.2000),
('Shegaon','Buldhana','city',20.7833,76.6833),
('Chikhli','Buldhana','city',20.3500,76.3333),
-- Parbhani
('Parbhani','Parbhani','city',19.2683,76.7700),
('Gangakhed','Parbhani','city',19.0833,76.7500),
('Pathri','Parbhani','city',19.2500,76.4500),
('Purna','Parbhani','city',19.1833,77.0500),
('Manwath','Parbhani','city',19.3000,76.5000),
-- Osmanabad
('Osmanabad','Osmanabad','city',18.1833,76.0500),
('Tuljapur','Osmanabad','city',18.0000,76.0833),
('Umarga','Osmanabad','city',18.1667,76.3833),
('Kalamb','Osmanabad','city',18.0833,76.0000),
('Bhoom','Osmanabad','city',18.4667,75.8500),
-- Gadchiroli
('Gadchiroli','Gadchiroli','city',20.1700,80.0000),
('Chamorshi','Gadchiroli','city',19.9833,79.8667),
('Desaiganj','Gadchiroli','city',20.6333,80.0000),
('Aheri','Gadchiroli','city',19.4333,80.0000),
('Bhamragad','Gadchiroli','city',19.0500,80.1500),
-- Raigad
('Panvel','Raigad','city',18.9888,73.1090),
('Alibag','Raigad','city',18.6411,72.8722),
('Pen','Raigad','city',18.7333,73.0833),
('Uran','Raigad','city',18.8667,72.9333),
('Karjat','Raigad','city',18.9167,73.3333),
-- Thane
('Thane','Thane','city',19.2183,72.9781),
('Kalyan','Thane','city',19.2403,73.1305),
('Dombivli','Thane','city',19.2167,73.0833),
('Ulhasnagar','Thane','city',19.2167,73.1667),
('Bhiwandi','Thane','city',19.3000,73.0667),
('Murbad','Thane','city',19.2833,73.4000),
-- Ahmednagar
('Ahmednagar','Ahmednagar','city',19.0952,74.7358),
('Shrirampur','Ahmednagar','city',19.6333,74.6333),
('Sangamner','Ahmednagar','city',19.5333,74.2000),
('Rahuri','Ahmednagar','city',19.3833,74.7167),
('Pathardi','Ahmednagar','city',19.1500,75.1167),
-- Jalna
('Jalna','Jalna','city',19.8416,75.8870),
('Bhokardan','Jalna','city',20.0000,76.0000),
('Ambad','Jalna','city',19.5000,75.8000),
('Ghansawangi','Jalna','city',19.6667,76.2000),
('Jafrabad','Jalna','city',20.0333,76.0500),
-- Sindhudurg
('Kudal','Sindhudurg','city',16.0333,73.6833),
('Vengurla','Sindhudurg','city',15.8667,73.6333),
('Malvan','Sindhudurg','city',16.0500,73.4667),
('Deogad','Sindhudurg','city',16.4667,73.3833),
('Vaibhavwadi','Sindhudurg','city',16.3000,73.6167),
-- Wardha
('Wardha','Wardha','city',20.7453,78.6025),
('Arvi','Wardha','city',20.7833,78.2333),
('Hinganghat','Wardha','city',20.5625,78.8436),
('Samudrapur','Wardha','city',20.8500,78.8500),
('Seloo','Wardha','city',20.7000,78.7000),
-- Bhandara villages
('Bhandara','Bhandara','village',21.4700,79.6500),
('Lakhani','Bhandara','village',21.3000,79.6000),
('Mohadi','Bhandara','village',21.4000,79.7000),
('Pauni','Bhandara','village',20.7833,79.6333),
('Tiroda','Bhandara','village',21.4000,79.8000)
ON CONFLICT (name, district) DO NOTHING;
