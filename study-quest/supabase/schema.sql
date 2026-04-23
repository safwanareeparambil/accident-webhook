-- =============================================================
-- Study Quest — Supabase SQL Schema
-- Paste this into the Supabase SQL Editor and run it.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id   UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  exam_name TEXT,
  exam_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own profile"
  ON public.profiles
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 2. habits
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  completed_date DATE,          -- NULL or the date last completed (YYYY-MM-DD)
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own habits"
  ON public.habits
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 3. study_logs
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  hours      NUMERIC(5, 2) NOT NULL CHECK (hours > 0),
  logged_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own study logs"
  ON public.study_logs
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 4. rewards
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rewards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  priority   SMALLINT NOT NULL CHECK (priority BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own rewards"
  ON public.rewards
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
