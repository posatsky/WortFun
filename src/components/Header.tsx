import React from 'react';
import { Volume2, VolumeX, Sparkles, BookOpen, PlusCircle, Trophy, Play, RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audio';

interface HeaderProps {
  currentTab: 'game' | 'dictionary' | 'ai' | 'custom' | 'stats';
  setCurrentTab: (tab: 'game' | 'dictionary' | 'ai' | 'custom' | 'stats') => void;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  speechEnabled: boolean;
  setSpeechEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  currentLevelNumber: number;
  totalLevels: number;
  score: number;
  streak: number;
  onResetGame?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  soundEnabled,
  setSoundEnabled,
  speechEnabled,
  setSpeechEnabled,
  currentLevelNumber,
  totalLevels,
  score,
  streak,
  onResetGame,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioManager.soundEnabled = next;
  };

  const toggleSpeech = () => {
    const next = !speechEnabled;
    setSpeechEnabled(next);
    audioManager.speechEnabled = next;
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-amber-200/80 text-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setCurrentTab('game')} 
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="bg-orange-500 p-2 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform flex items-center justify-center font-black text-lg">
              DE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-slate-800">
                  WortFun
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-300">
                  DE &rarr; UA
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 hidden sm:block">
                Німецько-українські пари слів
              </p>
            </div>
          </div>

          {/* Quick Score & Level Bar in Game Mode */}
          {currentTab === 'game' && (
            <div className="hidden md:flex items-center gap-4 bg-amber-50 px-4 py-1.5 rounded-2xl border-2 border-amber-200 text-sm font-bold">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-extrabold">Рівень:</span>
                <span className="font-black text-slate-800">{currentLevelNumber} / {totalLevels}</span>
              </div>
              <div className="h-4 w-0.5 bg-amber-300" />
              <div className="flex items-center gap-1.5 text-indigo-700">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-extrabold">Бали:</span>
                <span className="font-black text-indigo-600">{score}</span>
              </div>
              {streak > 1 && (
                <>
                  <div className="h-4 w-0.5 bg-amber-300" />
                  <div className="flex items-center gap-1 text-orange-600 font-black animate-pulse">
                    🔥 x{streak}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Buttons & Audio Toggles */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Audio Toggles */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Звукові ефекти увімкнені" : "Звукові ефекти вимкнені"}
              className={`p-2 rounded-xl text-xs font-bold transition-all border-2 ${
                soundEnabled 
                  ? 'bg-orange-100 text-orange-600 border-orange-300 shadow-sm' 
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleSpeech}
              title={speechEnabled ? "Озвучка німецьких слів увімкнена" : "Озвучка вимкнена"}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border-2 ${
                speechEnabled 
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm' 
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              <span>🗣️</span>
              <span className="hidden sm:inline">DE Озвучка</span>
            </button>

            {/* Reload/Reset current level if in game */}
            {currentTab === 'game' && onResetGame && (
              <button
                onClick={onResetGame}
                title="Перезапустити поточний рівень"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border-2 border-slate-200"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* AI Generator Shortcut */}
            <button
              onClick={() => setCurrentTab('ai')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:translate-y-0.5 ${
                currentTab === 'ai'
                  ? 'bg-indigo-600 text-white border-2 border-indigo-400'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-2 border-indigo-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>Gemini AI</span>
            </button>

          </div>
        </div>

        {/* Secondary Navigation Row */}
        <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar border-t border-amber-100 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setCurrentTab('game')}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all border-2 ${
              currentTab === 'game'
                ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                : 'bg-slate-100 text-slate-600 border-transparent hover:border-slate-300'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Грати</span>
          </button>

          <button
            onClick={() => setCurrentTab('dictionary')}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all border-2 ${
              currentTab === 'dictionary'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                : 'bg-slate-100 text-slate-600 border-transparent hover:border-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Словник та Флешкартки</span>
          </button>

          <button
            onClick={() => setCurrentTab('ai')}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all border-2 ${
              currentTab === 'ai'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                : 'bg-slate-100 text-slate-600 border-transparent hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Згенерувати список (AI)</span>
          </button>

          <button
            onClick={() => setCurrentTab('custom')}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all border-2 ${
              currentTab === 'custom'
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                : 'bg-slate-100 text-slate-600 border-transparent hover:border-slate-300'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Додати свій список</span>
          </button>

          <button
            onClick={() => setCurrentTab('stats')}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all border-2 ml-auto ${
              currentTab === 'stats'
                ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-md'
                : 'bg-slate-100 text-slate-600 border-transparent hover:border-slate-300'
            }`}
          >
            <Trophy className="w-4 h-4 text-orange-600" />
            <span className="hidden sm:inline">Прогрес</span>
          </button>
        </div>

      </div>
    </header>
  );
};
