-- South Bay / El Segundo ("the Gundo") seed companies
-- Hand-curated from public funding news 2024-2026. Funding figures approximate;
-- refine via TBPN ingestion in Phase 5. lat/lng geocoded to city-level centroids.
-- Run against teenalpha dev DB after 20260414_companies_and_pathways.sql.

INSERT INTO public.companies
  (name, description, website, sector, interest_categories, teen_roles, micro_experiment,
   address, city, region, latitude, longitude, distance_from_center,
   funding_stage, hiring_signal, source)
VALUES
  -- Aerospace / Space
  ('Varda Space Industries',
   'In-space manufacturing of pharmaceuticals and materials on orbiting capsules.',
   'https://www.varda.com', 'space',
   ARRAY['building','systems'], ARRAY['tour','open-house'],
   'Attend a Varda open house or follow a re-entry capsule launch livestream.',
   NULL, 'El Segundo', 'CA', 33.9192, -118.4165, 0,
   'Series B', true, 'manual'),

  ('Impulse Space',
   'In-space transportation — last-mile orbital maneuvering vehicles.',
   'https://www.impulsespace.com', 'space',
   ARRAY['building','systems'], ARRAY['intern','tour'],
   'Build a model orbital transfer vehicle and simulate a delta-v burn.',
   NULL, 'Redondo Beach', 'CA', 33.8492, -118.3884, 3,
   'Series B', true, 'manual'),

  ('K2 Space',
   'Large, low-cost satellites — a new class of mega-satellites for LEO and beyond.',
   'https://www.k2space.com', 'space',
   ARRAY['building','systems'], ARRAY['intern','tour'],
   'Research satellite bus architectures and design a mission poster.',
   NULL, 'Torrance', 'CA', 33.8358, -118.3406, 5,
   'Series A', true, 'manual'),

  ('Apex Space',
   'Productized satellite buses — Aries platform for fast commercial missions.',
   'https://www.apexspace.com', 'space',
   ARRAY['building','systems'], ARRAY['intern','tour','open-house'],
   'Tour the Apex factory to see a satellite bus assembled.',
   NULL, 'Los Angeles', 'CA', 34.0194, -118.4108, 4,
   'Series D', true, 'manual'),

  -- Defense / Hard tech
  ('Hadrian',
   'Autonomous precision parts factory for aerospace and defense.',
   'https://www.hadrian.co', 'manufacturing',
   ARRAY['building','systems'], ARRAY['intern','tour','workshop'],
   'Visit the factory floor and watch a CNC machine cycle a part.',
   NULL, 'Torrance', 'CA', 33.8358, -118.3406, 5,
   'Series B', true, 'manual'),

  ('Mach Industries',
   'Next-generation defense hardware — propulsion and energetics.',
   'https://www.machindustries.com', 'defense',
   ARRAY['building','systems','competing'], ARRAY['intern','tour'],
   'Design a simple rocket motor on paper and calculate thrust.',
   NULL, 'Huntington Beach', 'CA', 33.6603, -117.9992, 12,
   'Series B', true, 'manual'),

  ('Castelion',
   'Low-cost hypersonic weapon systems for US defense.',
   'https://www.castelion.com', 'defense',
   ARRAY['building','systems','competing'], ARRAY['intern'],
   'Study hypersonic flight regimes and present on the physics.',
   NULL, 'El Segundo', 'CA', 33.9192, -118.4165, 0,
   'Series A', true, 'manual'),

  ('Neros Technologies',
   'American-made attritable drones for defense.',
   'https://www.neros.com', 'defense',
   ARRAY['building','systems','competing'], ARRAY['intern','workshop'],
   'Build and fly an FPV drone at a local park.',
   NULL, 'El Segundo', 'CA', 33.9192, -118.4165, 0,
   'Series A', true, 'manual'),

  ('Senra Systems',
   'Automated wire harness manufacturing for aerospace and defense.',
   'https://www.senrasystems.com', 'manufacturing',
   ARRAY['building','systems'], ARRAY['intern','tour'],
   'Disassemble an old appliance and trace its wire harness.',
   NULL, 'El Segundo', 'CA', 33.9192, -118.4165, 0,
   'Series A', true, 'manual'),

  ('Rangeview',
   'Low-cost cruise missiles and defense propulsion.',
   'https://www.rangeview.com', 'defense',
   ARRAY['building','systems'], ARRAY['intern'],
   'Model a simple cruise flight path in Python.',
   NULL, 'El Segundo', 'CA', 33.9192, -118.4165, 0,
   'Seed', true, 'manual'),

  -- Energy / Nuclear
  ('Radiant Nuclear',
   'Portable nuclear microreactors (Kaleidos) for off-grid power.',
   'https://www.radiantnuclear.com', 'energy',
   ARRAY['systems','building'], ARRAY['intern','tour'],
   'Research how nuclear microreactors work and present a 1-page brief.',
   NULL, 'El Segundo', 'CA', 33.9192, -118.4165, 0,
   'Series C', true, 'manual'),

  ('Antora Energy',
   'Thermal batteries — store renewable electricity as heat for industry.',
   'https://www.antoraenergy.com', 'energy',
   ARRAY['systems','building'], ARRAY['intern','tour'],
   'Build a thermos experiment and measure heat loss over time.',
   NULL, 'Sunnyvale', 'CA', 37.3688, -122.0363, 300,
   'Series B', true, 'manual'),

  -- Manufacturing / Auto
  ('Divergent Technologies',
   'AI-designed, 3D-printed vehicle and aerospace structures.',
   'https://www.divergent3d.com', 'manufacturing',
   ARRAY['building','systems','deconstructing'], ARRAY['intern','tour'],
   'Design a lightweight bracket in Fusion 360 and calculate stress.',
   NULL, 'Torrance', 'CA', 33.8358, -118.3406, 5,
   'Series D', true, 'manual'),

  ('Atomic Industries',
   'AI-driven tool-and-die manufacturing for injection molding.',
   'https://www.atomicindustries.com', 'manufacturing',
   ARRAY['building','systems'], ARRAY['intern','tour'],
   'Study the injection molding process and identify 3 real-world products.',
   NULL, 'El Segundo', 'CA', 33.9192, -118.4165, 0,
   'Series A', true, 'manual'),

  -- Robotics / AI
  ('Chaos Industries',
   'Next-generation radar and electronic defense systems.',
   'https://www.chaosindustries.com', 'defense',
   ARRAY['systems','competing'], ARRAY['intern'],
   'Research radar physics and present the Doppler effect visually.',
   NULL, 'El Segundo', 'CA', 33.9192, -118.4165, 0,
   'Series C', true, 'manual'),

  ('Saronic',
   'Autonomous surface vessels for defense and maritime operations.',
   'https://www.saronic.com', 'defense',
   ARRAY['systems','building'], ARRAY['intern'],
   'Build a simple RC boat and add basic autonomy (GPS waypoint).',
   NULL, 'Austin', 'TX', 30.2672, -97.7431, 1200,
   'Series B', true, 'manual'),

  -- Biotech / Healthtech in LA
  ('Midi Health',
   'Women''s midlife telehealth — perimenopause and menopause care.',
   'https://www.joinmidi.com', 'healthtech',
   ARRAY['systems'], ARRAY['mentorship'],
   'Interview 3 adults about healthcare access gaps and write up findings.',
   NULL, 'Los Angeles', 'CA', 34.0522, -118.2437, 15,
   'Series D', true, 'manual'),

  -- Geospatial / 3D
  ('CyberCity 3D',
   '3D geospatial city modeling and GIS SaaS.',
   'https://www.cybercity3d.com', 'technology',
   ARRAY['systems','building'], ARRAY['intern','workshop'],
   'Build a 3D map of your neighborhood in Blender or SketchUp.',
   NULL, 'El Segundo', 'CA', 33.9192, -118.4165, 0,
   'Seed', false, 'manual'),

  -- Water / Climate
  ('Moleaer',
   'Industrial-scale nanobubble systems for water treatment and agriculture.',
   'https://www.moleaer.com', 'climate',
   ARRAY['systems','deconstructing'], ARRAY['intern','tour'],
   'Run a simple plant-growth experiment comparing aerated vs still water.',
   NULL, 'Carson', 'CA', 33.8317, -118.2820, 8,
   'Series C', true, 'manual');
