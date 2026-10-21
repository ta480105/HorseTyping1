import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import {
  RotateCcw,
  Shuffle,
  AlertTriangle,
  Clock,
  FileText,
  CornerDownLeft,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  formatTimerMMSS,
  type TestMode,
  type TimedPresetDuration,
  type TypingState,
  type TypingStats,
  type RenderedChar,
} from '../engine/typingEngine';
import {
  getPassageById,
  type PassageDifficulty,
  type PassageCategory,
} from '../data/passages';

export type CaretStyle = 'bar' | 'underline' | 'block';
export type FontSizeScale = 'compact' | 'default' | 'large';

interface TypingArenaProps {
  state: TypingState;
  presetDuration: TimedPresetDuration;
  stats: TypingStats;
  renderedChars: RenderedChar[];
  difficulty: PassageDifficulty | 'all';
  category: PassageCategory | 'all';
  reachedEndWithErrors: boolean;
  theme: 'dark' | 'light';
  caretStyle: CaretStyle;
  fontSize: FontSizeScale;
  onTypeCharacter: (char: string) => void;
  onBackspace: () => void;
  onMoveCursor: (dir: 'left' | 'right' | 'home' | 'end') => void;
  onAddThirtySeconds: () => void;
  onSelectMode: (mode: TestMode) => void;
  onSelectDuration: (duration: TimedPresetDuration) => void;
  onRestartSamePassage: () => void;
  onLoadNewPassage: () => void;
  onChangeFilter: (diff: PassageDifficulty | 'all', cat: PassageCategory | 'all') => void;
}

export const TypingArena: React.FC<TypingArenaProps> = ({
  state,
  presetDuration,
  stats,
  renderedChars,
  difficulty,
  category,
  reachedEndWithErrors,
  theme,
  caretStyle,
  fontSize,
  onTypeCharacter,
  onBackspace,
  onMoveCursor,
  onAddThirtySeconds,
  onSelectMode,
  onSelectDuration,
  onRestartSamePassage,
  onLoadNewPassage,
  onChangeFilter,
}) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const passageViewportRef = useRef<HTMLDivElement | null>(null);
  const activeCharRef = useRef<HTMLSpanElement | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(true);
  // Live statistics are hidden by default to keep the typing experience calm and distraction-free
  const [showLiveStats, setShowLiveStats] = useState<boolean>(false);
  const [lineScrollOffset, setLineScrollOffset] = useState<number>(0);
  const lastKeyTimeRef = useRef<number>(0);

  const isDark = theme === 'dark';
  const currentPassageMeta = getPassageById(state.passageId);

  const focusTypingInput = useCallback(() => {
    if (inputRef.current && state.status !== 'completed') {
      inputRef.current.focus({ preventScroll: true });
      setIsFocused(true);
    }
  }, [state.status]);

  // Reset scroll offset and focus input when starting a fresh or repeated test
  useEffect(() => {
    if (state.status === 'idle') {
      setLineScrollOffset(0);
      focusTypingInput();
    }
  }, [state.status, state.submissionId, focusTypingInput]);

  // Smooth line-by-line scrolling based on actual rendered active character position (offsetTop)
  const recalculateLineScroll = useCallback(() => {
    const viewportEl = passageViewportRef.current;
    const activeEl = activeCharRef.current;
    if (!viewportEl || !activeEl) {
      if (state.cursor === 0) {
        setLineScrollOffset(0);
      }
      return;
    }

    const computed = window.getComputedStyle(viewportEl);
    const lineHeight = parseFloat(computed.lineHeight) || 40;
    const activeTop = activeEl.offsetTop;

    // Keep the active line anchored at the second visible row once the user completes the first row
    const activeLineIndex = Math.round(activeTop / lineHeight);
    const targetOffset = activeLineIndex > 1 ? (activeLineIndex - 1) * lineHeight : 0;

    setLineScrollOffset((prev) => (Math.abs(prev - targetOffset) > 2 ? targetOffset : prev));
  }, [state.cursor]);

  useLayoutEffect(() => {
    recalculateLineScroll();
  }, [recalculateLineScroll, state.cursor, state.passage, fontSize]);

  useEffect(() => {
    const handleResize = () => recalculateLineScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [recalculateLineScroll]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (state.status === 'completed') return;

    // Do not intercept normal browser shortcuts (Ctrl+C, Ctrl+V, Ctrl+A, Cmd+R, etc.)
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    if (e.key === 'Tab') {
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      lastKeyTimeRef.current = performance.now();
      onBackspace();
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onMoveCursor('left');
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onMoveCursor('right');
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      onMoveCursor('home');
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      onMoveCursor('end');
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onRestartSamePassage();
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      lastKeyTimeRef.current = performance.now();
      onTypeCharacter(e.key);
    }
  };

  // Mobile virtual keyboard fallback
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (!value) return;

    if (performance.now() - lastKeyTimeRef.current > 12) {
      const char = value[value.length - 1];
      if (char && char.length === 1) {
        onTypeCharacter(char);
      }
    }
    e.target.value = '';
  };

  // Explicit line-height and 4-line viewport height per font scale for smooth line-by-line scrolling
  const typographyConfig =
    fontSize === 'compact'
      ? {
          textClass: 'text-lg sm:text-xl leading-[2.25rem]',
          viewportHeightClass: 'h-[9rem]',
        }
      : fontSize === 'large'
      ? {
          textClass: 'text-2xl sm:text-3xl leading-[3rem]',
          viewportHeightClass: 'h-[12rem]',
        }
      : {
          textClass: 'text-xl sm:text-2xl leading-[2.625rem]',
          viewportHeightClass: 'h-[10.5rem]',
        };

  return (
    <section
      aria-label="Typing speed test workspace"
      className="w-full max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6"
    >
      {/* Top Mode & Passage Controls Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl border mb-8 transition-colors ${
          isDark
            ? 'bg-[#201f1c] border-[#2c2b26] text-[#9e9c93]'
            : 'bg-[#efede6] border-[#dcd9ce] text-[#5c5a52]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Mode Selector: Timed vs Paragraph */}
          <div
            role="group"
            aria-label="Test mode"
            className={`flex items-center p-1 rounded-lg border ${
              isDark ? 'bg-[#181816] border-[#292824]' : 'bg-[#f7f6f2] border-[#dcd9ce]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                onSelectMode('timed');
                focusTypingInput();
              }}
              aria-pressed={state.mode === 'timed'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                state.mode === 'timed'
                  ? 'bg-amber-500 text-[#181816] font-semibold'
                  : isDark
                  ? 'text-[#9e9c93] hover:text-[#e6e4dd]'
                  : 'text-[#5c5a52] hover:text-[#1c1b18]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timed</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectMode('paragraph');
                focusTypingInput();
              }}
              aria-pressed={state.mode === 'paragraph'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                state.mode === 'paragraph'
                  ? 'bg-amber-500 text-[#181816] font-semibold'
                  : isDark
                  ? 'text-[#9e9c93] hover:text-[#e6e4dd]'
                  : 'text-[#5c5a52] hover:text-[#1c1b18]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paragraph</span>
            </button>
          </div>

          {/* Timed Mode Presets (30 Seconds, 1 Minute, 3 Minutes, 6 Minutes) */}
          {state.mode === 'timed' && (
            <div
              role="group"
              aria-label="Test duration"
              className={`flex flex-wrap items-center p-1 rounded-lg border ${
                isDark ? 'bg-[#181816] border-[#292824]' : 'bg-[#f7f6f2] border-[#dcd9ce]'
              }`}
            >
              {(
                [
                  { sec: 30, label: '30 Seconds' },
                  { sec: 60, label: '1 Minute' },
                  { sec: 180, label: '3 Minutes' },
                  { sec: 360, label: '6 Minutes' },
                ] as { sec: TimedPresetDuration; label: string }[]
              ).map(({ sec, label }) => {
                const active = presetDuration === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    data-testid={`preset-${sec}s`}
                    onClick={() => {
                      onSelectDuration(sec);
                      focusTypingInput();
                    }}
                    aria-pressed={active}
                    className={`px-2.5 py-1.5 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 font-semibold'
                        : isDark
                        ? 'text-[#9e9c93] hover:text-[#e6e4dd]'
                        : 'text-[#5c5a52] hover:text-[#1c1b18]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Difficulty Filter */}
          <div
            role="group"
            aria-label="Passage difficulty"
            className={`hidden lg:flex items-center p-1 rounded-lg border ${
              isDark ? 'bg-[#181816] border-[#292824]' : 'bg-[#f7f6f2] border-[#dcd9ce]'
            }`}
          >
            {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => {
              const active = difficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => {
                    onChangeFilter(diff, category);
                    focusTypingInput();
                  }}
                  aria-pressed={active}
                  className={`px-2 py-1.5 text-xs font-medium capitalize rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? isDark
                        ? 'bg-[#2c2b26] text-[#e6e4dd]'
                        : 'bg-[#dcd9ce] text-[#1c1b18]'
                      : isDark
                      ? 'text-[#8c8a82] hover:text-[#e6e4dd]'
                      : 'text-[#68665e] hover:text-[#1c1b18]'
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Controls: Repeat / Restart & Next Paragraph */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="repeat-passage-btn"
            onClick={() => {
              onRestartSamePassage();
              focusTypingInput();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isDark
                ? 'bg-[#181816] border-[#2c2b26] text-[#e6e4dd] hover:border-amber-500/50'
                : 'bg-[#f7f6f2] border-[#d5d2c8] text-[#1c1b18] hover:border-amber-600/50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{state.mode === 'paragraph' ? 'Repeat' : 'Restart'}</span>
          </button>

          <button
            type="button"
            data-testid="next-passage-btn"
            onClick={() => {
              onLoadNewPassage();
              focusTypingInput();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isDark
                ? 'bg-[#181816] border-[#2c2b26] text-[#e6e4dd] hover:border-amber-500/50'
                : 'bg-[#f7f6f2] border-[#d5d2c8] text-[#1c1b18] hover:border-amber-600/50'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Next Paragraph</span>
          </button>
        </div>
      </div>

      {/* Calm, Minimal Header Strip Above Passage (Unobtrusive Timer + Optional +30 sec Control) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 min-h-[2.25rem]">
        <div className="flex items-center gap-3">
          {state.mode === 'timed' ? (
            <>
              <div
                data-testid="live-timer"
                aria-label="Remaining time"
                className="text-2xl font-mono font-semibold tracking-tight text-amber-500 tabular-nums"
              >
                {formatTimerMMSS(stats.remainingMs)}
              </div>

              <button
                type="button"
                data-testid="add-30-sec-btn"
                onClick={() => {
                  onAddThirtySeconds();
                  focusTypingInput();
                }}
                disabled={state.status === 'completed'}
                title="Add 30 seconds to the current timed test"
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isDark
                    ? 'bg-[#201f1c] border-[#33322c] text-[#b8b6ad] hover:text-amber-400 hover:border-amber-500/40'
                    : 'bg-[#efede6] border-[#d5d2c8] text-[#45433d] hover:text-amber-700 hover:border-amber-600/40'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>30 sec</span>
              </button>

              <span className="text-xs text-[#8c8a82] hidden sm:inline">
                {state.status === 'idle' ? 'Starts on first keystroke' : 'Timed mode'}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#8c8a82]">
              <span className="font-semibold text-amber-500">Paragraph Mode</span>
              <span aria-hidden="true">·</span>
              <span>
                {state.passageId === 'custom-passage'
                  ? 'Custom Practice Passage'
                  : currentPassageMeta.title}
              </span>
              <span aria-hidden="true">·</span>
              <span>Complete all {state.passage.length} characters accurately to finish</span>
            </div>
          )}
        </div>

        {/* Unobtrusive Optional Live Telemetry Toggle (Hidden by default per requirements) */}
        <div className="flex items-center gap-4 text-xs text-[#8c8a82]">
          {showLiveStats && (
            <div
              data-testid="optional-live-stats"
              className="flex items-center gap-3 font-mono tabular-nums"
            >
              <span>
                WPM: <strong>{stats.elapsedMs < 400 ? 0 : Math.round(stats.wpm)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Acc:{' '}
                <strong>
                  {stats.charactersTyped === 0 ? '100%' : `${stats.accuracy.toFixed(1)}%`}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Errors: <strong>{stats.currentErrors}</strong>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setShowLiveStats((prev) => !prev);
              focusTypingInput();
            }}
            aria-pressed={showLiveStats}
            className="inline-flex items-center gap-1.5 text-xs text-[#8c8a82] hover:text-[#e6e4dd] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1.5 py-0.5"
          >
            {showLiveStats ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide live stats</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show live stats</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Paragraph End-With-Errors Alert Banner */}
      {reachedEndWithErrors && (
        <div
          role="alert"
          data-testid="paragraph-error-banner"
          className="mb-4 p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-400 flex items-start gap-3 text-sm"
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-400">
              End of paragraph reached with {stats.currentErrors} uncorrected mistake
              {stats.currentErrors === 1 ? '' : 's'}.
            </p>
            <p className="text-xs text-amber-300/90 mt-1">
              Paragraph mode finishes only when all characters are accurate. Use{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-xs">Backspace</kbd>{' '}
              or the{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-xs">←</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-xs">→</kbd> arrow
              keys to navigate back and fix the red characters.
            </p>
          </div>
        </div>
      )}

      {/* Main Focal Point: Calm, Distraction-Free Passage Canvas with Smooth Line Scrolling */}
      <div
        onClick={focusTypingInput}
        className={`relative rounded-2xl border p-6 sm:p-10 transition-colors cursor-text ${
          isDark
            ? isFocused
              ? 'bg-[#1c1b18] border-[#383630]'
              : 'bg-[#181816] border-[#292824]'
            : isFocused
            ? 'bg-white border-[#c9c6bc]'
            : 'bg-[#f4f2ec] border-[#e2e0d8]'
        }`}
      >
        <label htmlFor="typing-engine-input" className="sr-only">
          Type the passage characters here
        </label>
        <textarea
          ref={inputRef}
          id="typing-engine-input"
          data-testid="typing-input"
          aria-label="Type the passage characters here"
          value=""
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          rows={1}
          className="sr-only"
        />

        {/* Fixed-Height Multi-Line Viewport with Smooth Line Translation */}
        <div
          className={`overflow-hidden ${typographyConfig.viewportHeightClass} select-none`}
        >
          <div
            ref={passageViewportRef}
            data-testid="passage-display"
            data-line-offset={Math.round(lineScrollOffset)}
            style={{
              transform: `translateY(-${lineScrollOffset}px)`,
            }}
            className={`relative font-mono ${typographyConfig.textClass} whitespace-pre-wrap break-words transition-transform duration-150 ease-out`}
          >
            {renderedChars.map((ch) => {
              let colorClass = isDark ? 'text-[#6e6d68]' : 'text-[#8c8980]';
              if (ch.status === 'correct') {
                colorClass = isDark ? 'text-emerald-400' : 'text-emerald-600';
              } else if (ch.status === 'incorrect') {
                colorClass = isDark
                  ? 'text-red-400 bg-red-500/20 underline decoration-red-500 decoration-2 underline-offset-4 rounded-xs'
                  : 'text-red-600 bg-red-500/15 underline decoration-red-600 decoration-2 underline-offset-4 rounded-xs';
              }

              let cursorStyleClass = '';
              if (ch.isCurrent) {
                if (caretStyle === 'bar') {
                  cursorStyleClass =
                    'border-l-2 border-amber-500 -ml-[1px] pl-[1px] bg-amber-500/10 rounded-xs';
                } else if (caretStyle === 'underline') {
                  cursorStyleClass =
                    'border-b-2 border-amber-500 bg-amber-500/10 rounded-xs';
                } else {
                  cursorStyleClass =
                    'bg-amber-500/30 text-amber-300 ring-1 ring-amber-500 rounded-xs';
                }
              }

              return (
                <span
                  key={ch.index}
                  ref={ch.isCurrent ? activeCharRef : undefined}
                  data-char-status={ch.status}
                  data-char-current={ch.isCurrent ? 'true' : undefined}
                  className={`${colorClass} ${cursorStyleClass}`}
                >
                  {ch.expected}
                </span>
              );
            })}

            {state.status !== 'completed' && state.cursor >= state.passage.length && (
              <span
                ref={activeCharRef}
                className="inline-block w-2.5 h-6 align-middle bg-amber-500 caret-blink ml-0.5 rounded-xs"
              />
            )}
          </div>
        </div>

        {/* Unfocused Subtle Prompt */}
        {!isFocused && state.status !== 'completed' && (
          <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs text-amber-500">
            <span>Typing area unfocused — click here or press any key to resume typing.</span>
            <button
              type="button"
              onClick={focusTypingInput}
              className="px-2.5 py-1 rounded bg-amber-500 text-[#181816] font-semibold"
            >
              Focus Input
            </button>
          </div>
        )}
      </div>

      {/* Subtle Keyboard Hints Below Passage */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#8c8a82]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd
              className={`px-1.5 py-0.5 rounded border font-mono text-[11px] ${
                isDark
                  ? 'bg-[#21201d] border-[#2e2d28] text-[#b8b6ad]'
                  : 'bg-[#eae8e1] border-[#d5d2c8] text-[#45433d]'
              }`}
            >
              Backspace
            </kbd>
            <span>correct mistake</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd
              className={`px-1.5 py-0.5 rounded border font-mono text-[11px] ${
                isDark
                  ? 'bg-[#21201d] border-[#2e2d28] text-[#b8b6ad]'
                  : 'bg-[#eae8e1] border-[#d5d2c8] text-[#45433d]'
              }`}
            >
              ← / →
            </kbd>
            <span>navigate within typed text</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd
              className={`px-1.5 py-0.5 rounded border font-mono text-[11px] ${
                isDark
                  ? 'bg-[#21201d] border-[#2e2d28] text-[#b8b6ad]'
                  : 'bg-[#eae8e1] border-[#d5d2c8] text-[#45433d]'
              }`}
            >
              Esc
            </kbd>
            <span>{state.mode === 'paragraph' ? 'repeat paragraph' : 'restart test'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <CornerDownLeft className="w-3.5 h-3.5 text-amber-500" />
          <span>Detailed statistics appear automatically when the test finishes</span>
        </div>
      </div>
    </section>
  );
};
