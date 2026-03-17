-- Supabase schema for Placement Priorities Live.
-- Run this in your Supabase SQL editor, not from the app.

create table if not exists public.factors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('core', 'secondary', 'blue_sky')),
  description text,
  sort_order integer,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  anonymous_token text unique,
  finalized boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.response_items (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses (id) on delete cascade,
  factor_id uuid not null references public.factors (id),
  stack_position integer not null,
  strength_value integer not null check (strength_value between 1 and 5),
  created_at timestamp with time zone not null default now(),
  unique (response_id, factor_id),
  unique (response_id, stack_position)
);

-- Seed factors from plan.md
insert into public.factors (name, category)
values
  -- Core Factors
  ('Overall academic level', 'core'),
  ('Subject-specific achievement', 'core'),
  ('Set / pathway', 'core'),
  ('Learning support needs (LS)', 'core'),
  ('EAL / language support needs', 'core'),
  ('Classroom behaviour', 'core'),
  ('Behaviour alerts', 'core'),
  ('Work habits / organisation', 'core'),
  ('Effort / engagement level', 'core'),
  ('Hard avoids', 'core'),
  ('Preferential avoids', 'core'),
  ('Teacher / student preference / avoid', 'core'),
  ('Social-emotional needs', 'core'),
  ('Students requiring specific environments', 'core'),
  ('Students who should not be isolated', 'core'),
  ('Class size limits', 'core'),

  -- Secondary Factors
  ('Spreading high achievers', 'secondary'),
  ('Avoiding clustering of low attainment', 'secondary'),
  ('Avoiding too many high-need students in one class', 'secondary'),
  ('Distributing strong role models', 'secondary'),
  ('Friendship preferences', 'secondary'),
  ('Sociogram data', 'secondary'),
  ('Communication strength', 'secondary'),
  ('Gender balance', 'secondary'),
  ('Nationality balance', 'secondary'),
  ('Language mix', 'secondary'),
  ('Balancing workload across teachers', 'secondary'),
  ('Matching class profile to teacher strengths', 'secondary'),

  -- Blue Sky Factors
  ('Chronic lateness patterns', 'blue_sky'),
  ('Absentee clustering', 'blue_sky'),
  ('Attendance volatility', 'blue_sky'),
  ('Improving vs declining students', 'blue_sky'),
  ('Sudden drops or spikes in grades', 'blue_sky'),
  ('Stability vs volatility in grades', 'blue_sky'),
  ('High effort, low outcome students', 'blue_sky'),
  ('Low effort, high ability students', 'blue_sky'),
  ('Students consistently rated differently across teachers', 'blue_sky'),
  ('Outlier students in grading patterns', 'blue_sky'),
  ('Behaviour issues linked to subjects / time of day', 'blue_sky'),
  ('Participation in sports teams', 'blue_sky'),
  ('Participation in performing arts', 'blue_sky'),
  ('Participation in clubs / service groups', 'blue_sky'),
  ('Number of activities involved in', 'blue_sky'),
  ('Students who are always in the same teams/clubs', 'blue_sky'),
  ('Strong co-curricular friend groups', 'blue_sky'),
  ('Team captains', 'blue_sky'),
  ('Club leaders', 'blue_sky'),
  ('Student council / house leaders', 'blue_sky'),
  ('High service involvement', 'blue_sky'),
  ('STEM-heavy students', 'blue_sky'),
  ('Arts-focused students', 'blue_sky'),
  ('Sports-dominant students', 'blue_sky'),
  ('Connector students involved in multiple groups', 'blue_sky'),
  ('House system participation', 'blue_sky'),
  ('Academic alerts', 'blue_sky');

