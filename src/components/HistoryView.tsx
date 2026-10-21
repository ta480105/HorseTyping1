import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { History, ArrowUpDown, Award, Play, Trash2 } from 'lucide-react';
import {
  fetchUserHistory,
  clearLocalResults,
  isSupabaseConfigured,
  type PersistedTestResult,
} from '../services/supabaseClient';
import { formatDurationLabel } from '../engine/typingEngine';
import type { User } from '@supabase/supabase-js';

interface HistoryViewProps {
  theme: 'dark' | 'light';
  user: User | null;
  refreshTrigger: number;
  onStartNewTest: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  theme,
  user,
  refreshTrigger,
  onStartNewTest,
}) => {
  const [results, setResults] = useState<PersistedTestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'date' | 'wpm'>('date');
  const [modeFilter, setModeFilter] = useState<'all' | 'timed' | 'paragraph'>('all');

  const isDark = theme === 'dark';

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const res = await fetchUserHistory(user);
    setResults(res.results);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshTrigger]);

  const filteredAndSorted = useMemo(() => {
    const filtered = results.filter((r) =>
      modeFilter === 'all' ? true : r.mode === modeFilter
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === 'wpm') {
        if (b.wpm !== a.wpm) return b.wpm - a.wpm;
        return b.accuracy - a.accuracy;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [results, sortBy, modeFilter]);

  const personalBest = useMemo(() => {
    if (results.length === 0) return null;
    return results.reduce((best, curr) => (curr.wpm > best.wpm ? curr : best), results[0]);
  }, [results]);

  const averageWpm = useMemo(() => {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.wpm, 0);
    return Math.round((sum / results.length) * 10) / 10;
  }, [results]);

  const averageAccuracy = useMemo(() => {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.accuracy, 0);
    return Math.round((sum / results.length) * 10) / 10;
  }, [results]);

  return (
    <section
      aria-label="Personal typing test history and progress"
      className="w-full max-w-5xl mx-auto py-8 sm:py-10 px-4 sm:px-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-500 mb-1">
            <History className="w-4 h-4" />
            <span>
              {user && isSupabaseConfigured
                ? 'Synced Account History (Supabase RLS)'
                : 'Saved Session & Device History'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Test History</h1>
          <p className="text-xs text-[#8c8a82] mt-1">
            Review your completed typing runs, personal best speed, and accuracy progression over time.
          </p>
        </div>

        {results.length > 0 && !user && (
          <button
            type="button"
            onClick={() => {
              clearLocalResults();
              loadHistory();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isDark
                ? 'border-[#292824] text-[#8c8a82] hover:text-red-400 hover:border-red-500/40'
                : 'border-[#e2e0d8] text-[#68665e] hover:text-red-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local History</span>
          </button>
        )}
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#8c8a82] mb-1">
            <span>Personal Best WPM</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-amber-500 tabular-nums">
            {personalBest ? `${personalBest.wpm.toFixed(1)}` : '—'}
          </div>
          <div className="text-[11px] text-[#8c8a82] mt-1">
            {personalBest
              ? `${personalBest.accuracy.toFixed(1)}% accuracy · ${
                  personalBest.mode === 'timed'
                    ? `${formatDurationLabel(personalBest.duration_seconds)} Timed`
                    : 'Paragraph'
                }`
              : 'Save a completed test to record your personal best'}
          </div>
        </div>

        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
          }`}
        >
          <div className="text-xs text-[#8c8a82] mb-1">Average Speed</div>
          <div className="text-3xl font-mono font-bold tabular-nums">
            {results.length > 0 ? `${averageWpm.toFixed(1)} WPM` : '—'}
          </div>
          <div className="text-[11px] text-[#8c8a82] mt-1">
            Across {results.length} saved test{results.length === 1 ? '' : 's'}
          </div>
        </div>

        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
          }`}
        >
          <div className="text-xs text-[#8c8a82] mb-1">Average Accuracy</div>
          <div className="text-3xl font-mono font-bold text-emerald-400 tabular-nums">
            {results.length > 0 ? `${averageAccuracy.toFixed(1)}%` : '—'}
          </div>
          <div className="text-[11px] text-[#8c8a82] mt-1">
            Consistent precision across completed runs
          </div>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          {(['all', 'timed', 'paragraph'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 text-xs font-medium capitalize rounded-lg transition-colors ${
                modeFilter === m
                  ? 'bg-amber-500 text-[#181816] font-semibold'
                  : isDark
                  ? 'bg-[#1d1c19] text-[#9e9c93] border border-[#292824]'
                  : 'bg-white text-[#5c5a52] border border-[#e2e0d8]'
              }`}
            >
              {m === 'all' ? 'All Modes' : m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8c8a82] flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort by:</span>
          </span>
          <button
            type="button"
            onClick={() => setSortBy('date')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              sortBy === 'date'
                ? 'border-amber-500/50 text-amber-500 bg-amber-500/10 font-semibold'
                : isDark
                ? 'border-[#292824] text-[#9e9c93]'
                : 'border-[#e2e0d8] text-[#5c5a52]'
            }`}
          >
            Most Recent
          </button>
          <button
            type="button"
            onClick={() => setSortBy('wpm')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              sortBy === 'wpm'
                ? 'border-amber-500/50 text-amber-500 bg-amber-500/10 font-semibold'
                : isDark
                ? 'border-[#292824] text-[#9e9c93]'
                : 'border-[#e2e0d8] text-[#5c5a52]'
            }`}
          >
            Fastest Speed (WPM)
          </button>
        </div>
      </div>

      {/* History Table or Empty State */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
        }`}
      >
        {loading ? (
          <div className="p-8 text-center text-xs text-[#8c8a82]">Loading test history...</div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-8 h-8 text-amber-500/60 mx-auto mb-3" />
            <h2 className="text-base font-semibold mb-1">No Saved Typing Results Yet</h2>
            <p className="text-xs text-[#8c8a82] max-w-md mx-auto mb-5">
              Complete a Timed or Paragraph typing test and click &ldquo;Save Result&rdquo; on the completion screen to build your personal history and track speed improvements.
            </p>
            <button
              type="button"
              onClick={onStartNewTest}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-[#181816] hover:bg-amber-400 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Take a Typing Test</span>
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
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode & Duration</th>
                  <th className="py-3 px-4 text-right">WPM</th>
                  <th className="py-3 px-4 text-right">Net WPM</th>
                  <th className="py-3 px-4 text-right">Accuracy</th>
                  <th className="py-3 px-4 text-right">Errors</th>
                  <th className="py-3 px-4 text-right">Characters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292824]/40 text-sm">
                {filteredAndSorted.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-[#252420]/60' : 'hover:bg-[#f7f6f2]'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-xs text-[#8c8a82] tabular-nums">
                      {new Date(item.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium capitalize">{item.mode}</span>
                      <span className="text-xs text-[#8c8a82] ml-1.5">
                        ·{' '}
                        {item.mode === 'timed'
                          ? formatDurationLabel(item.duration_seconds)
                          : `${item.duration_seconds}s`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-500 tabular-nums">
                      {item.wpm.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#8c8a82] tabular-nums">
                      {item.net_wpm.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 tabular-nums">
                      {item.accuracy.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {item.errors}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-[#8c8a82] tabular-nums">
                      {item.correct_characters}/{item.characters_typed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
