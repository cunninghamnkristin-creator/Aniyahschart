/*
# Aniyah's Family Tracker — Initial Schema

## Overview
Single-tenant family tracker app for Aniyah Franklin. No sign-in screen — the
"Parent Mode" toggle is a client-side PIN gate, not real auth. All tables use
`TO anon, authenticated` policies so the anon-key frontend can read/write.

## Tables
1. `settings` — single row (id=1) holding the parent PIN, star goal, reward
   milestone definitions, strike threshold definitions, and weekly/monthly
   reward unlock state.
2. `behavior_buttons` — configurable positive/negative point buttons shown
   on the Behavior tab. Parents can add/edit/delete these.
3. `behavior_events` — append-only log of every point adjustment (date, points,
   description, category). Daily balance is derived by summing today's rows.
4. `daily_reports` — end-of-day status color (green/yellow/red) per date.
5. `routine_tasks` — configurable checklist items grouped by category
   (morning, after_school, health, cleanup, nighttime, saturday). Includes a
   `is_dynamic` flag for temporary tasks like "brush teeth after sweet".
6. `task_completions` — records which routine task was completed on which date.
7. `homeschool_tasks` — configurable daily homeschool checklist items.
8. `homeschool_completions` — one row per date the full homeschool checklist
   was completed; each row awards 1 Star.
9. `messages` — family message board notes (author = 'aniyah' | 'parent').
10. `needs_list` — shared grocery/shopping list items with a checked-off flag.

## Security
- RLS enabled on every table.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is an intentionally shared single-tenant app with no sign-in.
*/

-- ── settings (single row) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id smallint PRIMARY KEY DEFAULT 1,
  pin text NOT NULL DEFAULT '1234',
  star_goal integer NOT NULL DEFAULT 30,
  reward_milestones jsonb NOT NULL DEFAULT
    '[{"threshold":10,"label":"Classroom VIP Day","unlocked":false},
      {"threshold":20,"label":"Al Fresco Study Session (outdoor picnic)","unlocked":false},
      {"threshold":30,"label":"Local Explorer Day / Virtual Field Trip","unlocked":false}]'::jsonb,
  strike_config jsonb NOT NULL DEFAULT
    '[{"threshold":-2,"label":"Strike 1: Screen Time Suspension","active":false},
      {"threshold":-5,"label":"Strike 2: Dedicated Household Contribution","active":false},
      {"threshold":-8,"label":"Strike 3: Advanced Bedtime","active":false}]'::jsonb,
  cat_nap_pass jsonb NOT NULL DEFAULT
    '{"label":"Cat Nap Pass","description":"45 min extra Friday bedtime","unlocked":false}'::jsonb,
  special_outing jsonb NOT NULL DEFAULT
    '{"label":"Special Solo Outing","description":"Low-budget parent/daughter date","unlocked":false}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_settings" ON settings;
CREATE POLICY "anon_all_settings" ON settings FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ── behavior_buttons ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS behavior_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  points integer NOT NULL,
  type text NOT NULL DEFAULT 'positive' CHECK (type IN ('positive','negative')),
  sort_order integer NOT NULL DEFAULT 0,
  is_preset boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE behavior_buttons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_behavior_buttons" ON behavior_buttons;
CREATE POLICY "anon_all_behavior_buttons" ON behavior_buttons FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- seed default buttons
INSERT INTO behavior_buttons (label, points, type, sort_order) VALUES
  ('Listening the First Time', 1, 'positive', 1),
  ('Doing Extra Things', 2, 'positive', 2),
  ('Backtalking / Arguing', -1, 'negative', 1),
  ('Not Listening / Ignoring You', -2, 'negative', 2),
  ('Stomping / Slamming Doors / Tantrums', -3, 'negative', 3)
ON CONFLICT DO NOTHING;

-- ── behavior_events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS behavior_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date date NOT NULL DEFAULT current_date,
  points integer NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'positive' CHECK (category IN ('positive','negative','makeup','custom_good','custom_bad')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_behavior_events_date ON behavior_events (event_date);

ALTER TABLE behavior_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_behavior_events" ON behavior_events;
CREATE POLICY "anon_all_behavior_events" ON behavior_events FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ── daily_reports ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'green' CHECK (status IN ('green','yellow','red')),
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_daily_reports" ON daily_reports;
CREATE POLICY "anon_all_daily_reports" ON daily_reports FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ── routine_tasks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routine_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  category text NOT NULL CHECK (category IN ('morning','after_school','health','cleanup','nighttime','saturday')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_dynamic boolean NOT NULL DEFAULT false,
  expires_on date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE routine_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_routine_tasks" ON routine_tasks;
CREATE POLICY "anon_all_routine_tasks" ON routine_tasks FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- seed default routine tasks
INSERT INTO routine_tasks (label, category, sort_order) VALUES
  ('Wake up on time', 'morning', 1),
  ('Feed cats (Fill fresh food/water)', 'morning', 2),
  ('Brush hair', 'morning', 3),
  ('Brush teeth', 'morning', 4),
  ('Floss', 'morning', 5),
  ('Wash face', 'morning', 6),
  ('Ready for School (Dressed and prepared)', 'morning', 7),
  ('Check cats (Ensure food/water full)', 'after_school', 1),
  ('Homeschool Assignments completed', 'after_school', 2),
  ('Drink 1 full water bottle', 'health', 1),
  ('Pick up all trash and clothes throughout the house', 'cleanup', 1),
  ('Make sure everything is straightened up', 'cleanup', 2),
  ('Brush teeth', 'nighttime', 1),
  ('Floss', 'nighttime', 2),
  ('Wash face', 'nighttime', 3),
  ('Prepare homeschool workspace for tomorrow', 'nighttime', 4),
  ('Strip Bed Sheets in the Morning', 'saturday', 1),
  ('Pet Grooming & Deep Clean (bath/comb, wash pet bed, clean bowls)', 'saturday', 2)
ON CONFLICT DO NOTHING;

-- ── task_completions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES routine_tasks(id) ON DELETE CASCADE,
  completion_date date NOT NULL DEFAULT current_date,
  completed_at timestamptz DEFAULT now(),
  UNIQUE (task_id, completion_date)
);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions (completion_date);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_task_completions" ON task_completions;
CREATE POLICY "anon_all_task_completions" ON task_completions FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ── homeschool_tasks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homeschool_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE homeschool_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_homeschool_tasks" ON homeschool_tasks;
CREATE POLICY "anon_all_homeschool_tasks" ON homeschool_tasks FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO homeschool_tasks (label, sort_order) VALUES
  ('Math lesson completed', 1),
  ('Reading / Literature', 2),
  ('Writing assignment', 3),
  ('Science exploration', 4)
ON CONFLICT DO NOTHING;

-- ── homeschool_completions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homeschool_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_date date UNIQUE NOT NULL DEFAULT current_date,
  star_awarded boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE homeschool_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_homeschool_completions" ON homeschool_completions;
CREATE POLICY "anon_all_homeschool_completions" ON homeschool_completions FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ── messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL CHECK (author IN ('aniyah','parent')),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_messages" ON messages;
CREATE POLICY "anon_all_messages" ON messages FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ── needs_list ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS needs_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item text NOT NULL,
  checked boolean NOT NULL DEFAULT false,
  added_by text NOT NULL DEFAULT 'parent',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE needs_list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_needs_list" ON needs_list;
CREATE POLICY "anon_all_needs_list" ON needs_list FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
