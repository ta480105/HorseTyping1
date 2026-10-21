export type TestMode = 'timed' | 'paragraph';
export type TimedPresetDuration = 30 | 60 | 180 | 360;
export type TimedDuration = number;
export type TestStatus = 'idle' | 'running' | 'completed';
export type CharStatus = 'untyped' | 'correct' | 'incorrect';

export interface RenderedChar {
  index: number;
  expected: string;
  actual: string | null;
  status: CharStatus;
  isCurrent: boolean;
}

export interface WpmSample {
  second: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
}

export interface TypingStats {
  /**
   * Gross WPM based on the conventional 5-character word definition:
   * Gross WPM = (correctCharacters / 5) / elapsedMinutes
   */
  wpm: number;
  /**
   * Net WPM applying an explicit penalty for current uncorrected errors:
   * Net WPM = max(0, ((correctCharacters - currentErrors) / 5) / elapsedMinutes)
   */
  netWpm: number;
  /**
   * Raw speed including all typed characters regardless of correctness:
   * Raw WPM = (charactersTyped / 5) / elapsedMinutes
   */
  rawWpm: number;
  /**
   * Accuracy percentage across currently typed character positions:
   * Accuracy = (correctCharacters / charactersTyped) * 100
   * Untyped passage positions are excluded so typing fewer characters never inflates or deflates accuracy.
   */
  accuracy: number;
  /**
   * Current visible errors in the typed region. Corrected mistakes are removed from this count.
   */
  currentErrors: number;
  /**
   * Total mistake keystrokes made during the test, including mistakes later corrected.
   */
  cumulativeErrors: number;
  /**
   * Number of currently populated character positions in the passage.
   */
  charactersTyped: number;
  /**
   * Number of currently populated character positions matching the reference passage.
   */
  correctCharacters: number;
  elapsedMs: number;
  remainingMs: number;
}

export interface TypingState {
  mode: TestMode;
  durationSeconds: TimedDuration;
  status: TestStatus;
  passage: string;
  passageId: string;
  /**
   * Array of typed characters aligned by index to `passage`.
   * Trailing untyped slots are trimmed; intermediate `null` slots occur only if the user moves the cursor backward and deletes in-place.
   */
  typed: (string | null)[];
  cursor: number;
  cumulativeErrors: number;
  startTimeMs: number | null;
  endTimeMs: number | null;
  elapsedMs: number;
  remainingMs: number;
  frozenStats: TypingStats | null;
  submissionId: string;
}

export interface CreateStateOptions {
  mode: TestMode;
  durationSeconds?: TimedDuration;
  passage: string;
  passageId?: string;
  submissionId?: string;
}

let submissionCounter = 0;
function generateSubmissionId(): string {
  submissionCounter += 1;
  return `sub_${Date.now()}_${submissionCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Formats milliseconds into strict two-digit MM:SS format (e.g., 120000 -> "02:00", 90000 -> "01:30", 30000 -> "00:30").
 * Never returns negative time or raw unformatted seconds.
 */
export function formatTimerMMSS(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '00:00';
  }
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats elapsed milliseconds into two-digit MM:SS format using floor seconds.
 */
export function formatElapsedMMSS(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '00:00';
  }
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats a duration in seconds into a concise human label (e.g., 30 -> "30 sec", 60 -> "1 min", 90 -> "01:30").
 */
export function formatDurationLabel(seconds: number): string {
  if (seconds === 30) return '30 sec';
  if (seconds === 60) return '1 min';
  if (seconds === 180) return '3 min';
  if (seconds === 360) return '6 min';
  if (seconds > 0 && seconds % 60 === 0) return `${seconds / 60} min`;
  return formatElapsedMMSS(seconds * 1000);
}

export function createInitialState(options: CreateStateOptions): TypingState {
  const durationSeconds: TimedDuration =
    options.durationSeconds && options.durationSeconds > 0 ? options.durationSeconds : 60;
  const safePassage = options.passage ?? '';
  return {
    mode: options.mode,
    durationSeconds,
    status: 'idle',
    passage: safePassage,
    passageId: options.passageId ?? 'default-passage',
    typed: [],
    cursor: 0,
    cumulativeErrors: 0,
    startTimeMs: null,
    endTimeMs: null,
    elapsedMs: 0,
    remainingMs: options.mode === 'timed' ? durationSeconds * 1000 : 0,
    frozenStats: null,
    submissionId: options.submissionId ?? generateSubmissionId(),
  };
}

/**
 * Calculates Gross WPM = (correctCharacters / 5) / elapsedMinutes.
 * Safely handles zero or negative elapsed time without division by zero.
 */
export function calculateWpm(correctCharacters: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctCharacters <= 0) {
    return 0;
  }
  const elapsedMinutes = elapsedMs / 60000;
  const wpm = correctCharacters / 5 / elapsedMinutes;
  return Math.round(wpm * 10) / 10;
}

/**
 * Calculates Raw WPM = (charactersTyped / 5) / elapsedMinutes.
 */
export function calculateRawWpm(charactersTyped: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || charactersTyped <= 0) {
    return 0;
  }
  const elapsedMinutes = elapsedMs / 60000;
  const raw = charactersTyped / 5 / elapsedMinutes;
  return Math.round(raw * 10) / 10;
}

/**
 * Calculates Net WPM = max(0, ((correctCharacters - currentErrors) / 5) / elapsedMinutes).
 */
export function calculateNetWpm(
  correctCharacters: number,
  currentErrors: number,
  elapsedMs: number
): number {
  if (elapsedMs <= 0 || correctCharacters <= 0) {
    return 0;
  }
  const elapsedMinutes = elapsedMs / 60000;
  const netChars = Math.max(0, correctCharacters - Math.max(0, currentErrors));
  const net = netChars / 5 / elapsedMinutes;
  return Math.round(net * 10) / 10;
}

/**
 * Calculates Accuracy = (correctCharacters / charactersTyped) * 100.
 * Safely returns 0 when charactersTyped is 0.
 */
export function calculateAccuracy(correctCharacters: number, charactersTyped: number): number {
  if (charactersTyped <= 0 || correctCharacters < 0) {
    return 0;
  }
  const clampedCorrect = Math.min(correctCharacters, charactersTyped);
  return Math.round((clampedCorrect / charactersTyped) * 1000) / 10;
}

export function countCharacterMetrics(
  passage: string,
  typed: (string | null)[]
): {
  charactersTyped: number;
  correctCharacters: number;
  currentErrors: number;
  allPassageCharactersCorrect: boolean;
} {
  let charactersTyped = 0;
  let correctCharacters = 0;
  let currentErrors = 0;

  const limit = Math.min(passage.length, typed.length);
  for (let i = 0; i < limit; i += 1) {
    const actual = typed[i];
    if (actual !== null && actual !== undefined) {
      charactersTyped += 1;
      if (actual === passage[i]) {
        correctCharacters += 1;
      } else {
        currentErrors += 1;
      }
    }
  }

  const allPassageCharactersCorrect =
    passage.length > 0 &&
    charactersTyped === passage.length &&
    correctCharacters === passage.length &&
    currentErrors === 0;

  return {
    charactersTyped,
    correctCharacters,
    currentErrors,
    allPassageCharactersCorrect,
  };
}

export function computeStats(state: TypingState, nowMs?: number): TypingStats {
  if (state.status === 'completed' && state.frozenStats) {
    return { ...state.frozenStats };
  }

  const { charactersTyped, correctCharacters, currentErrors } = countCharacterMetrics(
    state.passage,
    state.typed
  );

  let elapsedMs = state.elapsedMs;
  if (state.status === 'running' && state.startTimeMs !== null && typeof nowMs === 'number') {
    elapsedMs = Math.max(0, nowMs - state.startTimeMs);
    if (state.mode === 'timed') {
      elapsedMs = Math.min(elapsedMs, state.durationSeconds * 1000);
    }
  }

  const remainingMs =
    state.mode === 'timed'
      ? Math.max(0, state.durationSeconds * 1000 - elapsedMs)
      : 0;

  return {
    wpm: calculateWpm(correctCharacters, elapsedMs),
    netWpm: calculateNetWpm(correctCharacters, currentErrors, elapsedMs),
    rawWpm: calculateRawWpm(charactersTyped, elapsedMs),
    accuracy: calculateAccuracy(correctCharacters, charactersTyped),
    currentErrors,
    cumulativeErrors: state.cumulativeErrors,
    charactersTyped,
    correctCharacters,
    elapsedMs,
    remainingMs,
  };
}

export function getRenderedCharacters(state: TypingState): RenderedChar[] {
  const result: RenderedChar[] = [];
  for (let i = 0; i < state.passage.length; i += 1) {
    const expected = state.passage[i];
    const actual = i < state.typed.length ? state.typed[i] ?? null : null;
    let status: CharStatus = 'untyped';
    if (actual !== null) {
      status = actual === expected ? 'correct' : 'incorrect';
    }
    result.push({
      index: i,
      expected,
      actual,
      status,
      isCurrent: state.status !== 'completed' && i === state.cursor,
    });
  }
  return result;
}

function trimTrailingNulls(arr: (string | null)[]): (string | null)[] {
  const copy = [...arr];
  while (
    copy.length > 0 &&
    (copy[copy.length - 1] === null || copy[copy.length - 1] === undefined)
  ) {
    copy.pop();
  }
  return copy;
}

/**
 * Advances monotonic clock state and completes timed tests if the deadline has been reached.
 */
export function tickTimer(state: TypingState, nowMs: number): TypingState {
  if (state.status !== 'running' || state.startTimeMs === null) {
    return state;
  }

  const rawElapsed = Math.max(0, nowMs - state.startTimeMs);

  if (state.mode === 'timed') {
    const durationMs = state.durationSeconds * 1000;
    if (rawElapsed >= durationMs) {
      const finalState: TypingState = {
        ...state,
        status: 'completed',
        elapsedMs: durationMs,
        remainingMs: 0,
        endTimeMs: state.startTimeMs + durationMs,
      };
      return {
        ...finalState,
        frozenStats: computeStats(
          { ...finalState, status: 'running', elapsedMs: durationMs, remainingMs: 0 },
          state.startTimeMs + durationMs
        ),
      };
    }

    return {
      ...state,
      elapsedMs: rawElapsed,
      remainingMs: Math.max(0, durationMs - rawElapsed),
    };
  }

  // Paragraph mode: count up elapsed time without countdown
  return {
    ...state,
    elapsedMs: rawElapsed,
    remainingMs: 0,
  };
}

/**
 * Adds extra seconds (e.g. +30 sec) to an active or idle timed test.
 * - Ignored in paragraph mode or when the test is already completed.
 * - If the timed test has already expired at `nowMs`, completes the test rather than reviving it.
 * - Recalculates the deadline and remainingMs immediately while preserving passage, cursor, and stats.
 */
export function addTimeSeconds(
  state: TypingState,
  extraSeconds = 30,
  nowMs?: number
): TypingState {
  if (state.mode !== 'timed' || state.status === 'completed') {
    return state;
  }
  if (!Number.isFinite(extraSeconds) || extraSeconds <= 0) {
    return state;
  }

  // If running, verify the deadline has not already passed at `nowMs`
  if (state.status === 'running' && state.startTimeMs !== null && typeof nowMs === 'number') {
    const checked = tickTimer(state, nowMs);
    if (checked.status === 'completed') {
      return checked;
    }
    const nextDurationSeconds = Math.min(7200, state.durationSeconds + extraSeconds);
    const elapsedMs = Math.max(0, nowMs - state.startTimeMs);
    const remainingMs = Math.max(0, nextDurationSeconds * 1000 - elapsedMs);
    return {
      ...state,
      durationSeconds: nextDurationSeconds,
      elapsedMs,
      remainingMs,
    };
  }

  // Idle or running without explicit nowMs timestamp: extend duration and remaining time directly
  const nextDurationSeconds = Math.min(7200, state.durationSeconds + extraSeconds);
  const remainingMs = Math.max(0, nextDurationSeconds * 1000 - state.elapsedMs);
  return {
    ...state,
    durationSeconds: nextDurationSeconds,
    remainingMs,
  };
}

/**
 * Processes a single printable character input.
 */
export function handleCharInput(state: TypingState, char: string, nowMs: number): TypingState {
  if (state.status === 'completed') {
    return state;
  }
  if (!state.passage || state.passage.length === 0) {
    return state;
  }
  if (!char || char.length !== 1) {
    return state;
  }

  // Check if timed mode has already expired before accepting this character
  if (state.status === 'running' && state.mode === 'timed' && state.startTimeMs !== null) {
    const checked = tickTimer(state, nowMs);
    if (checked.status === 'completed') {
      return checked;
    }
  }

  if (state.cursor >= state.passage.length) {
    return tickTimer(state, nowMs);
  }

  const isStarting = state.status === 'idle';
  const startTimeMs = isStarting ? nowMs : state.startTimeMs ?? nowMs;
  const elapsedMs = Math.max(0, nowMs - startTimeMs);
  const remainingMs =
    state.mode === 'timed'
      ? Math.max(0, state.durationSeconds * 1000 - elapsedMs)
      : 0;

  const nextTyped = [...state.typed];
  while (nextTyped.length < state.cursor) {
    nextTyped.push(null);
  }
  nextTyped[state.cursor] = char;

  const isIncorrect = char !== state.passage[state.cursor];
  const nextCumulativeErrors = state.cumulativeErrors + (isIncorrect ? 1 : 0);
  const nextCursor = Math.min(state.passage.length, state.cursor + 1);
  const cleanedTyped = trimTrailingNulls(nextTyped);

  const nextState: TypingState = {
    ...state,
    status: 'running',
    startTimeMs,
    elapsedMs,
    remainingMs,
    typed: cleanedTyped,
    cursor: nextCursor,
    cumulativeErrors: nextCumulativeErrors,
  };

  // In paragraph mode, check if the entire paragraph is now completed with zero errors
  if (nextState.mode === 'paragraph') {
    const metrics = countCharacterMetrics(nextState.passage, nextState.typed);
    if (metrics.allPassageCharactersCorrect) {
      const completedState: TypingState = {
        ...nextState,
        status: 'completed',
        endTimeMs: nowMs,
      };
      return {
        ...completedState,
        frozenStats: computeStats(nextState, nowMs),
      };
    }
  }

  return nextState;
}

/**
 * Processes Backspace key to remove the character immediately before the cursor.
 */
export function handleBackspace(state: TypingState, nowMs: number): TypingState {
  if (state.status !== 'running') {
    return state;
  }

  if (state.mode === 'timed' && state.startTimeMs !== null) {
    const checked = tickTimer(state, nowMs);
    if (checked.status === 'completed') {
      return checked;
    }
  }

  if (state.cursor <= 0) {
    return tickTimer(state, nowMs);
  }

  const targetIndex = state.cursor - 1;
  const nextTyped = [...state.typed];
  if (targetIndex < nextTyped.length) {
    nextTyped[targetIndex] = null;
  }
  const cleanedTyped = trimTrailingNulls(nextTyped);
  const elapsedMs =
    state.startTimeMs !== null ? Math.max(0, nowMs - state.startTimeMs) : state.elapsedMs;
  const remainingMs =
    state.mode === 'timed'
      ? Math.max(0, state.durationSeconds * 1000 - elapsedMs)
      : 0;

  const nextState: TypingState = {
    ...state,
    typed: cleanedTyped,
    cursor: targetIndex,
    elapsedMs,
    remainingMs,
  };

  if (nextState.mode === 'paragraph') {
    const metrics = countCharacterMetrics(nextState.passage, nextState.typed);
    if (metrics.allPassageCharactersCorrect) {
      const completedState: TypingState = {
        ...nextState,
        status: 'completed',
        endTimeMs: nowMs,
      };
      return {
        ...completedState,
        frozenStats: computeStats(nextState, nowMs),
      };
    }
  }

  return nextState;
}

/**
 * Moves the active cursor left or right within the valid typed boundaries.
 */
export function handleCursorMove(
  state: TypingState,
  direction: 'left' | 'right' | 'home' | 'end',
  nowMs?: number
): TypingState {
  if (state.status === 'completed') {
    return state;
  }

  if (
    state.status === 'running' &&
    state.mode === 'timed' &&
    state.startTimeMs !== null &&
    typeof nowMs === 'number'
  ) {
    const checked = tickTimer(state, nowMs);
    if (checked.status === 'completed') {
      return checked;
    }
  }

  const maxCursor = Math.min(state.passage.length, state.typed.length);
  let nextCursor = state.cursor;

  if (direction === 'left') {
    nextCursor = Math.max(0, state.cursor - 1);
  } else if (direction === 'right') {
    nextCursor = Math.min(maxCursor, state.cursor + 1);
  } else if (direction === 'home') {
    nextCursor = 0;
  } else if (direction === 'end') {
    nextCursor = maxCursor;
  }

  return {
    ...state,
    cursor: nextCursor,
  };
}

/**
 * Seamlessly appends more passage text in timed mode when the user nears the end of current text.
 */
export function appendPassageText(state: TypingState, additionalText: string): TypingState {
  if (state.status === 'completed' || state.mode !== 'timed' || !additionalText.trim()) {
    return state;
  }
  const separator = state.passage.endsWith(' ') || state.passage.length === 0 ? '' : ' ';
  return {
    ...state,
    passage: `${state.passage}${separator}${additionalText.trim()}`,
  };
}

/**
 * Tracks submitted result IDs to prevent accidental duplicate result submissions.
 */
export class SubmissionRegistry {
  private submittedIds = new Set<string>();

  canSubmit(submissionId: string): boolean {
    return Boolean(submissionId) && !this.submittedIds.has(submissionId);
  }

  markSubmitted(submissionId: string): boolean {
    if (!this.canSubmit(submissionId)) {
      return false;
    }
    this.submittedIds.add(submissionId);
    return true;
  }

  hasSubmitted(submissionId: string): boolean {
    return this.submittedIds.has(submissionId);
  }

  reset(): void {
    this.submittedIds.clear();
  }
}

export interface ResultSubmissionPayload {
  submissionId: string;
  userId: string;
  mode: TestMode;
  durationSeconds: number;
  wpm: number;
  netWpm: number;
  accuracy: number;
  errors: number;
  charactersTyped: number;
  correctCharacters: number;
  passageId?: string;
}

/**
 * Validates result payload before persisting and enforces anti-abuse sanity bounds.
 */
export function validateResultPayload(payload: ResultSubmissionPayload): {
  valid: boolean;
  error?: string;
} {
  if (!payload.submissionId || typeof payload.submissionId !== 'string') {
    return { valid: false, error: 'Missing submission identifier.' };
  }
  if (!payload.userId || typeof payload.userId !== 'string') {
    return { valid: false, error: 'Missing authenticated user ID.' };
  }
  if (payload.mode !== 'timed' && payload.mode !== 'paragraph') {
    return { valid: false, error: 'Invalid test mode.' };
  }
  if (
    !Number.isFinite(payload.durationSeconds) ||
    payload.durationSeconds < 1 ||
    payload.durationSeconds > 7200
  ) {
    return { valid: false, error: 'Invalid test duration.' };
  }
  if (
    payload.mode === 'timed' &&
    (payload.durationSeconds < 30 || payload.durationSeconds % 30 !== 0)
  ) {
    return {
      valid: false,
      error: 'Timed mode duration must be a positive multiple of 30 seconds.',
    };
  }
  if (!Number.isFinite(payload.wpm) || payload.wpm < 0 || payload.wpm > 320) {
    return { valid: false, error: 'WPM exceeds plausible human validation bounds (0 - 320 WPM).' };
  }
  if (!Number.isFinite(payload.accuracy) || payload.accuracy < 0 || payload.accuracy > 100) {
    return { valid: false, error: 'Accuracy must be between 0 and 100.' };
  }
  if (
    !Number.isInteger(payload.charactersTyped) ||
    payload.charactersTyped < 1 ||
    payload.charactersTyped > 50000
  ) {
    return { valid: false, error: 'Invalid charactersTyped count.' };
  }
  if (
    !Number.isInteger(payload.correctCharacters) ||
    payload.correctCharacters < 0 ||
    payload.correctCharacters > payload.charactersTyped
  ) {
    return { valid: false, error: 'correctCharacters cannot exceed charactersTyped.' };
  }
  if (!Number.isInteger(payload.errors) || payload.errors < 0) {
    return { valid: false, error: 'Invalid error count.' };
  }
  return { valid: true };
}

/**
 * Pure policy evaluator mirroring the PostgreSQL Row Level Security (RLS) rules for test_results.
 */
export function evaluateRlsPolicy(params: {
  action: 'select_private_history' | 'insert_result' | 'update_result' | 'delete_result';
  authenticatedUserId: string | null;
  recordUserId: string;
}): boolean {
  const { action, authenticatedUserId, recordUserId } = params;
  if (!authenticatedUserId) {
    return false;
  }
  if (action === 'select_private_history') {
    return authenticatedUserId === recordUserId;
  }
  if (action === 'insert_result') {
    return authenticatedUserId === recordUserId;
  }
  if (action === 'update_result' || action === 'delete_result') {
    return false;
  }
  return false;
}

/**
 * Validates that a signup OTP code contains exactly 6 numeric digits (0-9).
 */
export function validateSignupOtpToken(rawToken: string): {
  valid: boolean;
  token: string;
  error?: string;
} {
  const trimmed = (rawToken ?? '').trim();
  if (!trimmed) {
    return {
      valid: false,
      token: '',
      error: 'Please enter the 6-digit verification code sent to your email.',
    };
  }
  if (!/^\d{6}$/.test(trimmed)) {
    return {
      valid: false,
      token: trimmed,
      error: 'Verification code must contain exactly 6 digits (0–9).',
    };
  }
  return {
    valid: true,
    token: trimmed,
  };
}

export type AuthErrorKind =
  | 'unconfirmed_email'
  | 'rate_limit'
  | 'invalid_otp'
  | 'already_registered'
  | 'general';

/**
 * Classifies Supabase Auth errors into actionable user-facing messages for signup, OTP verification, resend, and login.
 */
export function classifySupabaseAuthError(
  error: { message?: string; status?: number; code?: string } | null | undefined
): {
  kind: AuthErrorKind;
  userMessage: string;
} {
  const rawMessage = error?.message?.trim() || 'Authentication request failed.';
  const code = (error?.code ?? '').toLowerCase();
  const lower = rawMessage.toLowerCase();

  if (
    code === 'email_not_confirmed' ||
    lower.includes('email not confirmed') ||
    lower.includes('email address not confirmed')
  ) {
    return {
      kind: 'unconfirmed_email',
      userMessage:
        'Your email address has not been verified yet. Please enter the 6-digit verification code sent to your email to finish activating your account.',
    };
  }

  if (
    error?.status === 429 ||
    code.includes('rate_limit') ||
    code === 'over_email_send_rate_limit' ||
    lower.includes('rate limit') ||
    lower.includes('for security purposes, you can only request this after') ||
    lower.includes('too many requests')
  ) {
    return {
      kind: 'rate_limit',
      userMessage:
        'Supabase email rate limit reached. Please wait a minute before requesting another 6-digit verification code.',
    };
  }

  if (
    code === 'otp_expired' ||
    code === 'otp_disabled' ||
    lower.includes('token has expired or is invalid') ||
    lower.includes('invalid otp') ||
    lower.includes('expired')
  ) {
    return {
      kind: 'invalid_otp',
      userMessage:
        'That 6-digit verification code is invalid or has expired. Please double-check the code or click "Resend Code" to receive a new one.',
    };
  }

  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    lower.includes('user already registered') ||
    lower.includes('already registered')
  ) {
    return {
      kind: 'already_registered',
      userMessage:
        'An account with this email is already registered. Please sign in with your password instead.',
    };
  }

  return {
    kind: 'general',
    userMessage: rawMessage,
  };
}

