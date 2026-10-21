import React, { useState } from 'react';
import { Play, BookOpen, Edit3 } from 'lucide-react';
import { PASSAGES, type PassageCategory, type PassageDifficulty } from '../data/passages';
import type { TestMode, TimedPresetDuration } from '../engine/typingEngine';

interface PracticeViewProps {
  theme: 'dark' | 'light';
  onStartPractice: (options: {
    mode: TestMode;
    durationSeconds?: TimedPresetDuration;
    passageId?: string;
    customText?: string;
  }) => void;
}

const CATEGORIES: (PassageCategory | 'all')[] = [
  'all',
  'general',
  'science',
  'technology',
  'animals',
  'nature',
  'geography',
  'history',
  'education',
  'literature',
  'punctuation',
];

export const PracticeView: React.FC<PracticeViewProps> = ({ theme, onStartPractice }) => {
  const [selectedCategory, setSelectedCategory] = useState<PassageCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<PassageDifficulty | 'all'>('all');
  const [customInput, setCustomInput] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const filtered = PASSAGES.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const handleLaunchCustom = (mode: TestMode) => {
    const cleaned = customInput.replace(/\s+/g, ' ').trim();
    if (cleaned.length < 15) {
      setCustomError('Please enter at least 15 characters for a custom practice passage.');
      return;
    }
    setCustomError(null);
    onStartPractice({
      mode,
      durationSeconds: 60,
      customText: cleaned,
    });
  };

  return (
    <section
      aria-label="Focused typing practice and custom drills"
      className="w-full max-w-5xl mx-auto py-8 sm:py-10 px-4 sm:px-6"
    >
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Practice Drills ({PASSAGES.length} Original Passages)
        </h1>
        <p className="text-sm text-[#8c8a82] mt-1">
          Select a curated passage across 10 topics and 3 difficulty levels, or paste your own custom text for targeted accuracy training.
        </p>
      </div>

      {/* Custom Text Practice Box */}
      <div
        className={`p-6 rounded-2xl border mb-8 ${
          isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
          <Edit3 className="w-4 h-4 text-amber-500" />
          <span>Custom Passage Drill</span>
        </div>
        <p className="text-xs text-[#8c8a82] mb-3">
          Practice a specific paragraph, technical snippet, or prose excerpt. Spaces and punctuation are validated character by character.
        </p>
        <label htmlFor="custom-practice-textarea" className="sr-only">
          Custom practice text
        </label>
        <textarea
          id="custom-practice-textarea"
          rows={3}
          value={customInput}
          onChange={(e) => {
            setCustomInput(e.target.value);
            if (customError) setCustomError(null);
          }}
          placeholder="Paste or type a custom paragraph here (minimum 15 characters)..."
          className={`w-full rounded-xl border p-3.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            isDark
              ? 'bg-[#141412] border-[#2c2b26] text-[#e6e4dd] placeholder-[#68665e]'
              : 'bg-[#f7f6f2] border-[#d5d2c8] text-[#1c1b18] placeholder-[#8c8a82]'
          }`}
        />
        {customError && (
          <p role="alert" className="text-xs text-red-400 mt-2">
            {customError}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleLaunchCustom('paragraph')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-[#181816] hover:bg-amber-400 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Practice as Full Paragraph</span>
          </button>
          <button
            type="button"
            onClick={() => handleLaunchCustom('timed')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
              isDark
                ? 'border-[#2c2b26] bg-[#24231f] text-[#e6e4dd] hover:border-amber-500/40'
                : 'border-[#d5d2c8] bg-[#f7f6f2] text-[#1c1b18] hover:border-amber-600/40'
            }`}
          >
            <span>Practice in 1m Timed Mode</span>
          </button>
        </div>
      </div>

      {/* Filter Bar for Curated Passages */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium capitalize rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-[#181816] font-semibold'
                  : isDark
                  ? 'bg-[#1d1c19] text-[#9e9c93] hover:text-[#e6e4dd] border border-[#292824]'
                  : 'bg-white text-[#5c5a52] hover:text-[#1c1b18] border border-[#e2e0d8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-2.5 py-1 text-xs font-medium capitalize rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedDifficulty === diff
                  ? isDark
                    ? 'bg-[#2e2d28] text-amber-400 border border-amber-500/40'
                    : 'bg-[#e6e3d8] text-[#1c1b18] font-semibold'
                  : 'text-[#8c8a82] hover:text-amber-500'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Curated Passages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((passage) => (
          <div
            key={passage.id}
            className={`p-5 rounded-xl border flex flex-col justify-between transition-colors ${
              isDark ? 'bg-[#1d1c19] border-[#292824]' : 'bg-white border-[#e2e0d8]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-base font-semibold tracking-tight">{passage.title}</h2>
                <div className="text-xs text-[#8c8a82] capitalize shrink-0">
                  {passage.category} · {passage.difficulty} · {passage.text.length} chars
                </div>
              </div>
              <p
                className={`text-xs font-mono leading-relaxed line-clamp-3 mb-4 ${
                  isDark ? 'text-[#9e9c93]' : 'text-[#5c5a52]'
                }`}
              >
                {passage.text}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#292824]/40">
              <button
                type="button"
                onClick={() =>
                  onStartPractice({
                    mode: 'paragraph',
                    passageId: passage.id,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-[#181816] hover:bg-amber-400 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Practice Paragraph</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onStartPractice({
                    mode: 'timed',
                    durationSeconds: 60,
                    passageId: passage.id,
                  })
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  isDark
                    ? 'border-[#2c2b26] text-[#9e9c93] hover:text-[#e6e4dd]'
                    : 'border-[#d5d2c8] text-[#5c5a52] hover:text-[#1c1b18]'
                }`}
              >
                1m Timed
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
