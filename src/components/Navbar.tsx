import React from 'react';
import { Volume2, VolumeX, Sun, Moon, User as UserIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export type ActiveTab = 'test' | 'practice' | 'leaderboard' | 'history' | 'settings';

interface NavbarProps {
  siteName: string;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  user: User | null;
  localUsername: string;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  siteName,
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  user,
  localUsername,
  onOpenAuthModal,
}) => {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'test', label: 'Typing Test' },
    { id: 'practice', label: 'Practice' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ];

  const isDark = theme === 'dark';

  return (
    <header
      className={`w-full border-b transition-colors duration-150 ${
        isDark
          ? 'bg-[#181816] border-[#292824] text-[#e6e4dd]'
          : 'bg-[#f7f6f2] border-[#e2e0d8] text-[#1c1b18]'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('test')}
          className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1 -ml-1 flex items-center gap-2"
        >
          <span>{siteName}</span>
        </button>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-sm ${
                  isActive
                    ? 'border-amber-500 text-amber-500 font-semibold'
                    : isDark
                    ? 'border-transparent text-[#8c8a82] hover:text-[#e6e4dd]'
                    : 'border-transparent text-[#68665e] hover:text-[#1c1b18]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Utility & Account Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute typing sounds' : 'Enable typing sounds'}
            title={soundEnabled ? 'Typing sounds: On' : 'Typing sounds: Off'}
            className={`p-2 rounded-lg border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              soundEnabled
                ? 'border-amber-500/40 text-amber-500 bg-amber-500/10'
                : isDark
                ? 'border-[#292824] text-[#8c8a82] hover:text-[#e6e4dd] hover:border-[#3a3933]'
                : 'border-[#e2e0d8] text-[#68665e] hover:text-[#1c1b18] hover:border-[#c9c6bc]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className={`p-2 rounded-lg border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isDark
                ? 'border-[#292824] text-[#8c8a82] hover:text-[#e6e4dd] hover:border-[#3a3933]'
                : 'border-[#e2e0d8] text-[#68665e] hover:text-[#1c1b18] hover:border-[#c9c6bc]'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenAuthModal}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              user
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                : isDark
                ? 'border-[#292824] bg-[#21201d] text-[#e6e4dd] hover:border-amber-500/50'
                : 'border-[#d5d2c8] bg-white text-[#1c1b18] hover:border-amber-600/50'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>
              {user
                ? user.user_metadata?.username || user.email?.split('@')[0] || 'Account'
                : localUsername
                ? `${localUsername}`
                : 'Sign In'}
            </span>
          </button>
        </div>
      </div>

      {/* Compact Mobile Navigation Row */}
      <nav
        aria-label="Mobile navigation"
        className={`md:hidden flex items-center justify-between px-3 py-2 border-t gap-1 ${
          isDark ? 'border-[#23221f] bg-[#151513]' : 'border-[#e6e4dc] bg-[#f0efe9]'
        }`}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`px-2 py-1 text-[11px] font-medium rounded whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-amber-500 text-[#181816] font-semibold'
                  : isDark
                  ? 'text-[#8c8a82] hover:text-[#e6e4dd]'
                  : 'text-[#68665e] hover:text-[#1c1b18]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
