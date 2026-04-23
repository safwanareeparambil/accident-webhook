# Study Quest 🎯

A gamified study dashboard built with **React**, **Tailwind CSS**, and **Supabase**.

## Features

| Feature | Description |
|---|---|
| 🔐 Auth | Email/password sign-up & login via Supabase Auth |
| 📊 Dashboard | Exam countdown + weekly study-hours progress bar |
| ✅ Habits | Daily checklist that auto-resets each day |
| 🏆 Vault | CRUD for rewards with priority-based rarity |
| 🎰 Spinner | Weighted-random reward wheel with consolation facts |

## Quick Start

### 1 — Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Copy your **Project URL** and **anon/public key** from *Project Settings → API*.

### 2 — Local development

```bash
# inside study-quest/
cp .env.example .env.local
# edit .env.local and fill in your Supabase credentials

npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Architecture

```
src/
  context/AuthContext.jsx   # Supabase auth session + signUp/signIn/signOut
  lib/supabase.js           # Supabase client initialised from env vars
  components/
    AuthPage.jsx            # Login / Sign-up form
    Dashboard.jsx           # Exam countdown + study-log + progress bar
    HabitList.jsx           # Daily habits checklist
    Vault.jsx               # Rewards CRUD with priority slider
    Spinner.jsx             # Weighted-random wheel (framer-motion)
  App.jsx                   # Tab navigation shell
```

## Weighted Randomizer

For each reward *i* with priority *p_i*:

```
Weight_i = 1 / p_i
P(reward_i) = Weight_i / Σ Weight_all
```

Lower priority → higher weight → more common.
If no reward is hit (empty vault) a random science/math **consolation fact** is shown instead.

## Database Schema

See [`supabase/schema.sql`](supabase/schema.sql) for full DDL including RLS policies.

| Table | Key columns |
|---|---|
| `profiles` | `user_id`, `exam_name`, `exam_date` |
| `habits` | `user_id`, `name`, `completed_date` |
| `study_logs` | `user_id`, `hours`, `logged_at` |
| `rewards` | `user_id`, `name`, `priority (1–10)` |
