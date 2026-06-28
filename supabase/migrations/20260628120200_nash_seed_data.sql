-- ════════════════════════════════════════════════════════════════
-- NASH OVERHAUL — Step 18 (partial): foundational seed data
-- ════════════════════════════════════════════════════════════════
-- Idempotent seeds: current season, the 15 NASH sports, competition tiers,
-- and the NASH national + 10 provincial organisations.

-- ── Current season ──────────────────────────────────────────────────────────
INSERT INTO public.nash_seasons (academic_year, term, name, is_active, is_current, start_date, end_date)
SELECT '2026', 3, 'Term 3 2026', true, true, DATE '2026-09-08', DATE '2026-12-04'
WHERE NOT EXISTS (SELECT 1 FROM public.nash_seasons WHERE academic_year = '2026' AND term = 3);

-- ── Sports ──────────────────────────────────────────────────────────────────
INSERT INTO public.nash_sports
  (code, name, full_name, gender, scoring_type, periods, period_duration_minutes,
   has_extra_time, has_penalties, has_suspension, age_groups, primary_term,
   min_squad_size, max_squad_size, players_on_field, icon_name)
VALUES
  ('HB','Handball','Association Handball','both','goals_halves',2,30,false,true,true,ARRAY['U16','U18','Open'],3,12,16,7,'Hand'),
  ('NB','Netball','Netball','girls','goals_quarters',4,15,false,false,false,ARRAY['U16','U18','Open'],3,10,12,7,'Target'),
  ('FB','Football','Association Football','both','goals_halves',2,45,true,true,false,ARRAY['U16','U18','Open'],2,16,18,11,'CircleDot'),
  ('AT','Athletics','Track & Field Athletics','both','time_based',NULL,NULL,false,false,false,ARRAY['U14','U16','U18','Open'],1,NULL,NULL,NULL,'Timer'),
  ('BK','Basketball','Basketball','both','points_quarters',4,10,true,false,false,ARRAY['U16','U18','Open'],2,10,12,5,'Dribbble'),
  ('VB','Volleyball','Volleyball','both','rally_scoring',5,NULL,false,false,false,ARRAY['U16','U18','Open'],2,10,12,6,'Volleyball'),
  ('SW','Swimming','Swimming','both','time_based',NULL,NULL,false,false,false,ARRAY['U14','U16','U18','Open'],1,NULL,NULL,NULL,'Waves'),
  ('CR','Cricket','Cricket','boys','runs_wickets',NULL,NULL,false,false,false,ARRAY['U16','U18','Open'],1,11,15,11,'Disc'),
  ('RG','Rugby','Rugby Union','boys','tries_conversions',2,35,true,false,true,ARRAY['U16','U18','Open'],2,15,23,15,'Shield'),
  ('HK','Hockey','Field Hockey','both','goals_quarters',4,15,false,false,true,ARRAY['U16','U18','Open'],2,11,16,11,'Hexagon'),
  ('TN','Tennis','Tennis','both','sets_games',NULL,NULL,false,false,false,ARRAY['U14','U16','U18','Open'],1,1,4,1,'CircleDashed'),
  ('XC','Cross Country','Cross Country Running','both','position_based',NULL,NULL,false,false,false,ARRAY['U14','U16','U18','Open'],1,NULL,NULL,NULL,'Footprints'),
  ('TT','Table Tennis','Table Tennis','both','sets_games',NULL,NULL,false,false,false,ARRAY['U16','U18','Open'],3,1,4,1,'Circle'),
  ('BD','Badminton','Badminton','both','sets_games',NULL,NULL,false,false,false,ARRAY['U16','U18','Open'],3,1,4,1,'Feather'),
  ('CH','Chess','Chess','both','position_based',NULL,NULL,false,false,false,ARRAY['U14','U16','U18','Open'],NULL,1,6,1,'Crown')
ON CONFLICT (code) DO NOTHING;

-- ── Competition tiers ───────────────────────────────────────────────────────
INSERT INTO public.nash_competition_tiers
  (code, name, level_order, advances_count, requires_card_verification, requires_ss_integration, min_ss_package)
VALUES
  ('zonal','Zonal',1,1,false,false,NULL),
  ('district','District',2,1,false,false,NULL),
  ('provincial','Provincial',3,1,true,true,'standard'),
  ('national','National (NASH Games)',4,1,true,true,'professional')
ON CONFLICT (code) DO NOTHING;

-- ── NASH national + provincial organisations ────────────────────────────────
INSERT INTO public.nash_organisations (type, level, name, is_active)
SELECT 'nash','national','NASH National Office', true
WHERE NOT EXISTS (SELECT 1 FROM public.nash_organisations WHERE type='nash' AND level='national');

INSERT INTO public.nash_organisations (type, level, name, province, parent_id, is_active)
SELECT 'nash','provincial', prov || ' Schools Sports Association', prov,
       (SELECT id FROM public.nash_organisations WHERE type='nash' AND level='national' LIMIT 1),
       true
FROM (VALUES
  ('Harare'),('Bulawayo'),('Manicaland'),('Mashonaland Central'),
  ('Mashonaland East'),('Mashonaland West'),('Masvingo'),
  ('Matabeleland North'),('Matabeleland South'),('Midlands')
) AS p(prov)
WHERE NOT EXISTS (
  SELECT 1 FROM public.nash_organisations o
  WHERE o.type='nash' AND o.level='provincial' AND o.province = p.prov
);
