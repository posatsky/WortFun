import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Volume2, BookOpen, Layers, Filter, Sparkles, HelpCircle } from 'lucide-react';
import { WordLevel, WordPair } from '../types';
import { audioManager } from '../utils/audio';

interface DictionaryViewProps {
  levels: WordLevel[];
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({ levels }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'flashcards'>('list');

  // Flatten all words across selected levels
  const filteredLevels = selectedLevelId === 'all'
    ? levels
    : levels.filter((l) => l.id === selectedLevelId);

  const allPairs: { levelTitle: string; pair: WordPair }[] = [];
  filteredLevels.forEach((lvl) => {
    lvl.pairs.forEach((pair) => {
      allPairs.push({ levelTitle: lvl.title, pair });
    });
  });

  const searchedPairs = allPairs.filter(({ pair }) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      pair.german.toLowerCase().includes(q) ||
      pair.ukrainian.toLowerCase().includes(q) ||
      (pair.exampleGerman && pair.exampleGerman.toLowerCase().includes(q))
    );
  });

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentFlashcard = searchedPairs[flashcardIndex];

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
      
      {/* Search & Header Controls */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Словник та Картки для повторення
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Знайдено {searchedPairs.length} слів серед усіх доступних рівнів.
            </p>
          </div>

          {/* Mode switch */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto font-bold">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'list'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Список слів
            </button>
            <button
              onClick={() => {
                setActiveTab('flashcards');
                setFlashcardIndex(0);
                setIsFlipped(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Флешкартки
            </button>
          </div>
        </div>

        {/* Search input & Level filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук слова німецькою або українською..."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 text-base font-semibold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <select
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 text-base font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">Усі рівні ({levels.length})</option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  Рівень {lvl.levelNumber}: {lvl.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LIST VIEW */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {searchedPairs.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-medium text-sm">
              Слів за вашим запитом не знайдено. Спробуйте змінити пошукове слово.
            </div>
          ) : (
            searchedPairs.map(({ levelTitle, pair }, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-slate-100 rounded-2xl p-4 hover:border-amber-300 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => audioManager.speakGerman(pair.german)}
                    className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
                    title="Слухати вимову"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-800 text-lg sm:text-xl">
                        {pair.german}
                      </span>
                      <span className="text-slate-300 text-sm font-bold">—</span>
                      <span className="text-orange-600 font-black text-lg sm:text-xl">
                        {pair.ukrainian}
                      </span>
                    </div>
                    {pair.exampleGerman && (
                      <p className="text-sm text-slate-600 font-medium italic mt-1">
                        «{pair.exampleGerman}»{' '}
                        <span className="text-slate-500 not-italic font-normal">
                          ({pair.exampleUkrainian})
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-[11px] font-extrabold text-slate-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shrink-0 self-start sm:self-auto">
                  {levelTitle}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* FLASHCARDS VIEW */}
      {activeTab === 'flashcards' && (
        <div className="max-w-xl mx-auto text-center">
          {searchedPairs.length === 0 ? (
            <div className="bg-white border-2 border-amber-200 rounded-3xl p-8 text-slate-500 font-medium">
              Немає слів для показу.
            </div>
          ) : (
            <div>
              <div className="text-xs font-black text-slate-500 mb-3 uppercase tracking-wider">
                Картка {flashcardIndex + 1} з {searchedPairs.length}
              </div>

              {/* Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="bg-white border-4 border-amber-300 hover:border-orange-400 rounded-3xl p-8 sm:p-12 min-h-[280px] flex flex-col justify-between items-center cursor-pointer shadow-[0_10px_0_0_#cbd5e1] active:translate-y-1 active:shadow-none transition-all my-4 relative group"
              >
                <div className="text-[11px] uppercase font-black tracking-widest text-orange-600 bg-orange-100 px-4 py-1 rounded-full border border-orange-200">
                  {isFlipped ? '🇺🇦 Переклад' : '🇩🇪 Німецька мова (Натисніть для перевороту)'}
                </div>

                <div className="my-auto">
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <div className="text-3xl sm:text-4xl font-black text-slate-800">
                        {currentFlashcard.pair.german}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          audioManager.speakGerman(currentFlashcard.pair.german);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-orange-700 bg-orange-100 hover:bg-orange-500 hover:text-white px-3.5 py-2 rounded-xl transition-colors font-bold shadow-sm"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Слухати вимову</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-3xl sm:text-4xl font-black text-orange-600">
                        {currentFlashcard.pair.ukrainian}
                      </div>
                      {currentFlashcard.pair.exampleGerman && (
                        <p className="text-xs text-slate-600 font-medium italic max-w-sm mx-auto mt-3">
                          «{currentFlashcard.pair.exampleGerman}»
                          <br />
                          <span className="text-slate-500 not-italic font-normal">
                            ({currentFlashcard.pair.exampleUkrainian})
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-bold">
                  {currentFlashcard.levelTitle}
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between gap-4 mt-6">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setFlashcardIndex((prev) => (prev > 0 ? prev - 1 : searchedPairs.length - 1));
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors border-2 border-slate-200"
                >
                  ← Попередня
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition-colors shadow-md"
                >
                  Перевернути
                </button>

                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setFlashcardIndex((prev) => (prev < searchedPairs.length - 1 ? prev + 1 : 0));
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors border-2 border-slate-200"
                >
                  Наступна →
                </button>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};
