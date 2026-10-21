import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  createInitialState,
  handleCharInput,
  handleBackspace,
  handleCursorMove,
  tickTimer,
  addTimeSeconds,
  computeStats,
  getRenderedCharacters,
  appendPassageText,
  type TestMode,
  type TimedPresetDuration,
  type TimedDuration,
  type TypingState,
  type TypingStats,
  type RenderedChar,
  type WpmSample,
} from '../engine/typingEngine';
import {
  PASSAGES,
  buildInitialTimedPassage,
  selectNextPassage,
  getPassageById,
  type PassageDifficulty,
  type PassageCategory,
} from '../data/passages';
import { soundEngine, type SoundProfile } from '../utils/soundEngine';

export interface UseTypingTestOptions {
  initialMode?: TestMode;
  initialDuration?: TimedPresetDuration;
  soundEnabled: boolean;
  soundProfile: SoundProfile;
}

export function useTypingTest({
  initialMode = 'timed',
  initialDuration = 60,
  soundEnabled,
  soundProfile,
}: UseTypingTestOptions) {
  const [presetDuration, setPresetDuration] = useState<TimedPresetDuration>(initialDuration);
  const [difficulty, setDifficulty] = useState<PassageDifficulty | 'all'>('all');
  const [category, setCategory] = useState<PassageCategory | 'all'>('all');
  const [customPassageText, setCustomPassageText] = useState<string | null>(null);
  const usedPassageIdsRef = useRef<string[]>([]);
  const [timeline, setTimeline] = useState<WpmSample[]>([]);
  const lastSampledSecondRef = useRef<number>(0);
  const completionFiredRef = useRef<boolean>(false);

  const [state, setState] = useState<TypingState>(() => {
    if (initialMode === 'timed') {
      const built = buildInitialTimedPassage(650, { difficulty: 'all', category: 'all' });
      usedPassageIdsRef.current = built.usedIds;
      return createInitialState({
        mode: 'timed',
        durationSeconds: initialDuration,
        passage: built.text,
        passageId: built.primaryId,
      });
    }
    const first = PASSAGES[0];
    usedPassageIdsRef.current = [first.id];
    return createInitialState({
      mode: 'paragraph',
      durationSeconds: initialDuration,
      passage: first.text,
      passageId: first.id,
    });
  });

  // Reset or load passage helper
  const initTest = useCallback(
    (params: {
      mode: TestMode;
      durationSeconds: TimedDuration;
      diff?: PassageDifficulty | 'all';
      cat?: PassageCategory | 'all';
      specificPassageId?: string;
      customText?: string | null;
      keepSamePassage?: boolean;
    }) => {
      const targetDiff = params.diff ?? difficulty;
      const targetCat = params.cat ?? category;
      const custom = params.customText !== undefined ? params.customText : customPassageText;

      completionFiredRef.current = false;
      lastSampledSecondRef.current = 0;
      setTimeline([]);

      if (params.keepSamePassage) {
        setState((prev) =>
          createInitialState({
            mode: params.mode,
            durationSeconds: params.durationSeconds,
            passage: prev.passage,
            passageId: prev.passageId,
          })
        );
        return;
      }

      if (custom && custom.trim().length > 0) {
        setState(
          createInitialState({
            mode: params.mode,
            durationSeconds: params.durationSeconds,
            passage: custom.trim(),
            passageId: 'custom-passage',
          })
        );
        return;
      }

      if (params.specificPassageId) {
        const chosen = getPassageById(params.specificPassageId);
        usedPassageIdsRef.current = [chosen.id];
        setState(
          createInitialState({
            mode: params.mode,
            durationSeconds: params.durationSeconds,
            passage: chosen.text,
            passageId: chosen.id,
          })
        );
        return;
      }

      if (params.mode === 'timed') {
        const built = buildInitialTimedPassage(650, {
          difficulty: targetDiff,
          category: targetCat,
          excludeIds: usedPassageIdsRef.current.slice(-12),
        });
        usedPassageIdsRef.current = [
          ...usedPassageIdsRef.current.slice(-15),
          ...built.usedIds,
        ];
        setState(
          createInitialState({
            mode: 'timed',
            durationSeconds: params.durationSeconds,
            passage: built.text,
            passageId: built.primaryId,
          })
        );
      } else {
        const next = selectNextPassage(usedPassageIdsRef.current.slice(-15), {
          difficulty: targetDiff,
          category: targetCat,
        });
        usedPassageIdsRef.current = [...usedPassageIdsRef.current.slice(-20), next.id];
        setState(
          createInitialState({
            mode: 'paragraph',
            durationSeconds: params.durationSeconds,
            passage: next.text,
            passageId: next.id,
          })
        );
      }
    },
    [difficulty, category, customPassageText]
  );

  // Monotonic timer loop while running
  useEffect(() => {
    if (state.status !== 'running') {
      return;
    }

    const updateFromClock = () => {
      const now = performance.now();
      setState((prev) => {
        if (prev.status !== 'running') return prev;
        const next = tickTimer(prev, now);

        // Record per-second telemetry sample for results chart
        const currentSec = Math.floor(next.elapsedMs / 1000);
        if (currentSec > lastSampledSecondRef.current) {
          lastSampledSecondRef.current = currentSec;
          const liveStats = computeStats(next, now);
          setTimeline((prevSamples) => [
            ...prevSamples,
            {
              second: currentSec,
              wpm: liveStats.wpm,
              rawWpm: liveStats.rawWpm,
              accuracy: liveStats.accuracy,
              errors: liveStats.currentErrors,
            },
          ]);
        }

        if (next.status === 'completed' && !completionFiredRef.current) {
          completionFiredRef.current = true;
          soundEngine.playComplete(soundEnabled);
        }

        return next;
      });
    };

    const intervalId = window.setInterval(updateFromClock, 80);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateFromClock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.status, soundEnabled]);

  // Process a single typed character
  const typeCharacter = useCallback(
    (char: string) => {
      const now = performance.now();
      setState((prev) => {
        if (prev.status === 'completed') return prev;

        const expectedChar = prev.passage[prev.cursor];
        const isCorrect = char === expectedChar;
        if (isCorrect) {
          soundEngine.playKey(soundEnabled, soundProfile);
        } else {
          soundEngine.playError(soundEnabled);
        }

        let next = handleCharInput(prev, char, now);

        // In timed mode only, seamlessly append another passage if within 220 chars of the end
        if (
          next.mode === 'timed' &&
          next.status === 'running' &&
          next.passage.length - next.cursor < 220
        ) {
          const extraPassage = selectNextPassage(usedPassageIdsRef.current.slice(-15), {
            difficulty,
            category,
          });
          usedPassageIdsRef.current = [...usedPassageIdsRef.current.slice(-20), extraPassage.id];
          next = appendPassageText(next, extraPassage.text);
        }

        if (next.status === 'completed' && !completionFiredRef.current) {
          completionFiredRef.current = true;
          const finalStats = computeStats(next, now);
          const finalSec = Math.max(1, Math.round(finalStats.elapsedMs / 1000));
          setTimeline((prevSamples) => [
            ...prevSamples,
            {
              second: finalSec,
              wpm: finalStats.wpm,
              rawWpm: finalStats.rawWpm,
              accuracy: finalStats.accuracy,
              errors: finalStats.currentErrors,
            },
          ]);
          soundEngine.playComplete(soundEnabled);
        }

        return next;
      });
    },
    [soundEnabled, soundProfile, difficulty, category]
  );

  const backspace = useCallback(() => {
    const now = performance.now();
    soundEngine.playKey(soundEnabled, soundProfile);
    setState((prev) => {
      const next = handleBackspace(prev, now);
      if (next.status === 'completed' && !completionFiredRef.current) {
        completionFiredRef.current = true;
        soundEngine.playComplete(soundEnabled);
      }
      return next;
    });
  }, [soundEnabled, soundProfile]);

  const moveCursor = useCallback((direction: 'left' | 'right' | 'home' | 'end') => {
    const now = performance.now();
    setState((prev) => handleCursorMove(prev, direction, now));
  }, []);

  const addThirtySeconds = useCallback(() => {
    const now = performance.now();
    setState((prev) => {
      if (prev.mode !== 'timed' || prev.status === 'completed') {
        return prev;
      }
      let next = addTimeSeconds(prev, 30, now);
      // Ensure plenty of passage buffer when extending timed duration
      if (next.passage.length - next.cursor < 350) {
        const extraPassage = selectNextPassage(usedPassageIdsRef.current.slice(-15), {
          difficulty,
          category,
        });
        usedPassageIdsRef.current = [...usedPassageIdsRef.current.slice(-20), extraPassage.id];
        next = appendPassageText(next, extraPassage.text);
      }
      return next;
    });
  }, [difficulty, category]);

  const setMode = useCallback(
    (newMode: TestMode) => {
      initTest({
        mode: newMode,
        durationSeconds: presetDuration,
      });
    },
    [initTest, presetDuration]
  );

  const setDuration = useCallback(
    (newDuration: TimedPresetDuration) => {
      setPresetDuration(newDuration);
      initTest({
        mode: 'timed',
        durationSeconds: newDuration,
      });
    },
    [initTest]
  );

  const restartSamePassage = useCallback(() => {
    initTest({
      mode: state.mode,
      durationSeconds: presetDuration,
      keepSamePassage: true,
    });
  }, [initTest, state.mode, presetDuration]);

  const loadNewPassage = useCallback(() => {
    setCustomPassageText(null);
    initTest({
      mode: state.mode,
      durationSeconds: presetDuration,
      customText: null,
      keepSamePassage: false,
    });
  }, [initTest, state.mode, presetDuration]);

  const changeFilter = useCallback(
    (newDiff: PassageDifficulty | 'all', newCat: PassageCategory | 'all') => {
      setDifficulty(newDiff);
      setCategory(newCat);
      setCustomPassageText(null);
      initTest({
        mode: state.mode,
        durationSeconds: presetDuration,
        diff: newDiff,
        cat: newCat,
        customText: null,
      });
    },
    [initTest, state.mode, presetDuration]
  );

  const startSpecificPractice = useCallback(
    (options: {
      mode: TestMode;
      durationSeconds?: TimedPresetDuration;
      passageId?: string;
      customText?: string;
    }) => {
      if (options.durationSeconds) {
        setPresetDuration(options.durationSeconds);
      }
      if (options.customText) {
        setCustomPassageText(options.customText);
      } else {
        setCustomPassageText(null);
      }
      initTest({
        mode: options.mode,
        durationSeconds: options.durationSeconds ?? presetDuration,
        specificPassageId: options.passageId,
        customText: options.customText ?? null,
      });
    },
    [initTest, presetDuration]
  );

  const stats: TypingStats = useMemo(() => computeStats(state), [state]);
  const renderedChars: RenderedChar[] = useMemo(() => getRenderedCharacters(state), [state]);

  const reachedEndWithErrors =
    state.mode === 'paragraph' &&
    state.status === 'running' &&
    state.cursor >= state.passage.length &&
    stats.currentErrors > 0;

  return {
    state,
    presetDuration,
    stats,
    renderedChars,
    timeline,
    difficulty,
    category,
    customPassageText,
    reachedEndWithErrors,
    typeCharacter,
    backspace,
    moveCursor,
    addThirtySeconds,
    setMode,
    setDuration,
    restartSamePassage,
    loadNewPassage,
    changeFilter,
    startSpecificPractice,
  };
}
