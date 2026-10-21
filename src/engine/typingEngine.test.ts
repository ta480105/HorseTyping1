import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  handleCharInput,
  handleBackspace,
  handleCursorMove,
  tickTimer,
  addTimeSeconds,
  formatTimerMMSS,
  formatDurationLabel,
  computeStats,
  getRenderedCharacters,
  calculateWpm,
  calculateAccuracy,
  SubmissionRegistry,
  validateResultPayload,
  evaluateRlsPolicy,
  validateSignupOtpToken,
  classifySupabaseAuthError,
  type TimedPresetDuration,
} from './typingEngine.ts';
import { PASSAGES, selectNextPassage } from '../data/passages.ts';

test('1. All four timed test modes (30s, 1m, 3m, 6m) initialize with exact durations and MM:SS display', () => {
  const expectedModes: { duration: TimedPresetDuration; mmss: string; label: string }[] = [
    { duration: 30, mmss: '00:30', label: '30 sec' },
    { duration: 60, mmss: '01:00', label: '1 min' },
    { duration: 180, mmss: '03:00', label: '3 min' },
    { duration: 360, mmss: '06:00', label: '6 min' },
  ];

  for (const item of expectedModes) {
    const state = createInitialState({
      mode: 'timed',
      durationSeconds: item.duration,
      passage: 'steady cadence and precision',
    });
    assert.equal(state.status, 'idle');
    assert.equal(state.durationSeconds, item.duration);
    assert.equal(state.remainingMs, item.duration * 1000);
    assert.equal(formatTimerMMSS(state.remainingMs), item.mmss);
    assert.equal(formatDurationLabel(item.duration), item.label);
  }
});

test('2. +30 Seconds feature works across all four timed modes (30s, 60s, 180s, 360s) without resetting progress', () => {
  for (const preset of [30, 60, 180, 360] as TimedPresetDuration[]) {
    let state = createInitialState({
      mode: 'timed',
      durationSeconds: preset,
      passage: 'steady pace',
    });
    state = handleCharInput(state, 's', 1000);
    state = handleCharInput(state, 't', 2000);
    state = tickTimer(state, 11000); // 10s elapsed
    const expectedBeforeAdd = (preset - 10) * 1000;
    assert.equal(state.remainingMs, expectedBeforeAdd);

    // Click +30 Seconds during active test
    state = addTimeSeconds(state, 30, 11000);
    assert.equal(state.durationSeconds, preset + 30);
    assert.equal(state.remainingMs, expectedBeforeAdd + 30000);
    assert.equal(state.cursor, 2);
    assert.equal(state.typed.length, 2);
    assert.equal(state.passage, 'steady pace');
  }
});

test('3. Completed tests cannot be revived with the +30 sec button, and paragraph mode ignores +30 sec', () => {
  let state = createInitialState({ mode: 'timed', durationSeconds: 30, passage: 'hello' });
  state = handleCharInput(state, 'h', 1000);
  state = tickTimer(state, 31000); // Expired at 30s
  assert.equal(state.status, 'completed');
  assert.equal(state.remainingMs, 0);

  const afterAdd = addTimeSeconds(state, 30, 32000);
  assert.equal(afterAdd.status, 'completed');
  assert.equal(afterAdd.remainingMs, 0);
  assert.equal(afterAdd.durationSeconds, 30);

  // Paragraph mode ignores +30 sec
  let paraState = createInitialState({ mode: 'paragraph', passage: 'fixed text' });
  paraState = handleCharInput(paraState, 'f', 1000);
  const paraAfterAdd = addTimeSeconds(paraState, 30, 2000);
  assert.equal(paraAfterAdd.remainingMs, 0);
});

test('4. All four timed modes (30s, 60s, 180s, 360s) expire at 00:00 and freeze results once', () => {
  for (const sec of [30, 60, 180, 360] as TimedPresetDuration[]) {
    let state = createInitialState({
      mode: 'timed',
      durationSeconds: sec,
      passage: 'extraordinary',
    });
    state = handleCharInput(state, 'e', 1000);
    state = handleCharInput(state, 'x', 2000);
    state = tickTimer(state, 1000 + sec * 1000);
    assert.equal(state.status, 'completed');
    assert.equal(state.remainingMs, 0);
    assert.equal(formatTimerMMSS(state.remainingMs), '00:00');
    assert.equal(state.elapsedMs, sec * 1000);
    assert.equal(state.frozenStats?.charactersTyped, 2);
  }
});

test('5. Switching modes or restarting resets timer, typed text, and statistics cleanly', () => {
  let state = createInitialState({ mode: 'timed', durationSeconds: 60, passage: 'first test' });
  state = handleCharInput(state, 'f', 1000);
  state = handleCharInput(state, 'z', 2000); // error
  state = tickTimer(state, 15000);
  assert.equal(state.status, 'running');
  assert.equal(computeStats(state, 15000).currentErrors, 1);

  // Switch to 30 Seconds mode
  const switchedTo30 = createInitialState({
    mode: 'timed',
    durationSeconds: 30,
    passage: 'second test',
  });
  assert.equal(switchedTo30.status, 'idle');
  assert.equal(switchedTo30.remainingMs, 30000);
  assert.equal(switchedTo30.typed.length, 0);
  assert.equal(switchedTo30.cursor, 0);
  assert.equal(computeStats(switchedTo30).currentErrors, 0);
  assert.equal(computeStats(switchedTo30).wpm, 0);
});

test('6. Local passage collection contains at least 100 original passages and avoids immediate repetition', () => {
  assert.equal(PASSAGES.length >= 100, true);
  const ids = new Set(PASSAGES.map((p) => p.id));
  assert.equal(ids.size, PASSAGES.length);

  const first = PASSAGES[0];
  for (let i = 0; i < 15; i += 1) {
    const next = selectNextPassage([first.id]);
    assert.notEqual(next.id, first.id);
  }
});

test('7. Correct characters render green and incorrect characters render red without blocking input', () => {
  let state = createInitialState({ mode: 'timed', durationSeconds: 60, passage: 'hello' });
  state = handleCharInput(state, 'h', 1000);
  state = handleCharInput(state, 'x', 1100);
  state = handleCharInput(state, 'l', 1200);
  const rendered = getRenderedCharacters(state);
  assert.equal(rendered[0].status, 'correct');
  assert.equal(rendered[1].status, 'incorrect');
  assert.equal(rendered[2].status, 'correct');
  assert.equal(state.cursor, 3);
});

test('8. Backspace and arrow-key cursor movement work within valid boundaries', () => {
  let state = createInitialState({ mode: 'timed', durationSeconds: 60, passage: 'abcd' });
  state = handleCharInput(state, 'a', 1000);
  state = handleCharInput(state, 'x', 1100);
  state = handleCharInput(state, 'c', 1200);
  assert.equal(state.cursor, 3);

  state = handleCursorMove(state, 'left', 1250);
  state = handleCursorMove(state, 'left', 1260);
  assert.equal(state.cursor, 1);

  state = handleCharInput(state, 'b', 1300);
  assert.equal(state.cursor, 2);
  assert.equal(getRenderedCharacters(state)[1].status, 'correct');

  state = handleCursorMove(state, 'right', 1350);
  assert.equal(state.cursor, 3);
  state = handleCursorMove(state, 'right', 1360);
  assert.equal(state.cursor, 3);
});

test('9. Correcting a mistake updates current error count and accuracy immediately', () => {
  let state = createInitialState({ mode: 'timed', durationSeconds: 60, passage: 'test' });
  state = handleCharInput(state, 't', 1000);
  state = handleCharInput(state, 'x', 1100);
  assert.equal(computeStats(state, 1100).currentErrors, 1);
  assert.equal(computeStats(state, 1100).accuracy, 50);

  state = handleBackspace(state, 1200);
  assert.equal(computeStats(state, 1200).currentErrors, 0);
  assert.equal(computeStats(state, 1200).accuracy, 100);
});

test('10. WPM and Accuracy handle zero elapsed time and known inputs accurately', () => {
  assert.equal(calculateAccuracy(0, 0), 0);
  assert.equal(calculateWpm(0, 0), 0);
  assert.equal(calculateWpm(250, 60000), 50);
  assert.equal(calculateWpm(150, 30000), 60);
});

test('11. Paragraph mode has no countdown, keeps passage unchanged, does not finish while errors remain, and finishes when corrected', () => {
  const fixedPassage = 'cat';
  let state = createInitialState({ mode: 'paragraph', passage: fixedPassage });
  assert.equal(state.remainingMs, 0);

  state = handleCharInput(state, 'c', 1000);
  state = handleCharInput(state, 'o', 1100); // wrong middle character
  state = handleCharInput(state, 't', 1200); // reached end with error
  state = tickTimer(state, 5000);
  assert.equal(state.status, 'running');
  assert.equal(state.remainingMs, 0);
  assert.equal(state.passage, fixedPassage);

  // Navigate left to index 1 and overwrite 'o' with 'a'
  state = handleCursorMove(state, 'left', 5100);
  state = handleCursorMove(state, 'left', 5200);
  state = handleCharInput(state, 'a', 5300);
  assert.equal(state.status, 'completed');
  assert.equal(state.frozenStats?.accuracy, 100);
  assert.equal(state.frozenStats?.currentErrors, 0);
});

test('12. Completed results are frozen and duplicate submissions or unauthorized RLS actions are rejected', () => {
  let state = createInitialState({ mode: 'paragraph', passage: 'hi' });
  state = handleCharInput(state, 'h', 1000);
  state = handleCharInput(state, 'i', 2000);
  assert.equal(state.status, 'completed');
  const frozenWpm = state.frozenStats?.wpm;

  const afterExtra = handleCharInput(state, '!', 4000);
  assert.equal(computeStats(afterExtra, 8000).wpm, frozenWpm);

  const registry = new SubmissionRegistry();
  assert.equal(registry.markSubmitted(state.submissionId), true);
  assert.equal(registry.markSubmitted(state.submissionId), false);

  // 30-second test and +30s extended tests (60s, 90s) are accepted by payload validator
  for (const validDur of [30, 60, 90, 180, 360]) {
    assert.equal(
      validateResultPayload({
        submissionId: `sub_${validDur}s`,
        userId: 'user-a',
        mode: 'timed',
        durationSeconds: validDur,
        wpm: 75,
        netWpm: 75,
        accuracy: 98.5,
        errors: 1,
        charactersTyped: 190,
        correctCharacters: 187,
      }).valid,
      true
    );
  }

  assert.equal(
    evaluateRlsPolicy({
      action: 'select_private_history',
      authenticatedUserId: 'user-a',
      recordUserId: 'user-b',
    }),
    false
  );
});

test('13. Signup 6-digit OTP validation and Supabase Auth error classification enforce strict rules', () => {
  // Valid 6-digit codes
  assert.deepEqual(validateSignupOtpToken('123456'), {
    valid: true,
    token: '123456',
  });
  assert.deepEqual(validateSignupOtpToken('  009842  '), {
    valid: true,
    token: '009842',
  });

  // Invalid OTP codes (empty, 5 digits, 7 digits, alphabetic/symbols)
  assert.equal(validateSignupOtpToken('').valid, false);
  assert.equal(validateSignupOtpToken('12345').valid, false);
  assert.equal(validateSignupOtpToken('1234567').valid, false);
  assert.equal(validateSignupOtpToken('12a456').valid, false);
  assert.equal(validateSignupOtpToken('12-456').valid, false);

  // Classify unconfirmed email during login
  const unconfirmed = classifySupabaseAuthError({
    message: 'Email not confirmed',
    code: 'email_not_confirmed',
  });
  assert.equal(unconfirmed.kind, 'unconfirmed_email');

  // Classify Supabase email rate limit
  const rateLimited = classifySupabaseAuthError({
    message: 'For security purposes, you can only request this after 55 seconds.',
    status: 429,
  });
  assert.equal(rateLimited.kind, 'rate_limit');

  // Classify invalid/expired OTP token
  const expiredOtp = classifySupabaseAuthError({
    message: 'Token has expired or is invalid',
    code: 'otp_expired',
  });
  assert.equal(expiredOtp.kind, 'invalid_otp');
});

