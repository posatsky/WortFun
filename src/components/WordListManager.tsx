import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Edit3, FileText, Check, Download, Upload, AlertCircle, BookOpen } from 'lucide-react';
import { WordLevel, WordPair } from '../types';

interface WordListManagerProps {
  levels: WordLevel[];
  onAddCustomLevel: (level: WordLevel) => void;
  onDeleteCustomLevel: (levelId: string) => void;
  onSelectLevelToPlay: (levelIndex: number) => void;
}

export const WordListManager: React.FC<WordListManagerProps> = ({
  levels,
  onAddCustomLevel,
  onDeleteCustomLevel,
  onSelectLevelToPlay,
}) => {
  const customLevels = levels.filter((l) => l.isCustom);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Власний список');
  const [difficulty, setDifficulty] = useState<'A1' | 'A2' | 'B1' | 'B2'>('A1');
  const [bulkText, setBulkText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateFromText = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setError('Будь ласка, введіть назву списку.');
      return;
    }

    if (!bulkText.trim()) {
      setError('Будь ласка, введіть хоча б 3-4 пари слів.');
      return;
    }

    // Parse lines: "der Apfel - яблуко" or "der Apfel : яблуко" or "der Apfel = яблуко"
    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const parsedPairs: WordPair[] = [];

    const newLevelId = `custom-manual-${Date.now()}`;

    lines.forEach((line, idx) => {
      const parts = line.split(/[-=:;—]/);
      if (parts.length >= 2) {
        const german = parts[0].trim();
        const ukrainian = parts.slice(1).join(' - ').trim();
        if (german && ukrainian) {
          parsedPairs.push({
            id: `${newLevelId}-p${idx + 1}`,
            german,
            ukrainian,
          });
        }
      }
    });

    if (parsedPairs.length < 3) {
      setError('Не вдалося розпізнати слова. Формат: "Німецьке слово - Український переклад" (кожна пара з нового рядка).');
      return;
    }

    const newLevel: WordLevel = {
      id: newLevelId,
      levelNumber: Date.now() % 1000,
      title: title.trim(),
      description: description.trim() || `Список із ${parsedPairs.length} слів.`,
      category: category.trim() || 'Власний список',
      difficulty,
      isCustom: true,
      createdAt: Date.now(),
      pairs: parsedPairs,
    };

    onAddCustomLevel(newLevel);
    setSuccessMsg(`Успішно створено список "${newLevel.title}" (${parsedPairs.length} слів)!`);
    setTitle('');
    setDescription('');
    setBulkText('');
  };

  // Export custom levels as JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customLevels, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `wortpaar_custom_levels_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import custom levels from JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          imported.forEach((lvl) => {
            if (lvl.title && Array.isArray(lvl.pairs)) {
              onAddCustomLevel({
                ...lvl,
                id: `custom-import-${Date.now()}-${Math.random()}`,
                isCustom: true,
              });
            }
          });
          setSuccessMsg(`Успішно імпортовано списки!`);
        }
      } catch (err) {
        setError('Невірний формат файлу JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
      
      {/* Header Banner */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600" />
              Власні списки та набори слів
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1">
              Додавайте власні німецькі слова, імпортуйте списки з файлів або редагуйте створені рівні.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              disabled={customLevels.length === 0}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border-2 border-slate-300 disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-4 h-4 text-orange-600" />
              <span>Експорт JSON</span>
            </button>

            <label className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border-2 border-slate-300 cursor-pointer">
              <Upload className="w-4 h-4 text-orange-600" />
              <span>Імпорт JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Form: Create Custom List */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 shadow-md mb-10">
        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-orange-500" />
          Створити новий список слів
        </h3>

        {error && (
          <div className="mb-4 bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold rounded-2xl p-3.5 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-800 font-bold rounded-2xl p-3.5 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateFromText} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                Назва списку *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Наприклад: Мої розмовні дієслова, Поїздка в Мюнхен..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 font-bold text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                Рівень
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 font-bold text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="A1">A1 (Початковий)</option>
                <option value="A2">A2 (Базовий)</option>
                <option value="B1">B1 (Середній)</option>
                <option value="B2">B2 (Просунутий)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1">
              Введіть пари слів (кожна пара з нового рядка) *
            </label>
            <textarea
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Формат:\nder Hund - собака\ndie Katze - кішка\ndas Auto - автомобіль\nessen - їсти`}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-slate-800 placeholder-slate-400 font-mono font-bold text-sm focus:outline-none focus:border-orange-500"
            />
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              Розділяйте німецьке та українське слово за допомогою дефіса (-), дорівнює (=) або двокрапки (:).
            </p>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
          >
            <Check className="w-4 h-4 text-white stroke-[3]" />
            <span>Зберегти список</span>
          </button>
        </form>
      </div>

      {/* Existing Custom Lists */}
      <div>
        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Ваші збережені списки ({customLevels.length})
        </h3>

        {customLevels.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center text-slate-700 font-bold text-sm">
            У вас поки немає доданих власних списків. Створіть новий вище або згенеруйте за допомогою Gemini AI!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customLevels.map((lvl) => {
              const globalIndex = levels.findIndex((l) => l.id === lvl.id);
              return (
                <div
                  key={lvl.id}
                  className="bg-white border-2 border-slate-300 rounded-3xl p-5 hover:border-orange-500 transition-all flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {lvl.difficulty} • {lvl.pairs.length} слів
                      </span>
                      <button
                        onClick={() => onDeleteCustomLevel(lvl.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Видалити список"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-black text-slate-800 text-base">
                      {lvl.title}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1 line-clamp-2">
                      {lvl.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectLevelToPlay(globalIndex >= 0 ? globalIndex : 0)}
                    className="mt-4 w-full py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Грати у цей список</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
