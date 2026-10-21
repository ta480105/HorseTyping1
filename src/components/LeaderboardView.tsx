import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RefreshCw, Play, ShieldCheck } from 'lucide-react';
import {
  fetchLeaderboard,
  isSupabaseConfigured,
  type PersistedTestResult,
} from '../services/supabaseClient';
import {
  formatDurationLabel,
  type TestMode,
  type TimedDuration,
} from '../engine/typingEngine';

interface LeaderboardViewProps {
  theme: 'dark' | 'light';
  refreshTrigger: number;
  onStartTestWithConfig: (mode: TestMode, duration?: TimedDuration) => void;
}

type LeaderboardCategory =
  | { label: 'Timed · 30 sec'; mode: 'timed'; duration: 30 }
  | { label: 'Timed · 1 min'; mode: 'timed'; duration: 60 }
  | { label: 'Timed · 3 min'; mode: 'timed'; duration: 180 }
  | { label: 'Timed · 6 min'; mode: 'timed'; duration: 360 }
  | { label: 'Paragraph Mode'; mode: 'paragraph'; duration?: undefined };

const CATEGORIES: LeaderboardCategory[] = [
  { label: 'Timed · 30 sec', mode: 'timed', duration: 30 },
  { label: 'Timed · 1 min', mode: 'timed', duration: 60 },
  { label: 'Timed · 3 min', mode: 'timed', duration: 180 },
  { label: 'Timed · 6 min', mode: 'timed', duration: 360 },
  { label: 'Paragraph Mode', mode: 'paragraph' },
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  theme,
  refreshTrigger,
  onStartTestWithConfig,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [entries, setEntries] = useState<PersistedTestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [source, setSource] = useState<'supabase' | 'local'>('local');

  const isDark = theme === 'dark';
  const activeCat = CATEGORIES[selectedIdx];

  const loadRankings = useCallback(async () => {
    setLoading(true);
    const res = await fetchLeaderboard({
      mode: activeCat.mode,
      durationSeconds: activeCat.duration,
    });
    setEntries(res.entries);
    setSource(res.source);
    setLoading(false);
  }, [activeCat]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings, refreshTrigger]);

  return (
    <section
      aria-label="Verified Typing Speed Leaderboard"
      className="w-full max-w-5xl mx-auto py-8 sm:py-10 px-4 sm:px-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-500 mb-1">
            <Trophy className="w-4 h-4" />
            <span>
              {source === 'supabase'
                ? 'Live Supabase PostgreSQL Leaderboard'
                : 'Verified Persisted Scores (Local Storage Mode)'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-xs text-[#8c8a82] mt-1">
            Ranked strictly by highest validated Gross WPM (tie-broken by accuracy) within each distinct mode and duration. Zero fabricated scores.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRankings}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            isDark
              ? 'bg-[#1d1c19] border-[#292824] text-[#e6e4dd] hover:border-amber-500/40'
              : 'bg-white border-[#e2e0d8] text-[#1c1b18] hover:border-amber-600/40'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Leaderboard mode and duration filter"
        className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border mb-6 ${
          isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-[#efede6] border-[#dcd9ce]'
        }`}
      >
        {CATEGORIES.map((cat, idx) => {
          const isSelected = idx === selectedIdx;
          return (
            <button
              key={cat.label}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedIdx(idx)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-amber-500 text-[#181816] font-semibold'
                  : isDark
                  ? 'text-[#9e9c93] hover:text-[#e6e4dd]'
                  : 'text-[#5c5a52] hover:text-[#1c1b18]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Table or Empty State */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
        }`}
      >
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className={`h-10 rounded-lg animate-pulse ${
                  isDark ? 'bg-[#252420]' : 'bg-[#f0efe9]'
                }`}
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-8 h-8 text-amber-500/60 mx-auto mb-3" />
            <h2 className="text-base font-semibold mb-1">
              No Saved Scores Yet for {activeCat.label}
            </h2>
            <p className="text-xs text-[#8c8a82] max-w-md mx-auto mb-5">
              This leaderboard displays only real completed tests saved by users—never placeholder or fabricated accounts. Complete a test in {activeCat.label} and click &ldquo;Save Result&rdquo; to claim Rank #1.
            </p>
            <button
              type="button"
              onClick={() => onStartTestWithConfig(activeCat.mode, activeCat.duration)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-[#181816] hover:bg-amber-400 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start {activeCat.label} Test</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-xs font-medium text-[#8c8a82] ${
                    isDark ? 'border-[#292824] bg-[#181816]/60' : 'border-[#e2e0d8] bg-[#f7f6f2]'
                  }`}
                >
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Typist</th>
                  <th className="py-3 px-4 text-right">WPM</th>
                  <th className="py-3 px-4 text-right">Net WPM</th>
                  <th className="py-3 px-4 text-right">Accuracy</th>
                  <th className="py-3 px-4 text-right">Errors</th>
                  <th className="py-3 px-4 text-right">Mode</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292824]/40 text-sm">
                {entries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-[#252420]/60' : 'hover:bg-[#f7f6f2]'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-amber-500 tabular-nums">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium">{entry.username}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-500 tabular-nums">
                      {entry.wpm.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#8c8a82] tabular-nums">
                      {entry.net_wpm.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 tabular-nums">
                      {entry.accuracy.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {entry.errors}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-[#8c8a82]">
                      {entry.mode === 'timed'
                        ? `Timed (${formatDurationLabel(entry.duration_seconds)})`
                        : `Paragraph (${entry.duration_seconds}s)`}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-[#8c8a82] tabular-nums">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security & Validation Note */}
      <div
        className={`mt-6 p-4 rounded-xl border text-xs flex items-start gap-3 ${
          isDark
            ? 'bg-[#1a1917] border-[#292824] text-[#8c8a82]'
            : 'bg-[#f2f0e8] border-[#dcd9ce] text-[#5c5a52]'
        }`}
      >
        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className={`font-semibold ${isDark ? 'text-[#e6e4dd]' : 'text-[#1c1b18]'}`}>
            Validation & Privacy Policy:
          </span>{' '}
          Public leaderboard queries expose only display usernames (never email addresses). PostgreSQL `CHECK` constraints and Row Level Security enforce plausible bounds (0–320 WPM, ≥50% accuracy, valid character counts, and unique `submission_id` keys).{' '}
          {!isSupabaseConfigured &&
            'Supabase credentials are not currently set in .env, so saved runs are persisted locally on this browser.'}
        </div>
      </div>
    </section>
  );
};
