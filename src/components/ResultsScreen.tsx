import React, { useState } from 'react';
import {
  RotateCcw,
  Shuffle,
  Home,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import {
  formatElapsedMMSS,
  type TypingState,
  type TypingStats,
  type WpmSample,
} from '../engine/typingEngine';
import { getPassageById } from '../data/passages';
import {
  submitCompletedResult,
  hasSubmissionBeenSaved,
  isSupabaseConfigured,
} from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface ResultsScreenProps {
  state: TypingState;
  stats: TypingStats;
  timeline: WpmSample[];
  theme: 'dark' | 'light';
  user: User | null;
  localUsername: string;
  onRestartSame: () => void;
  onTryAnotherParagraph: () => void;
  onBackToHome: () => void;
  onResultSaved: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  state,
  stats,
  timeline,
  theme,
  user,
  localUsername,
  onRestartSame,
  onTryAnotherParagraph,
  onBackToHome,
  onResultSaved,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [alreadySaved, setAlreadySaved] = useState<boolean>(() =>
    hasSubmissionBeenSaved(state.submissionId)
  );

  const isDark = theme === 'dark';
  const passageMeta = getPassageById(state.passageId);
  const actualDurationSec = Math.max(1, Math.round(stats.elapsedMs / 1000));
  const formattedElapsed = formatElapsedMMSS(stats.elapsedMs || actualDurationSec * 1000);

  const handleSave = async () => {
    if (alreadySaved || isSaving) return;
    setIsSaving(true);
    setSaveMessage(null);

    const durationForRecord =
      state.mode === 'timed' ? state.durationSeconds : actualDurationSec;

    const res = await submitCompletedResult({
      payload: {
        submissionId: state.submissionId,
        userId: user?.id ?? 'local-guest',
        mode: state.mode,
        durationSeconds: durationForRecord,
        wpm: stats.wpm,
        netWpm: stats.netWpm,
        accuracy: stats.accuracy,
        errors: stats.currentErrors,
        charactersTyped: stats.charactersTyped,
        correctCharacters: stats.correctCharacters,
        passageId: state.passageId,
      },
      username: localUsername || user?.user_metadata?.username,
      user,
    });

    setIsSaving(false);
    if (res.ok) {
      setAlreadySaved(true);
      setSaveMessage({
        type: 'success',
        text:
          res.savedTo === 'supabase'
            ? 'Result verified and saved to your Supabase account history and leaderboard.'
            : 'Result saved to your local History & Leaderboard on this device.',
      });
      onResultSaved();
    } else {
      setSaveMessage({
        type: 'error',
        text: res.error ?? 'Could not save result. Please retry.',
      });
    }
  };

  const chartSamples: WpmSample[] =
    timeline.length > 1
      ? timeline
      : [
          { second: 0, wpm: 0, rawWpm: 0, accuracy: 100, errors: 0 },
          {
            second: actualDurationSec,
            wpm: stats.wpm,
            rawWpm: stats.rawWpm,
            accuracy: stats.accuracy,
            errors: stats.currentErrors,
          },
        ];

  const maxChartWpm = Math.max(60, ...chartSamples.map((s) => Math.max(s.wpm, s.rawWpm)));
  const chartWidth = 640;
  const chartHeight = 140;

  const wpmPoints = chartSamples
    .map((sample, idx) => {
      const x =
        chartSamples.length <= 1
          ? chartWidth
          : (idx / (chartSamples.length - 1)) * (chartWidth - 32) + 16;
      const y = chartHeight - 20 - (sample.wpm / maxChartWpm) * (chartHeight - 40);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const rawPoints = chartSamples
    .map((sample, idx) => {
      const x =
        chartSamples.length <= 1
          ? chartWidth
          : (idx / (chartSamples.length - 1)) * (chartWidth - 32) + 16;
      const y = chartHeight - 20 - (sample.rawWpm / maxChartWpm) * (chartHeight - 40);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <section
      aria-label="Completed typing test results"
      data-testid="results-screen"
      className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6"
    >
      {/* Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-500 mb-1">
            <Award className="w-4 h-4" />
            <span>
              {state.mode === 'timed'
                ? `Timed Test Completed (${formatElapsedMMSS(state.durationSeconds * 1000)})`
                : 'Paragraph Completed (100% Verified)'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Performance Summary
          </h1>
          <p className="text-xs text-[#8c8a82] mt-1">
            Passage:{' '}
            {state.passageId === 'custom-passage'
              ? 'Custom Practice Passage'
              : passageMeta.title}{' '}
            · Actual elapsed time: {formattedElapsed} ({actualDurationSec}s) · Mode:{' '}
            {state.mode === 'timed' ? 'Timed' : 'Paragraph'}
          </p>
        </div>

        {/* Save Result Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={alreadySaved || isSaving}
            data-testid="save-result-btn"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              alreadySaved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                : 'bg-amber-500 text-[#181816] hover:bg-amber-400'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>
              {alreadySaved
                ? 'Result Saved'
                : isSaving
                ? 'Saving...'
                : user && isSupabaseConfigured
                ? 'Save Result to Account'
                : 'Save Result to History'}
            </span>
          </button>
        </div>
      </div>

      {/* Save Status Feedback Banner */}
      {saveMessage && (
        <div
          role="status"
          className={`mb-6 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
            saveMessage.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/40 bg-red-500/10 text-red-400'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
          }`}
        >
          <div className="text-xs text-[#8c8a82] mb-1">Final WPM</div>
          <div
            data-testid="result-wpm"
            className="text-4xl font-mono font-bold text-amber-500 tabular-nums"
          >
            {stats.wpm.toFixed(1)}
          </div>
          <div className="text-[11px] font-mono text-[#8c8a82] mt-1 tabular-nums">
            Net WPM: {stats.netWpm.toFixed(1)}
          </div>
        </div>

        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
          }`}
        >
          <div className="text-xs text-[#8c8a82] mb-1">Accuracy</div>
          <div
            data-testid="result-accuracy"
            className="text-4xl font-mono font-bold text-emerald-400 tabular-nums"
          >
            {stats.accuracy.toFixed(1)}%
          </div>
          <div className="text-[11px] font-mono text-[#8c8a82] mt-1 tabular-nums">
            {stats.correctCharacters} / {stats.charactersTyped} correct
          </div>
        </div>

        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
          }`}
        >
          <div className="text-xs text-[#8c8a82] mb-1">Final Errors</div>
          <div
            data-testid="result-errors"
            className={`text-4xl font-mono font-bold tabular-nums ${
              stats.currentErrors > 0
                ? 'text-red-400'
                : isDark
                ? 'text-[#e6e4dd]'
                : 'text-[#1c1b18]'
            }`}
          >
            {stats.currentErrors}
          </div>
          <div className="text-[11px] font-mono text-[#8c8a82] mt-1 tabular-nums">
            {stats.cumulativeErrors} total keystroke slips
          </div>
        </div>

        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
          }`}
        >
          <div className="text-xs text-[#8c8a82] mb-1">Characters & Time</div>
          <div
            data-testid="result-chars"
            className={`text-4xl font-mono font-bold tabular-nums ${
              isDark ? 'text-[#e6e4dd]' : 'text-[#1c1b18]'
            }`}
          >
            {stats.correctCharacters}/{stats.charactersTyped}
          </div>
          <div className="text-[11px] font-mono text-[#8c8a82] mt-1 tabular-nums">
            {formattedElapsed} ({actualDurationSec}s) ·{' '}
            {state.mode === 'timed' ? 'Timed' : 'Paragraph'}
          </div>
        </div>
      </div>

      {/* Visual Performance Timeline Chart */}
      <div
        className={`p-5 rounded-xl border mb-6 ${
          isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#8c8a82]">
            Pace & Consistency Curve
          </span>
          <div className="flex items-center gap-4 text-xs text-[#8c8a82]">
            <span className="text-amber-500 font-medium">— Gross WPM</span>
            <span className="opacity-60">--- Raw WPM</span>
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-36 overflow-visible"
            role="img"
            aria-label="WPM speed progression chart over the test duration"
          >
            <line
              x1="16"
              y1={chartHeight - 20}
              x2={chartWidth - 16}
              y2={chartHeight - 20}
              stroke={isDark ? '#2c2b26' : '#e2e0d8'}
              strokeWidth="1"
            />
            <line
              x1="16"
              y1="20"
              x2={chartWidth - 16}
              y2="20"
              stroke={isDark ? '#2c2b26' : '#e2e0d8'}
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <polyline
              fill="none"
              stroke={isDark ? '#6e6d68' : '#a8a59b'}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              points={rawPoints}
            />
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={wpmPoints}
            />
          </svg>
        </div>
        <div className="mt-2 pt-2 border-t border-[#292824]/40 text-[11px] text-[#8c8a82] flex flex-wrap justify-between gap-2">
          <span>
            Formula: Gross WPM = (correct characters ÷ 5) ÷ elapsed minutes · Net WPM = max(0,
            ((correct − uncorrected errors) ÷ 5) ÷ elapsed minutes)
          </span>
          <span>
            Accuracy = (correct positions ÷ typed positions) × 100
          </span>
        </div>
      </div>

      {/* Primary Action Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRestartSame}
          data-testid="results-repeat-btn"
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-amber-500 text-[#181816] hover:bg-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{state.mode === 'paragraph' ? 'Repeat' : 'Restart Test'}</span>
        </button>

        <button
          type="button"
          onClick={onTryAnotherParagraph}
          data-testid="results-next-passage-btn"
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
            isDark
              ? 'bg-[#21201d] border-[#33322c] text-[#e6e4dd] hover:border-amber-500/50'
              : 'bg-white border-[#d5d2c8] text-[#1c1b18] hover:border-amber-600/50'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Next Paragraph</span>
        </button>

        <button
          type="button"
          onClick={onBackToHome}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
            isDark
              ? 'bg-transparent border-[#292824] text-[#9e9c93] hover:text-[#e6e4dd]'
              : 'bg-transparent border-[#e2e0d8] text-[#5c5a52] hover:text-[#1c1b18]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>
    </section>
  );
};
