/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, type ActiveTab } from './components/Navbar';
import { TypingArena, type CaretStyle, type FontSizeScale } from './components/TypingArena';
import { ResultsScreen } from './components/ResultsScreen';
import { PracticeView } from './components/PracticeView';
import { LeaderboardView } from './components/LeaderboardView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { useTypingTest } from './hooks/useTypingTest';
import { supabase } from './services/supabaseClient';
import type { SoundProfile } from './utils/soundEngine';
import type { User } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  theme: 'keycraft_theme_v1',
  soundEnabled: 'keycraft_sound_enabled_v1',
  soundProfile: 'keycraft_sound_profile_v1',
  caretStyle: 'keycraft_caret_style_v1',
  fontSize: 'keycraft_font_size_v1',
  siteName: 'keycraft_site_name_v1',
  localUsername: 'keycraft_local_username_v1',
};

function readLocalPref<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = window.localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalPref<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage error
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('test');
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    readLocalPref<'dark' | 'light'>(STORAGE_KEYS.theme, 'dark')
  );
  // Default sound state is OFF per requirements
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    readLocalPref<boolean>(STORAGE_KEYS.soundEnabled, false)
  );
  const [soundProfile, setSoundProfile] = useState<SoundProfile>(() =>
    readLocalPref<SoundProfile>(STORAGE_KEYS.soundProfile, 'tactile')
  );
  const [caretStyle, setCaretStyle] = useState<CaretStyle>(() =>
    readLocalPref<CaretStyle>(STORAGE_KEYS.caretStyle, 'bar')
  );
  const [fontSize, setFontSize] = useState<FontSizeScale>(() =>
    readLocalPref<FontSizeScale>(STORAGE_KEYS.fontSize, 'default')
  );
  const [siteName, setSiteName] = useState<string>(() =>
    readLocalPref<string>(STORAGE_KEYS.siteName, 'Keycraft')
  );
  const [localUsername, setLocalUsername] = useState<string>(() =>
    readLocalPref<string>(STORAGE_KEYS.localUsername, 'GuestTypist')
  );

  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState<number>(0);

  // Sync theme to document root
  useEffect(() => {
    writeLocalPref(STORAGE_KEYS.theme, theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.className =
        'bg-[#181816] text-[#e6e4dd] antialiased selection:bg-amber-500/20 selection:text-amber-300';
    } else {
      root.classList.remove('dark');
      document.body.className =
        'bg-[#f7f6f2] text-[#1c1b18] antialiased selection:bg-amber-500/20 selection:text-amber-900';
    }
  }, [theme]);

  // Subscribe to Supabase Auth session if configured
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const typing = useTypingTest({
    initialMode: 'timed',
    initialDuration: 60,
    soundEnabled,
    soundProfile,
  });

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      writeLocalPref(STORAGE_KEYS.soundEnabled, next);
      return next;
    });
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-150 ${
        isDark ? 'bg-[#181816] text-[#e6e4dd]' : 'bg-[#f7f6f2] text-[#1c1b18]'
      }`}
    >
      <Navbar
        siteName={siteName}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        user={user}
        localUsername={localUsername}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'test' &&
          (typing.state.status === 'completed' ? (
            <ResultsScreen
              state={typing.state}
              stats={typing.stats}
              timeline={typing.timeline}
              theme={theme}
              user={user}
              localUsername={localUsername}
              onRestartSame={typing.restartSamePassage}
              onTryAnotherParagraph={typing.loadNewPassage}
              onBackToHome={typing.loadNewPassage}
              onResultSaved={() => setRefreshHistoryTrigger((c) => c + 1)}
            />
          ) : (
            <TypingArena
              state={typing.state}
              presetDuration={typing.presetDuration}
              stats={typing.stats}
              renderedChars={typing.renderedChars}
              difficulty={typing.difficulty}
              category={typing.category}
              reachedEndWithErrors={typing.reachedEndWithErrors}
              theme={theme}
              caretStyle={caretStyle}
              fontSize={fontSize}
              onTypeCharacter={typing.typeCharacter}
              onBackspace={typing.backspace}
              onMoveCursor={typing.moveCursor}
              onAddThirtySeconds={typing.addThirtySeconds}
              onSelectMode={typing.setMode}
              onSelectDuration={typing.setDuration}
              onRestartSamePassage={typing.restartSamePassage}
              onLoadNewPassage={typing.loadNewPassage}
              onChangeFilter={typing.changeFilter}
            />
          ))}

        {activeTab === 'practice' && (
          <PracticeView
            theme={theme}
            onStartPractice={(opts) => {
              typing.startSpecificPractice(opts);
              setActiveTab('test');
            }}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            theme={theme}
            refreshTrigger={refreshHistoryTrigger}
            onStartTestWithConfig={(mode, duration) => {
              typing.startSpecificPractice({
                mode,
                durationSeconds: (duration as 30 | 60 | 180 | 360 | undefined) ?? 60,
              });
              setActiveTab('test');
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            theme={theme}
            user={user}
            refreshTrigger={refreshHistoryTrigger}
            onStartNewTest={() => setActiveTab('test')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            theme={theme}
            onSetTheme={setTheme}
            soundEnabled={soundEnabled}
            onSetSoundEnabled={(enabled) => {
              setSoundEnabled(enabled);
              writeLocalPref(STORAGE_KEYS.soundEnabled, enabled);
            }}
            soundProfile={soundProfile}
            onSetSoundProfile={(profile) => {
              setSoundProfile(profile);
              writeLocalPref(STORAGE_KEYS.soundProfile, profile);
            }}
            caretStyle={caretStyle}
            onSetCaretStyle={(style) => {
              setCaretStyle(style);
              writeLocalPref(STORAGE_KEYS.caretStyle, style);
            }}
            fontSize={fontSize}
            onSetFontSize={(scale) => {
              setFontSize(scale);
              writeLocalPref(STORAGE_KEYS.fontSize, scale);
            }}
            siteName={siteName}
            onSetSiteName={(name) => {
              setSiteName(name);
              writeLocalPref(STORAGE_KEYS.siteName, name);
            }}
          />
        )}
      </main>

      <footer
        className={`w-full border-t py-5 px-4 sm:px-6 text-xs transition-colors ${
          isDark
            ? 'border-[#24231f] text-[#6e6d68] bg-[#161513]'
            : 'border-[#e2e0d8] text-[#7c7970] bg-[#f2f0e8]'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span>{siteName} — Precision Typing Speed & Accuracy Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('test')}
              className="hover:text-amber-500 transition-colors"
            >
              Typing Test
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className="hover:text-amber-500 transition-colors"
            >
              Leaderboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="hover:text-amber-500 transition-colors"
            >
              Settings & SQL Schema
            </button>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        theme={theme}
        user={user}
        onUserAuthenticated={setUser}
        localUsername={localUsername}
        onSetLocalUsername={(name) => {
          setLocalUsername(name);
          writeLocalPref(STORAGE_KEYS.localUsername, name);
        }}
      />
    </div>
  );
}
