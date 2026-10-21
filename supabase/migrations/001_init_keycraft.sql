-- Keycraft PostgreSQL Schema & Row Level Security Migration
-- Run this migration in the Supabase SQL Editor or via Supabase CLI (`supabase db push`).

create extension if not exists "pgcrypto";

-- 1. Profiles table (publicly readable display names, never exposes email addresses)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (char_length(username) >= 2 and char_length(username) <= 24),
  created_at timestamptz not null default now()
);

-- 2. Test Results table with server-side validation constraints and duplicate prevention
create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  submission_id text unique not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('timed', 'paragraph')),
  duration_seconds integer not null check (
    (mode = 'timed' and duration_seconds >= 30 and duration_seconds <= 7200 and duration_seconds % 30 = 0)
    or (mode = 'paragraph' and duration_seconds between 1 and 7200)
  ),
  wpm numeric(6,2) not null check (wpm >= 0 and wpm <= 320),
  net_wpm numeric(6,2) check (net_wpm >= 0 and net_wpm <= 320),
  accuracy numeric(5,2) not null check (accuracy >= 0 and accuracy <= 100),
  errors integer not null check (errors >= 0),
  characters_typed integer not null check (characters_typed >= 1 and characters_typed <= 50000),
  correct_characters integer not null check (correct_characters >= 0 and correct_characters <= characters_typed),
  passage_id text,
  created_at timestamptz not null default now()
);

-- 3. Indexes for fast user history and leaderboard queries
create index if not exists idx_test_results_user_created
  on public.test_results (user_id, created_at desc);

create index if not exists idx_test_results_leaderboard
  on public.test_results (mode, duration_seconds, wpm desc, accuracy desc);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.test_results enable row level security;

-- 5. Profiles RLS Policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update only their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 6. Test Results RLS Policies
create policy "Users can read own results and validated leaderboard scores"
  on public.test_results for select
  using (auth.uid() = user_id or (wpm <= 320 and accuracy >= 50));

create policy "Users can insert only their own test results"
  on public.test_results for insert
  to authenticated
  with check (auth.uid() = user_id);
