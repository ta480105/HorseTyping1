import React, { useState } from 'react';
import {
  Volume2,
  Sun,
  Moon,
  Type,
  Database,
  Copy,
  Check,
  Cloud,
} from 'lucide-react';
import { soundEngine, type SoundProfile } from '../utils/soundEngine';
import type { CaretStyle, FontSizeScale } from './TypingArena';
import {
  SUPABASE_MIGRATION_SQL,
  isSupabaseConfigured,
} from '../services/supabaseClient';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  onSetTheme: (theme: 'dark' | 'light') => void;
  soundEnabled: boolean;
  onSetSoundEnabled: (enabled: boolean) => void;
  soundProfile: SoundProfile;
  onSetSoundProfile: (profile: SoundProfile) => void;
  caretStyle: CaretStyle;
  onSetCaretStyle: (style: CaretStyle) => void;
  fontSize: FontSizeScale;
  onSetFontSize: (scale: FontSizeScale) => void;
  siteName: string;
  onSetSiteName: (name: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onSetTheme,
  soundEnabled,
  onSetSoundEnabled,
  soundProfile,
  onSetSoundProfile,
  caretStyle,
  onSetCaretStyle,
  fontSize,
  onSetFontSize,
  siteName,
  onSetSiteName,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const isDark = theme === 'dark';

  const handleCopySql = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL).catch(() => {});
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  return (
    <section
      aria-label="Application settings and deployment configuration"
      className="w-full max-w-4xl mx-auto py-8 sm:py-10 px-4 sm:px-6 space-y-8"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs text-[#8c8a82] mt-1">
          Customize your typing acoustics, visual theme, caret appearance, and inspect Supabase RLS & Cloudflare deployment setup.
        </p>
      </div>

      {/* Appearance & Theme */}
      <div
        className={`p-6 rounded-2xl border space-y-6 ${
          isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              {isDark ? (
                <Moon className="w-4 h-4 text-amber-500" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>Color Theme</span>
            </h2>
            <p className="text-xs text-[#8c8a82] mt-0.5">
              Default warm charcoal dark theme or high-contrast warm alabaster light theme.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSetTheme('dark')}
              aria-pressed={theme === 'dark'}
              className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'bg-amber-500 text-[#181816] border-amber-500 font-semibold'
                  : 'border-[#d5d2c8] text-[#5c5a52] hover:text-[#1c1b18]'
              }`}
            >
              Dark Charcoal
            </button>
            <button
              type="button"
              onClick={() => onSetTheme('light')}
              aria-pressed={theme === 'light'}
              className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                theme === 'light'
                  ? 'bg-amber-500 text-[#181816] border-amber-500 font-semibold'
                  : 'border-[#2c2b26] text-[#9e9c93] hover:text-[#e6e4dd]'
              }`}
            >
              Light Alabaster
            </button>
          </div>
        </div>

        <hr className={isDark ? 'border-[#292824]' : 'border-[#e2e0d8]'} />

        {/* Caret & Font Scale */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
              <Type className="w-4 h-4 text-amber-500" />
              <span>Active Caret Indicator</span>
            </h3>
            <p className="text-xs text-[#8c8a82] mb-3">
              Choose how the current character position is highlighted.
            </p>
            <div className="flex items-center gap-2">
              {(['bar', 'underline', 'block'] as CaretStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onSetCaretStyle(style)}
                  aria-pressed={caretStyle === style}
                  className={`px-3 py-1.5 text-xs font-medium capitalize rounded-lg border transition-colors ${
                    caretStyle === style
                      ? 'border-amber-500 text-amber-500 bg-amber-500/10 font-semibold'
                      : isDark
                      ? 'border-[#292824] text-[#9e9c93]'
                      : 'border-[#e2e0d8] text-[#5c5a52]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-1">Passage Font Scale</h3>
            <p className="text-xs text-[#8c8a82] mb-3">
              Adjust monospaced passage size for your display distance.
            </p>
            <div className="flex items-center gap-2">
              {(['compact', 'default', 'large'] as FontSizeScale[]).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => onSetFontSize(scale)}
                  aria-pressed={fontSize === scale}
                  className={`px-3 py-1.5 text-xs font-medium capitalize rounded-lg border transition-colors ${
                    fontSize === scale
                      ? 'border-amber-500 text-amber-500 bg-amber-500/10 font-semibold'
                      : isDark
                      ? 'border-[#292824] text-[#9e9c93]'
                      : 'border-[#e2e0d8] text-[#5c5a52]'
                  }`}
                >
                  {scale}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr className={isDark ? 'border-[#292824]' : 'border-[#e2e0d8]'} />

        {/* Configurable Workspace Brand Name */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <label htmlFor="site-brand-input" className="text-sm font-semibold block">
              Configurable Workspace Title
            </label>
            <p className="text-xs text-[#8c8a82]">
              Customize the top bar brand label (saved locally).
            </p>
          </div>
          <input
            id="site-brand-input"
            type="text"
            maxLength={22}
            value={siteName}
            onChange={(e) => onSetSiteName(e.target.value || 'Keycraft')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border w-48 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              isDark
                ? 'bg-[#141412] border-[#2c2b26] text-[#e6e4dd]'
                : 'bg-[#f7f6f2] border-[#d5d2c8] text-[#1c1b18]'
            }`}
          />
        </div>
      </div>

      {/* Sound & Acoustic Feedback */}
      <div
        className={`p-6 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>Typing Sound Effects</span>
            </h2>
            <p className="text-xs text-[#8c8a82] mt-0.5">
              Synthesized low-latency Web Audio switch acoustics. Default is off.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                onSetSoundEnabled(next);
                if (next) {
                  soundEngine.playKey(true, soundProfile);
                }
              }}
              aria-pressed={soundEnabled}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-amber-500 text-[#181816] border-amber-500'
                  : isDark
                  ? 'border-[#2c2b26] text-[#9e9c93]'
                  : 'border-[#d5d2c8] text-[#5c5a52]'
              }`}
            >
              {soundEnabled ? 'Sound Enabled' : 'Sound Off'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            {(['tactile', 'thock', 'minimal'] as SoundProfile[]).map((profile) => (
              <button
                key={profile}
                type="button"
                onClick={() => {
                  onSetSoundProfile(profile);
                  soundEngine.playKey(true, profile);
                }}
                className={`px-3 py-1.5 text-xs font-medium capitalize rounded-lg border transition-colors ${
                  soundProfile === profile
                    ? 'border-amber-500 text-amber-500 bg-amber-500/10 font-semibold'
                    : isDark
                    ? 'border-[#292824] text-[#9e9c93]'
                    : 'border-[#e2e0d8] text-[#5c5a52]'
                }`}
              >
                {profile} Switch
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => soundEngine.playKey(true, soundProfile)}
            className="text-xs text-amber-500 hover:underline font-medium"
          >
            Preview Keystroke Sound
          </button>
        </div>
      </div>

      {/* Supabase PostgreSQL & Row Level Security Setup */}
      <div
        className={`p-6 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-500" />
              <span>Supabase Database & Row Level Security (RLS)</span>
            </h2>
            <p className="text-xs text-[#8c8a82] mt-0.5">
              Status:{' '}
              <span className={isSupabaseConfigured ? 'text-emerald-400 font-semibold' : 'text-amber-500 font-semibold'}>
                {isSupabaseConfigured
                  ? 'Connected via VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY'
                  : 'Running in Guest / Local Storage Mode (VITE_SUPABASE_URL not configured)'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-[#181816] hover:bg-amber-400 transition-colors"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied Migration SQL' : 'Copy SQL Migration'}</span>
          </button>
        </div>

        <p className="text-xs text-[#8c8a82] leading-relaxed">
          To enable cloud-persisted accounts, private history, and global leaderboards:
          1) Create a Supabase project and run the migration below (also saved at{' '}
          <code className="font-mono text-amber-500">supabase/migrations/001_init_keycraft.sql</code>
          ). 2) Set <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
          <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> in your environment. Never expose the service-role secret key in frontend variables.
        </p>

        <pre
          className={`p-4 rounded-xl border text-[11px] font-mono overflow-x-auto max-h-60 ${
            isDark
              ? 'bg-[#121210] border-[#292824] text-[#b8b6ad]'
              : 'bg-[#f4f2ec] border-[#d5d2c8] text-[#33322c]'
          }`}
        >
          {SUPABASE_MIGRATION_SQL}
        </pre>
      </div>

      {/* Cloudflare Pages Deployment Guide */}
      <div
        className={`p-6 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
        }`}
      >
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Cloud className="w-4 h-4 text-amber-500" />
          <span>Cloudflare Pages & GitHub Deployment</span>
        </h2>
        <div className="text-xs text-[#8c8a82] space-y-2 leading-relaxed">
          <p>
            • <strong>Build Command:</strong> <code className="font-mono">npm run build</code> ·{' '}
            <strong>Build Output Directory:</strong> <code className="font-mono">dist</code>
          </p>
          <p>
            • <strong>SPA Routing Fallback:</strong> Configured automatically via{' '}
            <code className="font-mono">public/_redirects</code> (<code className="font-mono">/* /index.html 200</code>).
          </p>
          <p>
            • <strong>Environment Variables:</strong> In Cloudflare Pages → Settings → Environment Variables, add{' '}
            <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
            <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> (optional; the core typing engine and local storage history work without backend credentials).
          </p>
        </div>
      </div>
    </section>
  );
};
