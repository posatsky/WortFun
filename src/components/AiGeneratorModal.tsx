import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, CheckCircle, PlusCircle, Volume2 } from 'lucide-react';
import { WordLevel, WordPair } from '../types';
import { audioManager } from '../utils/audio';
import { getFallbackList, generateWithClientGemini } from '../utils/geminiGenerator';

interface AiGeneratorModalProps {
  onAddCustomLevel: (level: WordLevel) => void;
  onClose?: () => void;
  onPlayLevelImmediately?: (levelId: string) => void;
}

const PRESET_TOPICS = [
  { title: 'Розмова в кав\'ярні та ресторані', level: 'A1-A2', icon: '☕' },
  { title: 'Аеропорт, вокзал та квитки', level: 'A2', icon: '✈️' },
  { title: 'Оренда квартири та побут', level: 'A2-B1', icon: '🏠' },
  { title: 'В лікарні, аптеці та у лікаря', level: 'B1', icon: '🩺' },
  { title: 'IT, програмування та робота', level: 'B1-B2', icon: '💻' },
  { title: 'Німецькі фразеологізми та ідіоми', level: 'B2', icon: '💡' },
  { title: 'Покупки в супермаркеті та одяг', level: 'A1', icon: '🛒' },
  { title: 'Погода, природа та копалини', level: 'A2', icon: '🌿' },
];

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  onAddCustomLevel,
  onPlayLevelImmediately,
}) => {
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'A1' | 'A2' | 'B1' | 'B2'>('A1');
  const [pairCount, setPairCount] = useState<number>(8);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedList, setGeneratedList] = useState<{
    title: string;
    description: string;
    category: string;
    pairs: { german: string; ukrainian: string; exampleGerman?: string; exampleUkrainian?: string }[];
  } | null>(null);

  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleGenerate = async (topicToUse?: string) => {
    const finalTopic = topicToUse || topic;
    if (!finalTopic.trim()) {
      setError('Будь ласка, вкажіть тему для генерації або оберіть зі списку.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedList(null);
    setIsSaved(false);

    try {
      const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (clientApiKey) {
        const result = await generateWithClientGemini(clientApiKey, finalTopic, difficulty, pairCount);
        setGeneratedList(result);
        return;
      }

      // Try server endpoint
      const res = await fetch('/api/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: finalTopic,
          difficulty,
          pairCount,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      
      // If endpoint returns HTML (e.g. 404 on GitHub Pages static hosting), fallback gracefully
      if (!res.ok || contentType.includes('text/html') || contentType.includes('text/plain')) {
        const fallbackData = getFallbackList(finalTopic, difficulty, pairCount);
        setGeneratedList(fallbackData);
        return;
      }

      const json = await res.json();

      if (!json.success || !json.data) {
        const fallbackData = getFallbackList(finalTopic, difficulty, pairCount);
        setGeneratedList(fallbackData);
        return;
      }

      setGeneratedList(json.data);
    } catch (err: any) {
      console.warn('Backend or Gemini call failed, using client fallback list:', err);
      // Fallback generator ensures user never sees an ugly JSON error on static hosting
      const fallbackData = getFallbackList(finalTopic, difficulty, pairCount);
      setGeneratedList(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLevel = () => {
    if (!generatedList) return;

    const newLevelId = `custom-ai-${Date.now()}`;
    const formattedPairs: WordPair[] = generatedList.pairs.map((p, idx) => ({
      id: `${newLevelId}-p${idx + 1}`,
      german: p.german,
      ukrainian: p.ukrainian,
      exampleGerman: p.exampleGerman,
      exampleUkrainian: p.exampleUkrainian,
    }));

    const newLevel: WordLevel = {
      id: newLevelId,
      levelNumber: Date.now() % 1000,
      title: generatedList.title,
      description: generatedList.description,
      category: generatedList.category || 'AI Генерація',
      difficulty: difficulty,
      isCustom: true,
      createdAt: Date.now(),
      pairs: formattedPairs,
    };

    onAddCustomLevel(newLevel);
    setIsSaved(true);

    if (onPlayLevelImmediately) {
      onPlayLevelImmediately(newLevelId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Title & Introduction Banner */}
      <div className="bg-white border-2 border-amber-200/80 rounded-3xl p-6 shadow-md mb-8 relative overflow-hidden">

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              Генератор списків слів з Gemini AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Створюйте будь-які тематичні набори німецько-українських слів з прикладами та артиклями за секунди.
            </p>
          </div>
        </div>
      </div>

      {/* Generator Controls */}
      <div className="bg-white border-2 border-amber-200/80 rounded-3xl p-6 shadow-md mb-8">
        
        {/* Topic Input */}
        <div className="mb-6">
          <label className="block text-sm font-black text-slate-800 mb-2">
            Введіть тему для вивчення слів:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Наприклад: Автомобіль та ремонт, Оренда житла, Офіс та ділові переговори..."
              className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:border-orange-500 text-sm"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-all disabled:opacity-50 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer shrink-0 active:translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Генерую...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
                  <span>Згенерувати</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Topic Presets */}
        <div className="mb-6">
          <label className="block text-xs font-black text-slate-500 mb-2.5 uppercase tracking-wider">
            Або оберіть готовий варіант:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESET_TOPICS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopic(preset.title);
                  handleGenerate(preset.title);
                }}
                disabled={isLoading}
                className="bg-amber-50/60 hover:bg-amber-100/80 border-2 border-amber-200/80 hover:border-orange-400 rounded-2xl p-3 text-left transition-all group cursor-pointer"
              >
                <div className="text-lg mb-1">{preset.icon}</div>
                <div className="font-extrabold text-xs text-slate-800 group-hover:text-orange-600 line-clamp-2">
                  {preset.title}
                </div>
                <span className="inline-block text-[10px] text-slate-500 font-extrabold mt-1">
                  Рівень {preset.level}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-amber-100">
          
          {/* Difficulty */}
          <div>
            <label className="block text-xs font-black text-slate-500 mb-2">
              Рівень складності:
            </label>
            <div className="flex gap-2">
              {(['A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                    difficulty === lvl
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Word Count */}
          <div>
            <label className="block text-xs font-black text-slate-500 mb-2">
              Кількість слів у списку:
            </label>
            <div className="flex gap-2">
              {[6, 8, 10, 12, 15].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setPairCount(cnt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                    pairCount === cnt
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold rounded-2xl p-4 mb-6 text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* GENERATED LIST PREVIEW */}
      {generatedList && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-amber-200/80 rounded-3xl p-6 shadow-md"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b-2 border-amber-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {difficulty}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {generatedList.category || 'Згенеровано Gemini AI'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-800">
                {generatedList.title}
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {generatedList.description}
              </p>
            </div>

            <button
              onClick={handleSaveLevel}
              disabled={isSaved}
              className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                isSaved
                  ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Додано до рівнів!</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-white fill-current" />
                  <span>Додати та грати зараз</span>
                </>
              )}
            </button>
          </div>

          {/* Table / Grid of Pairs */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {generatedList.pairs.map((pair, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-100 hover:border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-black text-slate-400 w-5">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 text-base">
                        {pair.german}
                      </span>
                      <button
                        onClick={() => audioManager.speakGerman(pair.german)}
                        className="p-1 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-slate-200 transition-colors"
                        title="Прослухати"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {pair.exampleGerman && (
                      <p className="text-xs text-slate-500 font-medium italic mt-0.5">
                        «{pair.exampleGerman}»
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:text-right pl-8 sm:pl-0 border-l sm:border-l-0 border-slate-200 sm:border-none">
                  <span className="font-bold text-orange-600">
                    {pair.ukrainian}
                  </span>
                  {pair.exampleUkrainian && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      ({pair.exampleUkrainian})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

        </motion.div>
      )}

    </div>
  );
};
