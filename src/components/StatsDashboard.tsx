import React from 'react';
import { Trophy, Star, Award, CheckCircle2, RotateCcw, Zap, BookOpen } from 'lucide-react';
import { WordLevel, LevelProgress } from '../types';

interface StatsDashboardProps {
  levels: WordLevel[];
  levelProgress: Record<string, LevelProgress>;
  onResetAllProgress: () => void;
  onPlayLevel: (levelIndex: number) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  levels,
  levelProgress,
  onResetAllProgress,
  onPlayLevel,
}) => {
  const completedLevels = levels.filter((l) => levelProgress[l.id]?.completed);
  const totalStars = Object.values(levelProgress).reduce((acc, p) => acc + (p.stars || 0), 0);
  const totalWordsLearned = levels.reduce((acc, l) => {
    return acc + (levelProgress[l.id]?.completed ? l.pairs.length : 0);
  }, 0);

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
      
      {/* Title Banner */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-orange-500" />
              Ваш Прогрес Навчання
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1">
              Відстежуйте досягнення та пройдені рівні вивчення німецьких слів.
            </p>
          </div>

          <button
            onClick={onResetAllProgress}
            className="px-4 py-2.5 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5 transition-colors border-2 border-rose-300 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Скинути прогрес</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-sm">
          <div className="text-orange-600 text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            <span>Пройдено рівнів</span>
          </div>
          <div className="text-3xl font-black text-slate-800">
            {completedLevels.length} / {levels.length}
          </div>
        </div>

        <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-sm">
          <div className="text-amber-600 text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>Зібрано Зірок</span>
          </div>
          <div className="text-3xl font-black text-amber-600">
            {totalStars} / {levels.length * 3}
          </div>
        </div>

        <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-sm">
          <div className="text-emerald-700 text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Вивчено Слів</span>
          </div>
          <div className="text-3xl font-black text-emerald-700">
            {totalWordsLearned}
          </div>
        </div>

        <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-sm">
          <div className="text-indigo-700 text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>Всього списків</span>
          </div>
          <div className="text-3xl font-black text-indigo-700">
            {levels.length}
          </div>
        </div>

      </div>

      {/* Levels Table */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 shadow-md">
        <h3 className="text-lg font-black text-slate-800 mb-4">
          Деталізація по рівнях
        </h3>

        <div className="space-y-3">
          {levels.map((lvl, index) => {
            const prog = levelProgress[lvl.id];
            const isDone = prog?.completed;

            return (
              <div
                key={lvl.id}
                className="bg-slate-100 p-4 rounded-2xl border-2 border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-bold text-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-amber-400 text-slate-900 border-2 border-amber-500'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    #{lvl.levelNumber}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-800 text-base">
                      {lvl.title}
                    </div>
                    <div className="text-xs font-bold text-slate-500">
                      {lvl.category} • {lvl.pairs.length} слів
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {/* Star rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${
                          isDone && s <= (prog?.stars || 0)
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => onPlayLevel(index)}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    {isDone ? 'Переграти' : 'Грати'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
