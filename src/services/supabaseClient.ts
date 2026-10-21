import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import {
  SubmissionRegistry,
  validateResultPayload,
  type ResultSubmissionPayload,
  type TestMode,
} from '../engine/typingEngine';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface PersistedTestResult {
  id: string;
  submission_id: string;
  user_id: string;
  username: string;
  mode: TestMode;
  duration_seconds: number;
  wpm: number;
  net_wpm: number;
  accuracy: number;
  errors: number;
  characters_typed: number;
  correct_characters: number;
  passage_id: string;
  created_at: string;
  source: 'supabase' | 'local';
}

const LOCAL_RESULTS_STORAGE_KEY = 'keycraft_saved_results_v1';
const submissionRegistry = new SubmissionRegistry();

export function getLocalSavedResults(): PersistedTestResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_RESULTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveLocalResultRecord(record: PersistedTestResult): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalSavedResults();
    if (existing.some((r) => r.submission_id === record.submission_id)) {
      return;
    }
    const updated = [record, ...existing].slice(0, 200);
    window.localStorage.setItem(LOCAL_RESULTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearLocalResults(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LOCAL_RESULTS_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function hasSubmissionBeenSaved(submissionId: string): boolean {
  if (submissionRegistry.hasSubmitted(submissionId)) {
    return true;
  }
  const local = getLocalSavedResults();
  return local.some((r) => r.submission_id === submissionId);
}

export async function submitCompletedResult(params: {
  payload: ResultSubmissionPayload;
  username?: string;
  user: User | null;
}): Promise<{
  ok: boolean;
  error?: string;
  record?: PersistedTestResult;
  savedTo: 'supabase' | 'local';
}> {
  const { payload, username, user } = params;

  if (hasSubmissionBeenSaved(payload.submissionId)) {
    return {
      ok: false,
      error: 'This test result has already been saved.',
      savedTo: isSupabaseConfigured && user ? 'supabase' : 'local',
    };
  }

  const validation = validateResultPayload(payload);
  if (!validation.valid) {
    return {
      ok: false,
      error: validation.error ?? 'Result validation failed.',
      savedTo: 'local',
    };
  }

  const safeUsername =
    (username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest Typist')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 24) || 'Typist';

  // If Supabase is configured and the user is authenticated, persist to PostgreSQL with RLS
  if (supabase && user) {
    try {
      // Ensure profile exists
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          username: safeUsername,
        },
        { onConflict: 'id' }
      );

      const { data, error } = await supabase
        .from('test_results')
        .insert({
          submission_id: payload.submissionId,
          user_id: user.id,
          mode: payload.mode,
          duration_seconds: Math.round(payload.durationSeconds),
          wpm: payload.wpm,
          net_wpm: payload.netWpm,
          accuracy: payload.accuracy,
          errors: payload.errors,
          characters_typed: payload.charactersTyped,
          correct_characters: payload.correctCharacters,
          passage_id: payload.passageId ?? null,
        })
        .select('*')
        .single();

      if (error) {
        return {
          ok: false,
          error: `Database save failed: ${error.message}. You can retry saving from the results card.`,
          savedTo: 'supabase',
        };
      }

      submissionRegistry.markSubmitted(payload.submissionId);
      const record: PersistedTestResult = {
        id: data.id,
        submission_id: payload.submissionId,
        user_id: user.id,
        username: safeUsername,
        mode: payload.mode,
        duration_seconds: data.duration_seconds,
        wpm: Number(data.wpm),
        net_wpm: Number(data.net_wpm ?? payload.netWpm),
        accuracy: Number(data.accuracy),
        errors: Number(data.errors),
        characters_typed: Number(data.characters_typed),
        correct_characters: Number(data.correct_characters),
        passage_id: data.passage_id ?? payload.passageId ?? 'default',
        created_at: data.created_at ?? new Date().toISOString(),
        source: 'supabase',
      };
      saveLocalResultRecord(record);
      return { ok: true, record, savedTo: 'supabase' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network failure while saving result.';
      return {
        ok: false,
        error: `${msg} Your completed result is preserved so you can retry.`,
        savedTo: 'supabase',
      };
    }
  }

  // Fallback: save to local persisted storage so guests and offline users can track history & leaderboard
  submissionRegistry.markSubmitted(payload.submissionId);
  const localRecord: PersistedTestResult = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    submission_id: payload.submissionId,
    user_id: user?.id ?? 'local-user',
    username: safeUsername,
    mode: payload.mode,
    duration_seconds: Math.round(payload.durationSeconds),
    wpm: payload.wpm,
    net_wpm: payload.netWpm,
    accuracy: payload.accuracy,
    errors: payload.errors,
    characters_typed: payload.charactersTyped,
    correct_characters: payload.correctCharacters,
    passage_id: payload.passageId ?? 'default',
    created_at: new Date().toISOString(),
    source: 'local',
  };
  saveLocalResultRecord(localRecord);
  return { ok: true, record: localRecord, savedTo: 'local' };
}

export async function fetchUserHistory(user: User | null): Promise<{
  results: PersistedTestResult[];
  source: 'supabase' | 'local';
  error?: string;
}> {
  if (supabase && user) {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*, profiles(username)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return {
          results: getLocalSavedResults(),
          source: 'local',
          error: error.message,
        };
      }

      const mapped: PersistedTestResult[] = (data ?? []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        submission_id: String(row.submission_id ?? row.id),
        user_id: String(row.user_id),
        username:
          (row.profiles as { username?: string } | null)?.username ??
          user.user_metadata?.username ??
          'Typist',
        mode: (row.mode as TestMode) ?? 'timed',
        duration_seconds: Number(row.duration_seconds ?? 60),
        wpm: Number(row.wpm ?? 0),
        net_wpm: Number(row.net_wpm ?? row.wpm ?? 0),
        accuracy: Number(row.accuracy ?? 0),
        errors: Number(row.errors ?? 0),
        characters_typed: Number(row.characters_typed ?? 0),
        correct_characters: Number(row.correct_characters ?? 0),
        passage_id: String(row.passage_id ?? 'default'),
        created_at: String(row.created_at ?? new Date().toISOString()),
        source: 'supabase',
      }));

      return { results: mapped, source: 'supabase' };
    } catch (err) {
      return {
        results: getLocalSavedResults(),
        source: 'local',
        error: err instanceof Error ? err.message : 'Unable to reach Supabase.',
      };
    }
  }

  return {
    results: getLocalSavedResults(),
    source: 'local',
  };
}

export async function fetchLeaderboard(params: {
  mode: TestMode;
  durationSeconds?: number;
}): Promise<{
  entries: PersistedTestResult[];
  source: 'supabase' | 'local';
  error?: string;
}> {
  const { mode, durationSeconds } = params;

  if (supabase) {
    try {
      let query = supabase
        .from('test_results')
        .select('id, submission_id, user_id, mode, duration_seconds, wpm, net_wpm, accuracy, errors, characters_typed, correct_characters, passage_id, created_at, profiles(username)')
        .eq('mode', mode)
        .lte('wpm', 320)
        .gte('accuracy', 50)
        .order('wpm', { ascending: false })
        .order('accuracy', { ascending: false })
        .limit(50);

      if (mode === 'timed' && durationSeconds) {
        query = query.eq('duration_seconds', durationSeconds);
      }

      const { data, error } = await query;
      if (!error && data) {
        const mapped: PersistedTestResult[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          submission_id: String(row.submission_id ?? row.id),
          user_id: String(row.user_id),
          username:
            (row.profiles as { username?: string } | null)?.username ||
            `Typist-${String(row.user_id).slice(0, 6)}`,
          mode: (row.mode as TestMode) ?? 'timed',
          duration_seconds: Number(row.duration_seconds ?? 60),
          wpm: Number(row.wpm ?? 0),
          net_wpm: Number(row.net_wpm ?? row.wpm ?? 0),
          accuracy: Number(row.accuracy ?? 0),
          errors: Number(row.errors ?? 0),
          characters_typed: Number(row.characters_typed ?? 0),
          correct_characters: Number(row.correct_characters ?? 0),
          passage_id: String(row.passage_id ?? 'default'),
          created_at: String(row.created_at ?? new Date().toISOString()),
          source: 'supabase',
        }));
        return { entries: mapped, source: 'supabase' };
      }
    } catch {
      // Fall back to locally persisted results if database table is not yet migrated
    }
  }

  const localAll = getLocalSavedResults().filter((r) => {
    if (r.mode !== mode) return false;
    if (mode === 'timed' && durationSeconds && r.duration_seconds !== durationSeconds) {
      return false;
    }
    return true;
  });

  localAll.sort((a, b) => {
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    return b.accuracy - a.accuracy;
  });

  return {
    entries: localAll.slice(0, 50),
    source: 'local',
  };
}

export const SUPABASE_MIGRATION_SQL = `-- Keycraft PostgreSQL Schema & Row Level Security Migration
-- Run this script in the Supabase SQL Editor to provision persistent profiles, history, and leaderboards.

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
-- Authenticated users can read their own history; validated scores are selectable for the public leaderboard
create policy "Users can read own results and validated leaderboard scores"
  on public.test_results for select
  using (auth.uid() = user_id or (wpm <= 320 and accuracy >= 50));

-- Authenticated users may insert ONLY records associated with their own auth.uid()
create policy "Users can insert only their own test results"
  on public.test_results for insert
  to authenticated
  with check (auth.uid() = user_id);
-- Note: No UPDATE or DELETE policy is granted on test_results so completed scores are immutable.`;
